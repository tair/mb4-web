<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { getTaxonForMediaId } from '@/views/project/utils'
import { TaxaFriendlyNames, nameColumnMap } from '@/utils/taxa'
// import { logDownload, DOWNLOAD_TYPES } from '@/lib/analytics.js'
import FilterDialog from '@/views/project/media/FilterDialog.vue'
import EditBatchDialog from '@/views/project/media/EditBatchDialog.vue'
import DeleteDialog from '@/views/project/media/DeleteDialog.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MediaCard from '@/components/project/MediaCard.vue'
import { buildMediaUrl } from '@/utils/mediaUtils.js'

const route = useRoute()
const projectId = parseInt(route.params.id)

const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const projectUsersStore = useProjectUsersStore()
const isLoaded = computed(
  () =>
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded &&
    projectUsersStore.isLoaded
)

const mediaToDelete = ref([])
const sortFunction = ref(sortByMediaId)
const thumbnailView = ref(true)
const searchStr = ref('')
const selectedPage = ref(1)
const selectedPageSize = ref(25)

const filters = reactive({
  released: (media) => media.cataloguing_status == 0,
})

const filteredMedia = computed(() => {
  let media = Object.values(filters)
    .reduce((media, filter) => media.filter(filter), mediaStore.media)
    .sort(sortFunction.value)
  
  // Apply search filter if search string exists
  if (searchStr.value && searchStr.value.trim()) {
    const searchLower = searchStr.value.toLowerCase().trim()
    media = media.filter(m => {
      const mediaIdStr = `M${m.media_id}`.toLowerCase()
      const viewName = mediaViewsStore.getMediaViewById(m.view_id)?.name?.toLowerCase() || ''
      const taxon = getTaxon(m)
      const taxonName = taxon ? Object.values(taxon).join(' ').toLowerCase() : ''
      const user = getUser(m)
      const userName = user ? `${user.fname} ${user.lname}`.toLowerCase() : ''
      
      return mediaIdStr.includes(searchLower) ||
             viewName.includes(searchLower) ||
             taxonName.includes(searchLower) ||
             userName.includes(searchLower)
    })
  }
  
  return media
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredMedia.value.length / selectedPageSize.value))
const paginatedMedia = computed(() => {
  const start = (selectedPage.value - 1) * selectedPageSize.value
  const end = start + selectedPageSize.value
  return filteredMedia.value.slice(start, end)
})

const uncuratedMediaCount = computed(
  () => mediaStore.media.filter((m) => m.cataloguing_status == 1).length
)

const allSelected = computed({
  get: function () {
    return paginatedMedia.value.every((b) => b.selected)
  },
  set: function (value) {
    paginatedMedia.value.forEach((b) => {
      b.selected = value
    })
  },
})

const someSelected = computed(() => paginatedMedia.value.some((b) => b.selected))

async function batchEdit(json) {
  const mediaIds = filteredMedia.value
    .filter((m) => m.selected)
    .map((m) => m.media_id)
  return mediaStore.editIds(projectId, mediaIds, json)
}

onMounted(() => {
  if (!mediaStore.isLoaded) {
    mediaStore.fetchMedia(projectId)
  }
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
  if (!mediaViewsStore.isLoaded) {
    mediaViewsStore.fetchMediaViews(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})

function refresh() {
  mediaStore.fetchMedia(projectId)
  specimensStore.fetchSpecimens(projectId)
  taxaStore.fetch(projectId)
  mediaViewsStore.fetchMediaViews(projectId)
}

const baseUrl = `${import.meta.env.VITE_API_URL}/projects/${projectId}/media`
function onClickDownloadOriginalFilenames() {
  const url = `${baseUrl}/download/filenames`
  window.location.href = url
  // logDownload({ project_id: projectId, download_type: DOWNLOAD_TYPES.MEDIA })
}

function onSelectShow(event) {
  const value = event.target.value
  switch (value) {
    case 'identified':
      filters.show = (a) => a.specimen_id != null
      break
    case 'unidentified':
      filters.show = (a) => a.specimen_id == null
      break
    case 'copyrighted':
      filters.show = (a) => a.is_copyrighted
      break
    case 'noncopyrighted':
      filters.show = (a) => !a.is_copyrighted
      break
    case 'all':
    default:
      delete filters.show
      break
  }
}

function onSelectSort(event) {
  const value = event.target.value
  switch (value) {
    case TaxaFriendlyNames.PHYLUM:
    case TaxaFriendlyNames.CLASS:
    case TaxaFriendlyNames.ORDER:
    case TaxaFriendlyNames.SUPERFAMILY:
    case TaxaFriendlyNames.FAMILY:
    case TaxaFriendlyNames.SUBFAMILY:
    case TaxaFriendlyNames.GENUS:
      sortFunction.value = sortByTaxonRank(value)
      break
    case 'view':
      sortFunction.value = sortByViewName
      break
    case 'snumber':
      sortFunction.value = sortBySpecimenId
      break
    case 'user':
      sortFunction.value = sortByUserName
      break
    case 'mnumber':
    default:
      sortFunction.value = sortByMediaId
      break
  }
}

function sortByMediaId(a, b) {
  return a.media_id < b.media_id ? -1 : 1
}

function sortBySpecimenId(a, b) {
  return a.specimen_id < b.specimen_id ? -1 : 1
}

function sortByViewName(a, b) {
  const viewA = getView(a)
  const viewB = getView(b)

  const nameA = viewA?.name ?? ''
  const nameB = viewB?.name ?? ''
  const compare = nameA.localeCompare(nameB)
  return compare ?? sortByMediaId(a, b)
}

function sortByUserName(a, b) {
  const userA = getUser(a)
  const userB = getUser(b)

  const fnameA = userA?.fname ?? ''
  const fnameB = userB?.fname ?? ''
  let compare = fnameA.localeCompare(fnameB)
  if (compare) {
    return compare
  }

  const lnameA = userA?.lname ?? ''
  const lnameB = userB?.lname ?? ''
  compare = lnameA.localeCompare(lnameB)
  return compare ?? sortByMediaId(a, b)
}

function sortByTaxonRank(taxonRank) {
  return (a, b) => {
    const taxonA = getTaxon(a)
    if (taxonA == null) {
      return 1
    }

    const taxonB = getTaxon(b)
    if (taxonB == null) {
      return -1
    }

    const column = nameColumnMap.get(taxonRank)
    const nameA = taxonA[column] ?? ''
    const nameB = taxonB[column] ?? ''
    const compare = nameA.localeCompare(nameB)
    return compare ?? sortByMediaId(a, b)
  }
}

function getView(media) {
  if (media.view_id == null) {
    return null
  }

  return mediaViewsStore.getMediaViewById(media.view_id)
}

function getUser(media) {
  if (media.user_id == null) {
    return null
  }

  return projectUsersStore.getUserById(media.user_id)
}

function getTaxon(media) {
  if (media.specimen_id == null) {
    return null
  }

  const specimen = specimensStore.getSpecimenById(media.specimen_id)
  if (specimen == null) {
    return null
  }

  if (specimen.taxon_id == null) {
    return null
  }

  return taxaStore.getTaxonById(specimen.taxon_id)
}

function setFilter(key, value) {
  filters[key] = value
}

function clearFilter(key) {
  delete filters[key]
}

function searchByStr() {
  selectedPage.value = 1 // Reset to first page when searching
}

function onResetSearch() {
  searchStr.value = ''
  selectedPage.value = 1
}

// Watch for page size changes
watch(selectedPageSize, () => {
  selectedPage.value = 1
})

// Watch for search changes
watch(searchStr, () => {
  selectedPage.value = 1
})

// Helper function to create S3 media URLs for MediaCard
function getMediaThumbnailUrl(media) {
  if (media.media_id) {
    return {
      url: buildMediaUrl(projectId, media.media_id, 'thumbnail'),
    }
  }
  // Fallback to existing thumbnail object
  return media.thumbnail
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      <p>
        This project has {{ mediaStore.media?.length }} media files. 
        <span v-if="searchStr || Object.keys(filters).length > 1">
          Displaying {{ filteredMedia.length }} media files.
        </span>
        <span v-else>
          Displaying {{ filteredMedia.length }} media files.
        </span>
      </p>
      <p v-if="uncuratedMediaCount > 0" class="text-muted">
        <i class="fa fa-info-circle"></i>
        <em>{{ uncuratedMediaCount }} batch media still need to be curated and released to the general media pool. You must curate all your media before adding a new batch.</em>
      </p>
    </header>

    <!-- Action Bar -->
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/media/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Create Media</span>
        </button>
      </RouterLink>
      <RouterLink
        v-if="uncuratedMediaCount > 0"
        :to="`/myprojects/${projectId}/media/curate`"
      >
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-wrench"></i>
          <span> Curate Media</span>
        </button>
      </RouterLink>
      <RouterLink v-else :to="`/myprojects/${projectId}/media/create/batch`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Upload Batch</span>
        </button>
      </RouterLink>
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-m btn-outline-primary dropdown-toggle"
          data-bs-toggle="dropdown"
        >
          <i class="fa fa-file-arrow-up"></i>
          <span> Import Media </span>
        </button>
        <div class="dropdown-menu">
          <RouterLink :to="`/myprojects/${projectId}/media/import/eol`">
            <button type="button" class="dropdown-item">Import from EOL</button>
          </RouterLink>
          <RouterLink :to="`/myprojects/${projectId}/media/import/idigbio`">
            <button type="button" class="dropdown-item">
              Import from iDigBio
            </button>
          </RouterLink>
        </div>
      </div>
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-m btn-outline-primary dropdown-toggle"
          data-bs-toggle="dropdown"
        >
          <i class="fa fa-download"></i>
          <span> Download </span>
        </button>
        <div class="dropdown-menu">
          <button
            type="button"
            class="dropdown-item"
            @click="onClickDownloadOriginalFilenames"
          >
            Original Filenames
          </button>
        </div>
      </div>
    </div>

    <div v-if="mediaStore.media?.length">
      <!-- Search and Filter Controls -->
      <div class="row mb-3">
        <div class="col-5">
          <div class="mb-2">
            <label for="search-filter" class="me-2">Search for:</label>
            <input 
              id="search-filter" 
              v-model="searchStr" 
              class="me-2" 
              placeholder="Search media..."
              @input="searchByStr"
            />
            <button @click="onResetSearch()" class="btn btn-primary btn-white">
              Clear
            </button>
          </div>
          <div class="mb-2">
            <label for="show-filter" class="me-2">Show:</label>
            <select id="show-filter" @change="onSelectShow">
              <option value="all">all media</option>
              <option value="identified">identified media</option>
              <option value="unidentified">unidentified media</option>
              <option value="copyrighted">copyrighted media</option>
              <option value="noncopyrighted">non-copyrighted media</option>
            </select>
          </div>
          <div>
            <label for="order-by" class="me-2">Order by:</label>
            <select id="order-by" @change="onSelectSort">
              <option value="mnumber" selected="true">MorphoBank number</option>
              <option value="snumber">specimen number</option>
              <option value="view">view</option>
              <option value="user">submitter</option>
              <option :value="TaxaFriendlyNames.PHYLUM">taxonomic phylum</option>
              <option :value="TaxaFriendlyNames.CLASS">taxonomic class</option>
              <option :value="TaxaFriendlyNames.ORDER">taxonomic order</option>
              <option :value="TaxaFriendlyNames.SUPERFAMILY">taxonomic superfamily</option>
              <option :value="TaxaFriendlyNames.FAMILY">taxonomic family</option>
              <option :value="TaxaFriendlyNames.SUBFAMILY">taxonomic subfamily</option>
              <option :value="TaxaFriendlyNames.GENUS">taxonomic genus</option>
            </select>
          </div>
        </div>
        
        <!-- Right Side Controls -->
        <div class="d-flex col-7 justify-content-end align-items-start">
          <div class="me-4">
            <button
              class="btn btn-small btn-secondary"
              type="button"
              data-bs-toggle="modal"
              data-bs-target="#mediaFilterModal"
            >
              <i class="fa fa-filter"></i> Advanced Filter
            </button>
          </div>
          
          <!-- Pagination Controls -->
          <div class="me-4">
            <span>Showing page </span>
            <select v-model="selectedPage">
              <option
                v-for="page in totalPages"
                :key="page"
                :value="page"
              >
                {{ page }}
              </option>
            </select>
            <span> of {{ totalPages }} pages.</span>
          </div>

          <div class="me-3">
            <span>Items per page: </span>
            <select v-model="selectedPageSize">
              <option
                v-for="size in [10, 25, 50, 100]"
                :key="size"
                :value="size"
              >
                {{ size }}
              </option>
            </select>
          </div>

          <!-- View Mode Toggle -->
          <div class="ms-1">
            <button
              @click="thumbnailView = true"
              :style="{ backgroundColor: thumbnailView ? '#e0e0e0' : '#fff' }"
              title="thumbnail-view"
              class="btn btn-sm"
            >
              <i class="fa-solid fa-border-all"></i>
            </button>
          </div>
          <div class="ms-1">
            <button
              @click="thumbnailView = false"
              :style="{ backgroundColor: thumbnailView ? '#fff' : '#e0e0e0' }"
              title="compact-view"
              class="btn btn-sm"
            >
              <i class="fa-solid fa-table-cells"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Selection Bar -->
      <div class="selection-bar">
        <label class="item">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="allSelected"
            :indeterminate.prop="someSelected && !allSelected"
          />
          <span class="ms-1">{{ someSelected ? `${paginatedMedia.filter(m => m.selected).length} selected` : 'Select All' }}</span>
        </label>
        <span v-if="!someSelected" class="item" @click="refresh" title="Refresh">
          <i class="fa-solid fa-arrow-rotate-right"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#mediaEditModal"
          title="Edit Selected"
        >
          <i class="fa-regular fa-pen-to-square"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#mediaDeleteModal"
          @click="mediaToDelete = filteredMedia.filter((b) => b.selected)"
          title="Delete Selected"
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>

      <!-- Media Grid -->
      <div 
        :class="[
          thumbnailView
            ? 'row row-cols-auto g-4 py-3'
            : 'row row-cols-auto g-2 py-2',
          'justify-content-start'
        ]"
      >
        <div
          class="col d-flex align-items-stretch"
          v-for="media in paginatedMedia"
          :key="media.media_id"
        >
          <RouterLink
            :to="`/myprojects/${projectId}/media/${media.media_id}/edit`"
            class="nav-link p-0"
          >
            <MediaCard
              :mediaId="media.media_id"
              :image="getMediaThumbnailUrl(media)"
              :viewName="mediaViewsStore.getMediaViewById(media.view_id)?.name"
              :taxon="getTaxonForMediaId(media)"
            >
              <template #bar>
                <input
                  class="form-check-input media-checkbox"
                  type="checkbox"
                  v-model="media.selected"
                  @click.stop=""
                />
              </template>
            </MediaCard>
          </RouterLink>
        </div>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="d-flex justify-content-center mt-4">
        <nav>
          <ul class="pagination">
            <li class="page-item" :class="{ disabled: selectedPage === 1 }">
              <button 
                class="page-link" 
                @click="selectedPage = Math.max(1, selectedPage - 1)"
                :disabled="selectedPage === 1"
              >
                Previous
              </button>
            </li>
            <li 
              v-for="page in Math.min(totalPages, 10)" 
              :key="page"
              class="page-item" 
              :class="{ active: selectedPage === page }"
            >
              <button class="page-link" @click="selectedPage = page">
                {{ page }}
              </button>
            </li>
            <li class="page-item" :class="{ disabled: selectedPage === totalPages }">
              <button 
                class="page-link" 
                @click="selectedPage = Math.min(totalPages, selectedPage + 1)"
                :disabled="selectedPage === totalPages"
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
    <div v-else class="text-center py-5">
      <i class="fa fa-images fa-3x text-muted"></i>
      <h4 class="mt-3 text-muted">No media files found</h4>
      <p class="text-muted">This project has no media files yet.</p>
    </div>
  </LoadingIndicator>
  <EditBatchDialog :batchEdit="batchEdit"></EditBatchDialog>
  <DeleteDialog :mediaToDelete="mediaToDelete"></DeleteDialog>
  <FilterDialog
    :setFilter="setFilter"
    :clearFilter="clearFilter"
  ></FilterDialog>
</template>
<style scoped>
@import '@/views/project/styles.css';

/* Enhanced styles for improved ListView UI */
.media-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
}

.btn-white {
  background-color: white;
  border: 1px solid #dee2e6;
  color: #212529;
}

.btn-white:hover {
  background-color: #f8f9fa;
  border-color: #adb5bd;
}

.selection-bar .item {
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.selection-bar .item:hover {
  background-color: #e9ecef;
}

.nav-link {
  text-decoration: none;
}

.nav-link:hover {
  text-decoration: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .row .col-5,
  .row .col-7 {
    flex: 0 0 100%;
    max-width: 100%;
  }
  
  .d-flex.col-7 {
    flex-direction: column;
    align-items: start !important;
    margin-top: 1rem;
  }
  
  .d-flex.col-7 > div {
    margin: 0.25rem 0;
  }
}

/* Pagination styling */
.pagination {
  margin-bottom: 0;
}

.page-link {
  color: #ef782f;
  border-color: #dee2e6;
}

.page-link:hover {
  color: #c56426;
  background-color: #fff4e6;
  border-color: #ef782f;
}

.page-item.active .page-link {
  background-color: #ef782f;
  border-color: #ef782f;
}

/* View toggle buttons */
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #dee2e6;
}

.btn-sm:hover {
  border-color: #adb5bd;
}

/* Search and filter controls */
#search-filter {
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
}

#search-filter:focus {
  border-color: #ef782f;
  box-shadow: 0 0 0 0.2rem rgba(239, 120, 47, 0.25);
}

select {
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: white;
}

select:focus {
  border-color: #ef782f;
  box-shadow: 0 0 0 0.2rem rgba(239, 120, 47, 0.25);
}

/* Empty state styling */
.fa-images {
  opacity: 0.5;
}
</style>
