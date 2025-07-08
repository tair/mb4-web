<script setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useSearchResultsStore } from '@/stores/SearchResultsStore'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore.js'
import ToggleLinks from '@/components/ToggleLinks.vue'
import { getBestMediaUrl } from '@/utils/mediaUtils'

const searchResultsStore = useSearchResultsStore()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const searching = ref(false)
const localSearch = ref(route.query.q || '')

// Filter toggles for each section
const projectsFilter = ref('all')
const mediaFilter = ref('all')
const mediaViewsFilter = ref('all')
const specimensFilter = ref('all')
const charactersFilter = ref('all')
const taxaFilter = ref('all')
const matricesFilter = ref('all')
const referencesFilter = ref('all')

onMounted(() => {
  doSearch(route.query.q || '')
})

function doSearch(q) {
  searching.value = true
  const searchTerm = q || ''
  const query = { searchTerm }
  // If user is admin, add published: false to query
  if (authStore.isUserAdministrator || authStore.isUserCurator) {
    query.published = false
  }
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
  if (!text) return 'Unknown'
  return text.length > max ? text.slice(0, max) + '…' : text
}

function truncateProjectName(text, max = 40) {
  if (!text) return 'Unknown'
  return text.length > max ? text.slice(0, max) + '…' : text
}

function filterByPublished(list, filterKey = 'all') {
  if (filterKey === 'published')
    return list.filter((item) => item.published == 1 || item.published === true)
  if (filterKey === 'unpublished')
    return list.filter(
      (item) => item.published == 0 || item.published === false
    )
  return list
}

const filteredProjects = computed(() =>
  filterByPublished(
    searchResultsStore.results.projects || [],
    projectsFilter.value
  )
)
const filteredMedia = computed(() =>
  filterByPublished(searchResultsStore.results.media || [], mediaFilter.value)
)
const filteredMediaDisplay = computed(() => filteredMedia.value.slice(0, 100))
const filteredMediaViews = computed(() =>
  filterByPublished(
    searchResultsStore.results.media_views || [],
    mediaViewsFilter.value
  )
)
const filteredSpecimens = computed(() =>
  filterByPublished(
    searchResultsStore.results.specimens || [],
    specimensFilter.value
  )
)
const filteredCharacters = computed(() =>
  filterByPublished(
    searchResultsStore.results.characters || [],
    charactersFilter.value
  )
)
const filteredReferences = computed(() =>
  filterByPublished(
    searchResultsStore.results.references || [],
    referencesFilter.value
  )
)
const filteredMatrices = computed(() =>
  filterByPublished(
    searchResultsStore.results.matrices || [],
    matricesFilter.value
  )
)
const filteredTaxa = computed(() =>
  filterByPublished(searchResultsStore.results.taxa || [], taxaFilter.value)
)

const searchingProjects = computed(() => searchResultsStore.searching?.projects)
const searchingMedia = computed(() => searchResultsStore.searching?.media)
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

// Helper to format authors array as a string
function formatAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) return ''
  return authors
    .map((a) => {
      let name = a.surname || ''
      if (a.forename) name += ', ' + a.forename
      return name
    })
    .join('; ')
}
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
        <b v-if="!authStore.isUserAdministrator">published</b>
        <b v-else>published and unpublished</b>
        projects.
      </template>
      <template v-else> Please enter a search term to see results. </template>
    </div>

    <!-- Projects Section -->
    <div class="bg-light p-2 mb-2">
      <b>Projects ({{ filteredProjects.length }})</b>
      <ToggleLinks
        v-if="authStore.isUserAdministrator || authStore.isUserCurator"
        v-model="projectsFilter"
      />
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingProjects">
        <i class="fas fa-spinner fa-spin"></i> Searching projects...
      </template>
      <template v-else>
        <div v-if="!filteredProjects.length">No projects were found</div>
        <div v-else>
          <div
            v-for="project in filteredProjects"
            :key="project.project_id"
            class="mb-2"
          >
            <a
              :href="`/project/${project.project_id}/overview`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="text-mb fw-bold"
                >M{{ project.project_id }}- {{ project.name }}</span
              >
            </a>
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
      <b>Media ({{ filteredMedia.length }})</b>
      <span v-if="filteredMedia.length > 100" class="text-muted small"
        >&nbsp;Showing first 100</span
      >
      <ToggleLinks
        v-if="authStore.isUserAdministrator || authStore.isUserCurator"
        v-model="mediaFilter"
      />
    </div>
    <div class="border p-2 mb-3" style="max-height: 400px; overflow-y: auto">
      <template v-if="searchingMedia">
        <i class="fas fa-spinner fa-spin"></i> Searching media...
      </template>
      <template v-else>
        <div v-if="!filteredMedia.length">No media were found</div>
        <div v-else>
          <div
            v-for="item in filteredMediaDisplay"
            :key="item.media_id"
            class="d-flex align-items-start mb-2 pb-2 border-bottom"
            style="min-height: 60px"
          >
            <img
              v-if="item.media"
              :src="getBestMediaUrl(item.media, ['thumbnail'], item.project_id, item.media_id)"
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
              <div class="text-muted fst-italic">
                {{ item.genus }} {{ item.specific_epithet }}
                <template v-if="item.reference_source == 1">
                  (unvouchered)
                </template>
                <template v-else>
                  ({{ item.institution_code }}:{{ item.catalog_number }})
                </template>
              </div>
              <div class="text-muted small mb-1">
                from <b>P{{ item.project_id }}</b>
                <span v-if="item.project_name">
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
      <b>Media Views ({{ filteredMediaViews.length }})</b>
      <ToggleLinks
        v-if="authStore.isUserAdministrator || authStore.isUserCurator"
        v-model="mediaViewsFilter"
      />
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingMediaViews">
        <i class="fas fa-spinner fa-spin"></i> Searching media views...
      </template>
      <template v-else>
        <div v-if="!filteredMediaViews.length">No media views were found</div>
        <div v-else>
          <div
            v-for="item in filteredMediaViews"
            :key="item.view_id"
            class="mb-1"
          >
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
      <b>Specimens ({{ filteredSpecimens.length }})</b>
      <ToggleLinks
        v-if="authStore.isUserAdministrator || authStore.isUserCurator"
        v-model="specimensFilter"
      />
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingSpecimens">
        <i class="fas fa-spinner fa-spin"></i> Searching specimens...
      </template>
      <template v-else>
        <div v-if="!filteredSpecimens.length">No specimens were found</div>
        <div v-else>
          <div
            v-for="item in filteredSpecimens"
            :key="item.specimen_id"
            class="mb-1"
          >
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
              <span class="text-mb small">
                <template v-if="item.reference_source == 1">
                  (unvouchered)
                </template>
                <template v-else>
                  ({{ item.institution_code }}:{{ item.catalog_number }})
                </template>
              </span>
            </a>
            <span v-if="!item.reference_source != 1" class="text-mb small"
              >&nbsp;(unvouchered)</span
            >
            <span class="text-muted small">
              from <b>P{{ item.project_id }}</b>
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
      <b>Characters ({{ filteredCharacters.length }})</b>
      <ToggleLinks
        v-if="authStore.isUserAdministrator || authStore.isUserCurator"
        v-model="charactersFilter"
      />
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingCharacters">
        <i class="fas fa-spinner fa-spin"></i> Searching characters...
      </template>
      <template v-else>
        <div v-if="!filteredCharacters.length">No characters were found</div>
        <div v-else>
          <div
            v-for="item in filteredCharacters"
            :key="item.character_id"
            class="mb-1"
          >
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
      <b>Taxa ({{ filteredTaxa.length }})</b>
      <ToggleLinks
        v-if="authStore.isUserAdministrator || authStore.isUserCurator"
        v-model="taxaFilter"
      />
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingTaxa">
        <i class="fas fa-spinner fa-spin"></i> Searching taxa...
      </template>
      <template v-else>
        <div v-if="!filteredTaxa.length">No taxa were found</div>
        <div v-else>
          <div v-for="item in filteredTaxa" :key="item.taxon_id" class="mb-1">
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
      <b>Matrices ({{ filteredMatrices.length }})</b>
      <ToggleLinks
        v-if="authStore.isUserAdministrator || authStore.isUserCurator"
        v-model="matricesFilter"
      />
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingMatrices">
        <i class="fas fa-spinner fa-spin"></i> Searching matrices...
      </template>
      <template v-else>
        <div v-if="!filteredMatrices.length">No matrices were found</div>
        <div v-else>
          <div
            v-for="item in filteredMatrices"
            :key="item.matrix_id"
            class="mb-1"
          >
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
      <b>References ({{ filteredReferences.length }})</b>
      <ToggleLinks
        v-if="authStore.isUserAdministrator || authStore.isUserCurator"
        v-model="referencesFilter"
      />
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <template v-if="searchingReferences">
        <i class="fas fa-spinner fa-spin"></i> Searching references...
      </template>
      <template v-else>
        <div v-if="!filteredReferences.length">No references were found</div>
        <div v-else>
          <div
            v-for="item in filteredReferences"
            :key="item.reference_id"
            class="mb-1"
          >
            <a
              :href="`/project/${item.project_id}/specimens`"
              target="_blank"
              rel="noopener noreferrer"
              ><span class="text-mb fw-bold" v-if="item.article_title">
                {{ truncate(item.article_title, 50) }}</span
              ></a
            >
            <br />
            <span class="text-muted small">
              <template v-if="item.authors">{{
                formatAuthors(item.authors)
              }}</template>
              <template v-if="item.pubyear"> ({{ item.pubyear }})</template>
            </span>
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
  </div>
</template>
