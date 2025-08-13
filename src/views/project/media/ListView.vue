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
import MediaCardComp from '@/components/project/MediaCardComp.vue'
import { buildMediaUrl } from '@/utils/fileUtils.js'

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

// Track selection state using a reactive object keyed by media_id
const selectedMedia = reactive({})

const filters = reactive({
  released: (media) => media.cataloguing_status == 0,
})

// Convert media store data to match MediaView.vue format
const convertedMediaList = computed(() => {
  const mediaArray = Array.isArray(mediaStore.media) ? mediaStore.media : []

  return mediaArray.map((media) => ({
    ...media, // Keep all original data
    // Preserve original media data but ensure thumbnail has minimum required properties
    media: {
      ...media.media, // Keep all original media data including USE_ICON
      thumbnail: {
        WIDTH: media.media?.thumbnail?.WIDTH || 120,
        HEIGHT: media.media?.thumbnail?.HEIGHT || 120,
        ...media.media?.thumbnail // Preserve all original thumbnail properties including USE_ICON
      }
    },
    // Add computed display fields
    taxon_name: getTaxonName(media),
    view_name: getViewName(media),
    specimen_name: getSpecimenName(media),
    user_name: getUserName(media),
  }))
})

const filteredMedia = computed(() => {
  let media = Object.values(filters)
    .reduce((media, filter) => media.filter(filter), convertedMediaList.value)
    .sort(sortFunction.value)

  // Apply search filter if search string exists
  if (searchStr.value && searchStr.value.trim()) {
    const searchLower = searchStr.value.toLowerCase().trim()
    media = media.filter((m) => {
      const mediaIdStr = `M${m.media_id}`.toLowerCase()
      const viewName = m.view_name?.toLowerCase() || ''
      const taxonName = m.taxon_name?.toLowerCase() || ''
      const userName = m.user_name?.toLowerCase() || ''

      return (
        mediaIdStr.includes(searchLower) ||
        viewName.includes(searchLower) ||
        taxonName.includes(searchLower) ||
        userName.includes(searchLower)
      )
    })
  }

  return media
})

// Pagination - with safety checks
const totalPages = computed(() => {
  const pageSize = Math.max(1, selectedPageSize.value)
  return Math.ceil(filteredMedia.value.length / pageSize)
})

const paginatedMedia = computed(() => {
  const start = (selectedPage.value - 1) * selectedPageSize.value
  const end = start + selectedPageSize.value
  return filteredMedia.value.slice(start, end)
})

const uncuratedMediaCount = computed(() => {
  const mediaArray = Array.isArray(mediaStore.media) ? mediaStore.media : []
  return mediaArray.filter((m) => m.cataloguing_status == 1).length
})

// Selection computed properties for batch operations
const allSelected = computed({
  get: function () {
    return (
      paginatedMedia.value.length > 0 &&
      paginatedMedia.value.every((b) => selectedMedia[b.media_id])
    )
  },
  set: function (value) {
    paginatedMedia.value.forEach((b) => {
      selectedMedia[b.media_id] = value
    })
  },
})

const someSelected = computed(() =>
  paginatedMedia.value.some((b) => selectedMedia[b.media_id])
)

// Order by options matching MediaView.vue
const orderByOptions = {
  mnumber: 'MorphoBank number',
  snumber: 'specimen number',
  view: 'view',
  user: 'submitter',
  phylum: 'taxonomic phylum',
  class: 'taxonomic class',
  order: 'taxonomic order',
  superfamily: 'taxonomic superfamily',
  family: 'taxonomic family',
  subfamily: 'taxonomic subfamily',
  genus: 'taxonomic genus',
}

let orderBySelection = ref('mnumber')

// Helper functions to get formatted data
function getTaxonName(media) {
  const taxon = getTaxon(media)
  if (!taxon) return ''

  // Build taxonomic name similar to MediaView
  const parts = []
  if (taxon.genus) parts.push(taxon.genus)
  if (taxon.specific_epithet) parts.push(taxon.specific_epithet)
  return parts.join(' ')
}

function getViewName(media) {
  return mediaViewsStore.getMediaViewById(media.view_id)?.name || ''
}

function getSpecimenName(media) {
  const specimen = specimensStore.getSpecimenById(media.specimen_id)
  return specimen?.specimen_id ? `S${specimen.specimen_id}` : ''
}

function getUserName(media) {
  const user = getUser(media)
  return user ? `${user.fname} ${user.lname}` : ''
}

function searchByStr() {
  selectedPage.value = 1
}

function onResetSearch() {
  searchStr.value = ''
  selectedPage.value = 1
}

// Watch for pagination changes
watch(selectedPage, () => {
  // No need to fetch from server as we handle pagination client-side
})

watch(selectedPageSize, () => {
  selectedPage.value = 1
})

watch(orderBySelection, (newValue) => {
  switch (newValue) {
    case 'phylum':
    case 'class':
    case 'order':
    case 'superfamily':
    case 'family':
    case 'subfamily':
    case 'genus':
      sortFunction.value = sortByTaxonRank(
        TaxaFriendlyNames[newValue.toUpperCase()] || newValue
      )
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
})

async function batchEdit(json) {
  const mediaIds = filteredMedia.value
    .filter((m) => selectedMedia[m.media_id])
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

function downloadSelected() {
  const selectedMediaFiles = filteredMedia.value
    .filter((m) => selectedMedia[m.media_id])
  
  if (selectedMediaFiles.length === 0) {
    return
  }
  
  // Download each selected media file individually using the existing serve endpoint
  // This approach uses the already established pattern for media serving from S3
  selectedMediaFiles.forEach((mediaFile, index) => {
    // Add a small delay between downloads to avoid overwhelming the browser
    setTimeout(() => {
      const downloadUrl = `${import.meta.env.VITE_API_URL}/public/media/${projectId}/serve/${mediaFile.media_id}/original`
      // Create a temporary link element to trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      // Use a more descriptive filename with media ID
      link.download = `M${mediaFile.media_id}_${mediaFile.view_name || 'media'}_original`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, index * 100) // 100ms delay between each download
  })
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
  return (a.specimen_id || 0) < (b.specimen_id || 0) ? -1 : 1
}

function sortByViewName(a, b) {
  const nameA = a.view_name || ''
  const nameB = b.view_name || ''
  const compare = nameA.localeCompare(nameB)
  return compare || sortByMediaId(a, b)
}

function sortByUserName(a, b) {
  const nameA = a.user_name || ''
  const nameB = b.user_name || ''
  const compare = nameA.localeCompare(nameB)
  return compare || sortByMediaId(a, b)
}

function sortByTaxonRank(taxonRank) {
  return (a, b) => {
    const nameA = a.taxon_name || ''
    const nameB = b.taxon_name || ''
    const compare = nameA.localeCompare(nameB)
    return compare || sortByMediaId(a, b)
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

// Watch for page size changes
watch(selectedPageSize, () => {
  selectedPage.value = 1
})

// Watch for search changes
watch(searchStr, () => {
  selectedPage.value = 1
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <p>
      This project has {{ mediaStore.media?.length }} media files. Displaying
      {{ filteredMedia.length }} media files.
    </p>

    <!-- Action Bar - Keep the project-specific actions -->
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/media/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Upload 2D Media</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/media/create/3d`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-cube"></i>
          <span> Upload 3D Media</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/media/create/video`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-video"></i>
          <span> Upload Video</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/media/create/stacks`">
        <button 
          type="button" 
          class="btn btn-m btn-outline-primary"
          title="Click here to load zipped archives of CT scan stacks (Dicom, TIFF)"
        >
          <i class="fa fa-layer-group"></i>
          <span> Upload Stacks</span>
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
          <span> Upload 2D Media Batch</span>
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

    <div v-if="uncuratedMediaCount > 0" class="alert alert-info">
      <i class="fa fa-info-circle"></i>
      {{ uncuratedMediaCount }} batch media still need to be curated and
      released to the general media pool. You must curate all your media before
      adding a new batch.
    </div>

    <div v-if="mediaStore.media?.length">
      <!-- Controls matching MediaView.vue exactly -->
      <div class="row mb-3">
        <div class="col-5">
          <div class="mb-2">
            <label for="filter" class="me-2">Search for:</label>
            <input id="filter" v-model="searchStr" class="me-2" />
            <button @click="searchByStr()" class="btn btn-primary me-2">
              Submit
            </button>
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
            <select id="order-by" v-model="orderBySelection">
              <option
                v-for="(label, value) in orderByOptions"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
            </select>
          </div>
        </div>
        <div class="d-flex col-7 justify-content-end">
          <div class="me-5">
            Showing page
            <select v-model="selectedPage">
              <option
                :selected="idx == 1"
                v-for="idx in totalPages"
                :key="idx"
                :value="idx"
              >
                {{ idx }}
              </option>
            </select>
            of {{ totalPages }} pages.
          </div>

          <div>
            Items per page:
            <select v-model="selectedPageSize">
              <option
                :selected="idx == 25"
                v-for="idx in [10, 25, 50, 100]"
                :key="idx"
                :value="idx"
              >
                {{ idx }}
              </option>
            </select>
          </div>
          <div class="ms-1">
            <button
              @click="thumbnailView = true"
              :style="{ backgroundColor: thumbnailView ? '#e0e0e0' : '#fff' }"
              title="thumbnail-view"
            >
              <i class="fa-solid fa-border-all"></i>
            </button>
          </div>
          <div class="ms-1">
            <button
              @click="thumbnailView = false"
              :style="{ backgroundColor: thumbnailView ? '#fff' : '#e0e0e0' }"
              title="mosaic-view"
            >
              <i class="fa-solid fa-table-cells"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Selection Bar for batch operations -->
      <div v-if="someSelected" class="selection-bar mb-3">
        <label class="item">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="allSelected"
            :indeterminate.prop="someSelected && !allSelected"
          />
          <span class="ms-1">{{
            someSelected
              ? `${
                  paginatedMedia.filter((m) => selectedMedia[m.media_id]).length
                } selected`
              : 'Select All'
          }}</span>
        </label>
        <span
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#mediaEditModal"
          title="Edit Selected"
        >
          <i class="fa-regular fa-pen-to-square"></i>
        </span>
        <span
          class="item"
          @click="downloadSelected"
          title="Download Selected"
        >
          <i class="fa-solid fa-download"></i>
        </span>
        <span
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#mediaDeleteModal"
          @click="
            mediaToDelete = filteredMedia.filter(
              (b) => selectedMedia[b.media_id]
            )
          "
          title="Delete Selected"
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>

      <!-- Media Grid matching MediaView.vue exactly -->
      <div
        :class="[
          thumbnailView
            ? 'row row-cols-auto g-4 py-5'
            : 'row row-cols-auto g-2 py-3',
          'justify-content-start',
        ]"
      >
        <div
          class="col d-flex align-items-stretch"
          v-for="(media_file, n) in paginatedMedia"
          :key="n"
        >
          <RouterLink
            :to="`/myprojects/${projectId}/media/${media_file.media_id}/edit`"
            class="nav-link"
          >
            <!-- Checkbox for selection (project-specific feature) -->
            <input
              class="form-check-input media-checkbox"
              type="checkbox"
              v-model="selectedMedia[media_file.media_id]"
              @click.stop=""
            />
            <MediaCardComp
              :key="media_file.media_id"
              :media_file="media_file"
              :full_view="thumbnailView"
              :project_id="projectId"
            ></MediaCardComp>
          </RouterLink>
        </div>
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

/* Position checkbox over card */
.media-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  margin: 0;
}

.nav-link {
  position: relative; /* This allows absolute positioning of checkbox within the card link */
  display: block;
  text-decoration: none;
}

.nav-link:hover {
  text-decoration: none;
}

/* Button styles matching MediaView.vue */
.btn-white {
  background-color: white;
  border: 1px solid #dee2e6;
  color: #212529;
}

.btn-white:hover {
  background-color: #f8f9fa;
  border-color: #adb5bd;
}

/* Selection bar styling */
.selection-bar {
  display: flex;
  gap: 5px;
  margin: 8px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
  border: 1px solid #dee2e6;
}

.selection-bar .item {
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  padding: 5px 10px;
}

.selection-bar .item:hover {
  background-color: #e9ecef;
}

/* Alert styling */
.alert {
  padding: 12px 16px;
  margin-bottom: 20px;
  border: 1px solid transparent;
  border-radius: 4px;
}

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
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

/* Empty state styling */
.fa-images {
  opacity: 0.5;
}
</style>
