<script setup>
import { ref, computed } from 'vue'
import { useHomePageAdminStore } from '@/stores/HomePageAdminStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'

const store = useHomePageAdminStore()
const { showSuccess, showError } = useNotifications()

const selectedProjectId = ref('')

// Filter out projects that are already featured
const availableProjects = computed(() => {
  const featuredIds = new Set(
    store.featuredProjects.map((fp) => fp.project_id)
  )
  return store.publishedProjects.filter(
    (p) => !featuredIds.has(p.project_id)
  )
})

async function handleAdd() {
  if (!selectedProjectId.value) {
    showError('Please select a project')
    return
  }

  try {
    await store.addFeaturedProject(parseInt(selectedProjectId.value))
    showSuccess('Project added to featured list')
    selectedProjectId.value = ''
  } catch (error) {
    showError(error.message || 'Failed to add featured project')
  }
}

async function handleRemove(featuredProject) {
  const projectName =
    featuredProject.projectName || `Project ${featuredProject.project_id}`
  if (
    !confirm(`Are you sure you want to remove "${projectName}" from featured?`)
  ) {
    return
  }

  try {
    await store.removeFeaturedProject(featuredProject.featured_project_id)
    showSuccess('Project removed from featured list')
  } catch (error) {
    showError(error.message || 'Failed to remove featured project')
  }
}
</script>

<template>
  <div class="featured-projects-section">
    <!-- Info -->
    <div class="alert alert-info mb-4">
      <i class="fa fa-info-circle me-2"></i>
      <strong>Featured Projects</strong> are displayed in a slideshow on the
      homepage. All featured projects will be shown. If no projects are
      featured, a selection of published projects will be shown at random.
    </div>

    <!-- Form -->
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="card-title mb-0 text-white">
          <i class="fa fa-plus me-2"></i>
          Add Featured Project
        </h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleAdd">
          <div class="row align-items-end">
            <div class="col-md-8">
              <div class="mb-3 mb-md-0">
                <label class="form-label">
                  <strong>Select Project</strong>
                </label>
                <select v-model="selectedProjectId" class="form-select">
                  <option value="">Select a project to feature...</option>
                  <option
                    v-for="project in availableProjects"
                    :key="project.project_id"
                    :value="project.project_id"
                  >
                    P{{ project.project_id }}: {{ project.name.substring(0, 60) }}{{ project.name.length > 60 ? '...' : '' }}
                  </option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <button
                type="submit"
                class="btn btn-primary w-100"
                :disabled="store.isSaving || !selectedProjectId"
              >
                <span v-if="store.isSaving">
                  <span
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Adding...
                </span>
                <span v-else>
                  <i class="fa fa-plus me-2"></i>Add to Featured
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Featured Projects List -->
    <div class="card">
      <div class="card-header">
        <h5 class="card-title mb-0 text-white">
          <i class="fa fa-star me-2"></i>
          Featured Projects ({{ store.featuredProjects.length }})
        </h5>
      </div>
      <div class="card-body">
        <div
          v-if="store.featuredProjects.length === 0"
          class="text-center text-muted py-4"
        >
          <i class="fa fa-star fa-3x mb-3"></i>
          <p class="mb-2">
            <strong>No projects are currently featured.</strong>
          </p>
          <p>
            A selection of published projects will be chosen at random for
            display on the home page.
          </p>
        </div>

        <div v-else>
          <ul class="list-group">
            <li
              v-for="fp in store.featuredProjects"
              :key="fp.featured_project_id"
              class="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <strong class="text-primary">P{{ fp.project_id }}</strong>:
                {{ fp.projectName || 'Unknown Project' }}
              </div>
              <button
                class="btn btn-sm btn-outline-danger"
                title="Remove from featured"
                @click="handleRemove(fp)"
              >
                <i class="fa fa-times me-1"></i> Remove
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.list-group-item {
  transition: background-color 0.15s ease;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}
</style>

