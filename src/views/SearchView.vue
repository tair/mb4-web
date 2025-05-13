<script setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useSearchResultsStore } from '@/stores/SearchResultsStore'
import { useRoute, useRouter } from 'vue-router'

const searchResultsStore = useSearchResultsStore()
const route = useRoute()
const router = useRouter()
const searching = ref(false)
const localSearch = ref(route.query.q || '')

onMounted(() => {
  doSearch(route.query.q || '')
})

function doSearch(q) {
  searching.value = true
  const searchTerm = q || ''
  const query = { searchTerm }
  // fetchResults can be async or return a promise
  const result = searchResultsStore.fetchResults(query)
  if (result && typeof result.then === 'function') {
    result.finally(() => {
      searching.value = false
    })
  } else {
    searching.value = false
  }
}

function submitSearch() {
  if (localSearch.value.trim() && localSearch.value !== route.query.q) {
    // update the route, which will trigger a new search
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // use router to push new query
    router.push({ name: 'SearchView', query: { q: localSearch.value } })
  }
}

watch(
  () => route.query.q,
  (newQ, oldQ) => {
    if (newQ !== oldQ) {
      doSearch(newQ)
    }
  }
)

// Helper to truncate text with ellipsis
function truncate(text, max = 100) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

function truncateProjectName(text, max = 40) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

const projects = computed(() => searchResultsStore.results.projects || [])
const media = computed(() => searchResultsStore.results.media || [])
const mediaDisplay = computed(() => media.value.slice(0, 100))
const searchingProjects = computed(() => searchResultsStore.searching?.projects)
const searchingMedia = computed(() => searchResultsStore.searching?.media)

const media_views = computed(() => searchResultsStore.results.media_views || [])
const specimens = computed(() => searchResultsStore.results.specimens || [])
const characters = computed(() => searchResultsStore.results.characters || [])
const references = computed(() => searchResultsStore.results.references || [])
const matrices = computed(() => searchResultsStore.results.matrices || [])
const taxa = computed(() => searchResultsStore.results.taxa || [])

const searchingMediaViews = computed(
  () => searchResultsStore.searching?.media_views
)
const searchingSpecimens = computed(
  () => searchResultsStore.searching?.specimens
)
const searchingCharacters = computed(
  () => searchResultsStore.searching?.characters
)
const searchingReferences = computed(
  () => searchResultsStore.searching?.references
)
const searchingMatrices = computed(() => searchResultsStore.searching?.matrices)
const searchingTaxa = computed(() => searchResultsStore.searching?.taxa)
</script>

<template>
  <div>
    <div class="container-fluid mb-4">
      <form class="row justify-content-center" @submit.prevent="submitSearch">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="input-group">
            <input
              v-model="localSearch"
              class="form-control"
              type="search"
              placeholder="Search published projects..."
              aria-label="Search"
              :disabled="searching"
              @keyup.enter="submitSearch"
            />
            <button class="btn btn-primary" type="submit" :disabled="searching">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>
      </form>
    </div>
    <h1>Search</h1>
    <div class="mb-3">
      <template v-if="route.query.q">
        You searched for <i>{{ route.query.q }}</i> in all
        <b>published</b> projects.
      </template>
      <template v-else> Please enter a search term to see results. </template>
    </div>

    <!-- Projects Section -->
    <div class="bg-light p-2 mb-2">
      <b>Projects ({{ projects.length }})</b>
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingProjects">
        <i class="fas fa-spinner fa-spin"></i> Searching projects...
      </template>
      <template v-else>
        <div v-if="!projects.length">No projects were found</div>
        <div v-else>
          <div
            v-for="project in projects"
            :key="project.project_id"
            class="mb-2"
          >
            <span class="text-mb fw-bold">{{ project.project_id }}</span> -
            {{ project.name }}
            <template
              v-if="
                project.article_authors ||
                project.journal_year ||
                project.journal_title
              "
            >
              <br />
              <span class="text-muted small">
                <template v-if="project.article_authors">{{
                  project.article_authors
                }}</template>
                <template v-if="project.journal_year">
                  ({{ project.journal_year }})</template
                >
                <template v-if="project.journal_title"
                  >. {{ project.journal_title }}</template
                >
              </span>
            </template>
          </div>
        </div>
      </template>
    </div>

    <!-- Media Section -->
    <div class="bg-light p-2 mb-2">
      <b>Media ({{ media.length }})</b>
      <span v-if="media.length > 100" class="text-muted small"
        >&nbsp;Showing first 100</span
      >
    </div>
    <div class="border p-2 mb-3" style="max-height: 400px; overflow-y: auto">
      <template v-if="searchingMedia">
        <i class="fas fa-spinner fa-spin"></i> Searching media...
      </template>
      <template v-else>
        <div v-if="!media.length">No media were found</div>
        <div v-else>
          <div
            v-for="item in mediaDisplay"
            :key="item.media_id"
            class="d-flex align-items-start mb-2 pb-2 border-bottom"
            style="min-height: 60px"
          >
            <img
              v-if="item.media && item.media.icon && item.media.icon.FILENAME"
              :src="`https://dev.morphobank.org/media/morphobank3/images/${item.media.icon.FILENAME}`"
              alt="thumb"
              class="me-2 flex-shrink-0 bg-light border"
              style="width: 60px; height: 60px; object-fit: contain"
            />
            <div class="flex-grow-1">
              <a
                :href="`/project/${item.project_id}/overview`"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div class="fw-bold">M{{ item.media_id }}</div>
              </a>
              <div class="text-muted small mb-1">
                from P{{ item.project_id
                }}<span v-if="item.project_name">
                  - {{ truncateProjectName(item.project_name, 40) }}</span
                >
              </div>
              <div class="small" v-if="item.notes">
                {{ truncate(item.notes, 100) }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Media Views Section -->
    <div class="bg-light p-2 mb-2">
      <b>Media Views ({{ media_views.length }})</b>
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingMediaViews">
        <i class="fas fa-spinner fa-spin"></i> Searching media views...
      </template>
      <template v-else>
        <div v-if="!media_views.length">No media views were found</div>
        <div v-else>
          <div v-for="item in media_views" :key="item.view_id" class="mb-1">
            <a
              :href="`/project/${item.project_id}/overview`"
              target="_blank"
              rel="noopener noreferrer"
              ><span class="text-mb fw-bold">{{ item.view_name }}</span></a
            >

            <span class="text-muted small fw-bold">
              from P{{ item.project_id }}
            </span>
            <span class="text-muted small">
              - {{ truncateProjectName(item.project_name, 40) }}</span
            >
          </div>
        </div>
      </template>
    </div>

    <!-- Specimens Section -->
    <div class="bg-light p-2 mb-2">
      <b>Specimens ({{ specimens.length }})</b>
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingSpecimens">
        <i class="fas fa-spinner fa-spin"></i> Searching specimens...
      </template>
      <template v-else>
        <div v-if="!specimens.length">No specimens were found</div>
        <div v-else>
          <div v-for="item in specimens" :key="item.specimen_id" class="mb-1">
            <a
              :href="`/project/${item.project_id}/specimens`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="text-mb fw-bold">
                {{
                  item.genus || item.specific_epithet
                    ? (
                        (item.genus || '') +
                        ' ' +
                        (item.specific_epithet || '')
                      ).trim()
                    : 'Unknown'
                }}
              </span>
            </a>
            <span v-if="!item.reference_source != 1" class="text-mb small"
              >&nbsp;(unvouchered)</span
            >
            <span class="text-muted small fw-bold">
              from P{{ item.project_id }}
            </span>
            <span class="text-muted small">
              - {{ truncateProjectName(item.project_name, 40) }}</span
            >
          </div>
        </div>
      </template>
    </div>

    <!-- Characters Section -->
    <div class="bg-light p-2 mb-2">
      <b>Characters ({{ characters.length }})</b>
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingCharacters">
        <i class="fas fa-spinner fa-spin"></i> Searching characters...
      </template>
      <template v-else>
        <div v-if="!characters.length">No characters were found</div>
        <div v-else>
          <div v-for="item in characters" :key="item.character_id" class="mb-1">
            <a
              :href="`/project/${item.project_id}/overview`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="text-mb fw-bold">{{ item.name }}</span>
            </a>
            <span class="text-muted small fw-bold">
              from P{{ item.project_id }}
            </span>
            <span class="text-muted small">
              - {{ truncateProjectName(item.project_name, 40) }}</span
            >
          </div>
        </div>
      </template>
    </div>

    <!-- Taxa Section -->
    <div class="bg-light p-2 mb-2">
      <b>Taxa ({{ taxa.length }})</b>
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingTaxa">
        <i class="fas fa-spinner fa-spin"></i> Searching taxa...
      </template>
      <template v-else>
        <div v-if="!taxa.length">No taxa were found</div>
        <div v-else>
          <div v-for="item in taxa" :key="item.taxon_id" class="mb-1">
            <a
              :href="`/project/${item.project_id}/taxa`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="text-mb fw-bold"
                >{{ item.genus }} {{ item.specific_epithet }}</span
              >
            </a>
            <span class="text-muted small fw-bold">
              from P{{ item.project_id }}
            </span>
            <span class="text-muted small">
              - {{ truncateProjectName(item.project_name, 40) }}</span
            >
          </div>
        </div>
      </template>
    </div>

    <!-- Matrices Section -->
    <div class="bg-light p-2 mb-2">
      <b>Matrices ({{ matrices.length }})</b>
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingMatrices">
        <i class="fas fa-spinner fa-spin"></i> Searching matrices...
      </template>
      <template v-else>
        <div v-if="!matrices.length">No matrices were found</div>
        <div v-else>
          <div v-for="item in matrices" :key="item.matrix_id" class="mb-1">
            <a
              :href="`/project/${item.project_id}/overview`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="text-mb fw-bold"
                >M{{ item.matrix_id }} {{ item.title }}</span
              >
            </a>
            <span class="text-muted small fw-bold">
              from P{{ item.project_id }}
            </span>
            <span class="text-muted small">
              - {{ truncateProjectName(item.project_name, 40) }}</span
            >
          </div>
        </div>
      </template>
    </div>

    <!-- References Section -->
    <div class="bg-light p-2 mb-2">
      <b>References ({{ references.length }})</b>
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingReferences">
        <i class="fas fa-spinner fa-spin"></i> Searching references...
      </template>
      <template v-else>
        <div v-if="!references.length">No references were found</div>
        <div v-else>
          <div v-for="item in references" :key="item.reference_id" class="mb-1">
            <span class="text-mb fw-bold">R{{ item.reference_id }}</span> -
            {{ truncate(item.authors, 50) }} ({{ item.year }})
            {{ truncate(item.title, 50) }}
            <span class="text-muted small">(P{{ item.project_id }})</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
