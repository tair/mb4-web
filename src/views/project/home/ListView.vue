<script setup>
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useRouter } from 'vue-router'
import ProjectCard from '@/views/project/home/ProjectCard.vue'
import FormLayout from '@/components/main/FormLayout.vue'
import axios from 'axios'

const projectsStore = useProjectsStore()
const authStore = useAuthStore()
const router = useRouter()

// Curator project selector state
const curatorProjects = ref([])
const selectedCuratorProject = ref(null)
const userCanCurate = computed(() => authStore.isUserCurator)
const searchQuery = ref('')
const isDropdownOpen = ref(false)
const dropdownRef = ref(null)
const isLoadingCuratorProjects = ref(false)
const isRefreshing = ref(false)

// Add computed property for filtered curator projects
const filteredCuratorProjects = computed(() => {
  if (!searchQuery.value) return curatorProjects.value
  const query = searchQuery.value.toLowerCase()
  return curatorProjects.value.filter(
    (project) =>
      project.name.toLowerCase().includes(query) ||
      project.project_id.toString().includes(query)
  )
})

// Add click outside handler
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

onMounted(async () => {
  // Fetch projects with smart caching (will refresh if data is stale)
  await projectsStore.fetchProjects()

  // Check if user has curator permissions and fetch curator projects
  try {
    // Fetch curator projects if user has curator permissions
    if (userCanCurate.value) {
      isLoadingCuratorProjects.value = true
      const curatorResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/projects/curator-projects`
      )
      curatorProjects.value = curatorResponse.data.projects || []
    }
  } catch (error) {
    console.error('Error fetching curator projects:', error)
  } finally {
    isLoadingCuratorProjects.value = false
  }

  // Add click outside event listener
  document.addEventListener('click', handleClickOutside)
})

// Clean up event listener
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const publishedProjects = computed(() =>
  projectsStore.projects.filter((p) => p.published)
)
const unpublishedProjects = computed(() =>
  projectsStore.projects.filter((p) => !p.published)
)

// Curator project selector method
async function selectCuratorProject() {
  if (!selectedCuratorProject.value) {
    return
  }
  router.push(`/myprojects/${selectedCuratorProject.value}/overview`)
}

// Refresh projects method
async function refreshProjects() {
  isRefreshing.value = true
  try {
    await projectsStore.fetchProjects(true) // Force refresh
  } catch (error) {
    console.error('Error refreshing projects:', error)
  } finally {
    isRefreshing.value = false
  }
}
</script>
<template>
  <FormLayout title="MY PROJECTS">
    <div class="my-projects-container">
      <!-- Curator Project Selector -->
      <div class="row">
        <div class="col-md-3"><h3>My Projects</h3></div>
        <div class="col-md-9">
          <div class="mb-2">
            You have {{ projectsStore.projects.length }} projects in Morphobank.
          </div>
          <div v-if="projectsStore.projects.length">
            <b class="me-2">Jump to:</b>
            <a href="#unpublished" v-if="unpublishedProjects.length"
              >{{ unpublishedProjects.length }} Unpublished Projects</a
            >
            <span
              v-if="unpublishedProjects.length && publishedProjects.length"
              class="ms-2 me-2"
              >|</span
            >
            <a href="#published" v-if="publishedProjects.length"
              >{{ publishedProjects.length }} Published Projects</a
            >
          </div>
          <div class="mt-3 d-flex gap-2">
            <RouterLink :to="`/myprojects/create`">
              <button type="button" class="btn btn-primary">
                Create New Project
              </button>
            </RouterLink>
            <button 
              type="button" 
              class="btn btn-outline-primary"
              @click="refreshProjects"
              :disabled="isRefreshing"
            >
              <i class="fa-solid fa-refresh" :class="{ 'fa-spin': isRefreshing }"></i>
              Refresh Projects
            </button>
          </div>
        </div>
      </div>
      <div v-if="userCanCurate" class="mb-4">
        <hr />
        <h3 class="mb-3">Curator access</h3>
        <form
          @submit.prevent="selectCuratorProject"
          class="d-flex align-items-center gap-2"
        >
          <div class="searchable-dropdown flex-grow-1" ref="dropdownRef">
            <div
              class="dropdown-input"
              @click="isDropdownOpen = !isDropdownOpen"
            >
              <input
                type="text"
                class="form-control"
                v-model="searchQuery"
                placeholder="Search and select a project..."
                @click.stop="
                  () => {
                    isDropdownOpen = true
                    searchQuery = '' // Clear search when opening dropdown
                  }
                "
                @input="isDropdownOpen = true"
              />
              <span class="dropdown-arrow">▼</span>
            </div>
            <div v-if="isDropdownOpen" class="dropdown-options">
              <div
                v-if="isLoadingCuratorProjects"
                class="dropdown-option loading"
              >
                <span
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Loading projects...
              </div>
              <template v-else>
                <div
                  v-for="project in filteredCuratorProjects"
                  :key="project.project_id"
                  class="dropdown-option"
                  :class="{
                    selected: selectedCuratorProject === project.project_id,
                  }"
                  @click="
                    () => {
                      selectedCuratorProject = project.project_id
                      searchQuery = `[P${project.project_id}${
                        project.published ? '; PUBLISHED' : ''
                      }] ${project.name.substring(0, 100)}`
                      isDropdownOpen = false
                    }
                  "
                >
                  [P{{ project.project_id
                  }}{{ project.published ? '; PUBLISHED' : '' }}]
                  {{ project.name.substring(0, 100) }}
                </div>
                <div
                  v-if="filteredCuratorProjects.length === 0"
                  class="dropdown-option no-results"
                >
                  No projects found
                </div>
              </template>
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Go</button>
        </form>
      </div>
      <div v-if="unpublishedProjects.length">
        <hr />
        <a name="unpublished"></a>
        <h3 class="mb-3">Unpublished Projects</h3>

        <ProjectCard
          v-for="project in unpublishedProjects"
          :key="project.project_id"
          :project="project"
        >
        </ProjectCard>
      </div>
      <div v-if="publishedProjects.length">
        <hr />
        <a name="published"></a>
        <h3 class="mb-3">Published Projects</h3>
        <ProjectCard
          v-for="project in publishedProjects"
          :key="project.project_id"
          :project="project"
        >
        </ProjectCard>
      </div>

      <div v-if="!projectsStore.projects.length" class="no-projects mt-4">
        <p>You don't have any projects yet.</p>
        <RouterLink :to="`/myprojects/create`">
          <button type="button" class="btn btn-primary">
            Create New Project
          </button>
        </RouterLink>
      </div>
    </div>
  </FormLayout>
</template>
<style scoped>
.my-projects-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.searchable-dropdown {
  position: relative;
  width: 100%;
  margin-bottom: 0;
}

.dropdown-input {
  position: relative;
  display: flex;
  align-items: center;
  height: 38px;
}

.dropdown-input input {
  width: 100%;
  padding-right: 30px;
  cursor: pointer;
  height: 38px;
}

.dropdown-arrow {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: #666;
}

.dropdown-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  z-index: 1000;
  margin-top: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dropdown-option {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  color: #666;
}

.dropdown-option:last-child {
  border-bottom: none;
}

.dropdown-option:hover {
  background-color: #f5f5f5;
}

.dropdown-option.selected {
  background-color: #e9ecef;
}

.no-results {
  color: #666;
  font-style: italic;
}

.curator-section select {
  width: 100%;
}

.no-projects {
  text-align: center;
  padding: 30px;
  background-color: #f8f9fa;
  border-radius: 5px;
  color: #666;
}

/* Add styles for the search input */
.form-control {
  margin-bottom: 0.5rem;
}

.dropdown-option.loading {
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.spinner-border {
  width: 1rem;
  height: 1rem;
  border-width: 0.15em;
}

h3 {
  color: #444;
  font-weight: 500;
}

a {
  color: var(--mb-orange);
  text-decoration: none;
}

a:hover {
  color: var(--mb-orange-hover);
  text-decoration: underline;
}

b,
strong {
  font-weight: 500;
}

/* Add styles for the form container */
form.d-flex {
  display: flex;
  align-items: stretch;
}

form.d-flex button {
  height: 38px;
  margin-left: 8px;
}
</style>
