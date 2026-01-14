<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useFoliosStore } from '@/stores/FoliosStore'
import { useFolioMediaStore } from '@/stores/FolioMediaStore'
import { useProjectOverviewStore } from '@/stores/ProjectOverviewStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useNotifications } from '@/composables/useNotifications'
import { getTaxonForMediaId } from '@/views/project/utils'
import { TaxaFriendlyNames, nameColumnMap } from '@/utils/taxa'
import { getSpecimenName as getSpecimenDisplayName } from '@/utils/specimens'
// import { logDownload, DOWNLOAD_TYPES } from '@/lib/analytics.js'
import FilterDialog from '@/views/project/media/FilterDialog.vue'
import EditBatchDialog from '@/views/project/media/EditBatchDialog.vue'
import DeleteDialog from '@/views/project/media/DeleteDialog.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MediaCardComp from '@/components/project/MediaCardComp.vue'
import { buildMediaUrl } from '@/utils/fileUtils.js'
import { Tooltip } from 'bootstrap'
import { apiService } from '@/services/apiService.js'

const route = useRoute()
const projectId = parseInt(route.params.id)

const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const projectUsersStore = useProjectUsersStore()
const foliosStore = useFoliosStore()
const folioMediaStore = useFolioMediaStore()
const projectOverviewStore = useProjectOverviewStore()
const projectsStore = useProjectsStore()
const { showSuccess, showError } = useNotifications()
const isLoaded = computed(
  () =>
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded &&
    projectUsersStore.isLoaded &&
    foliosStore.isLoaded
)

// Get the project exemplar media ID
const projectExemplarMediaId = computed(() => {
  return projectOverviewStore.overview?.exemplar_media_id || null
})

const mediaToDelete = ref([])
const sortFunction = ref(sortByMediaId)
const thumbnailView = ref(true)
const searchStr = ref('')
const selectedPage = ref(1)
const selectedPageSize = ref(25)

// Track selection state using a reactive object keyed by media_id
const selectedMedia = reactive({})

// Track hover state for exemplar button - reactive object keyed by media_id
const hoveredMedia = reactive({})

// Filter state management - make it reactive
const serializedFilterName = `mediaFilter[${projectId}]`
const filterUpdateTrigger = ref(0) // Trigger for reactivity

const activeFilters = computed(() => {
  // Access the trigger to ensure reactivity
  filterUpdateTrigger.value
  
  const existingFilter = sessionStorage.getItem(serializedFilterName)
  if (!existingFilter) return null
  
  try {
    const filter = JSON.parse(existingFilter)
    const hasActiveFilters = 
      (filter.filterTaxa && filter.filterTaxa.length > 0) ||
      (filter.filterView && filter.filterView.length > 0) ||
      (filter.filterSubmitter && filter.filterSubmitter.length > 0) ||
      (filter.filterCopyrightLicense && filter.filterCopyrightLicense.length > 0) ||
      (filter.filterCopyrightPermission && filter.filterCopyrightPermission.length > 0) ||
      (filter.filterSpecimenRepository && filter.filterSpecimenRepository.length > 0) ||
      (filter.filterStatus && filter.filterStatus.length > 0) ||
      (filter.filterOther && Object.keys(filter.filterOther).length > 0)
    
    return hasActiveFilters ? filter : null
  } catch (e) {
    console.error('Error parsing filter from sessionStorage:', e)
    return null
  }
})

function clearAllFilters(event) {
  sessionStorage.removeItem(serializedFilterName)
  // Clear all existing filters
  Object.keys(filters).forEach(key => {
    if (key !== 'released') { // Keep the released filter as it's the default
      clearFilter(key)
    }
  })
  // Trigger reactivity update
  filterUpdateTrigger.value++
  
  // Also clear any checkboxes in the modal if it's open
  setTimeout(() => {
    const modalElement = document.getElementById('mediaFilterModal')
    if (modalElement) {
      const checkboxes = modalElement.querySelectorAll<HTMLInputElement>('input[type=checkbox]')
      for (const checkbox of checkboxes) {
        checkbox.checked = false
      }
    }
  }, 0)
  
  // Hide tooltip after click
  hideTooltipOnClick(event)
}

// Function to trigger filter updates (called by FilterDialog)
function onFiltersUpdated() {
  filterUpdateTrigger.value++
}

// Helper function to hide tooltip after button click
function hideTooltipOnClick(event) {
  if (event && event.target) {
    const tooltip = Tooltip.getInstance(event.target)
    if (tooltip) {
      tooltip.hide()
    }
  }
  
  // Also hide any other visible tooltips
  const visibleTooltips = document.querySelectorAll('.tooltip.show')
  visibleTooltips.forEach(tooltipEl => {
    if (tooltipEl.parentNode) {
      tooltipEl.parentNode.removeChild(tooltipEl)
    }
  })
}

// Function to initialize or reinitialize tooltips with fast delays
function initializeFastTooltips() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    // Dispose existing tooltip if it exists
    const existingTooltip = Tooltip.getInstance(tooltipTriggerEl)
    if (existingTooltip) {
      existingTooltip.dispose()
    }
    
    // Check if this element should render HTML content
    const allowHtml = tooltipTriggerEl.hasAttribute('data-bs-html') && 
                     tooltipTriggerEl.getAttribute('data-bs-html') === 'true'
    
    // Create new tooltip with fast configuration
    new Tooltip(tooltipTriggerEl, {
      delay: { show: 150, hide: 50 }, // Very fast delays
      trigger: 'hover focus',
      placement: 'auto', // Auto placement for better positioning
      fallbackPlacements: ['bottom', 'top', 'right', 'left'],
      html: allowHtml // Enable HTML rendering when data-bs-html="true"
    })
  })
}

// Function to dispose of all tooltips to prevent persistent tooltips
function disposeAllTooltips() {
  // Find all elements with tooltips and dispose them
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    const existingTooltip = Tooltip.getInstance(tooltipTriggerEl)
    if (existingTooltip) {
      existingTooltip.dispose()
    }
  })
  
  // Also check for any orphaned tooltip elements in the DOM
  const tooltipElements = document.querySelectorAll('.tooltip')
  tooltipElements.forEach(tooltipEl => {
    if (tooltipEl.parentNode) {
      tooltipEl.parentNode.removeChild(tooltipEl)
    }
  })
}

// View toggle functions with tooltip hiding
function setThumbnailView(event) {
  thumbnailView.value = true
  hideTooltipOnClick(event)
}

function setCompactView(event) {
  thumbnailView.value = false
  hideTooltipOnClick(event)
}

// Function to build active filters text for display
function getActiveFiltersText(filters) {
  if (!filters) return ''
  
  const filterParts = []
  
  if (filters.filterTaxa && filters.filterTaxa.length > 0) {
    filterParts.push(`${filters.filterTaxa.length} taxa`)
  }
  if (filters.filterView && filters.filterView.length > 0) {
    filterParts.push(`${filters.filterView.length} views`)
  }
  if (filters.filterSubmitter && filters.filterSubmitter.length > 0) {
    filterParts.push(`${filters.filterSubmitter.length} submitters`)
  }
  if (filters.filterCopyrightLicense && filters.filterCopyrightLicense.length > 0) {
    filterParts.push(`${filters.filterCopyrightLicense.length} licenses`)
  }
  if (filters.filterCopyrightPermission && filters.filterCopyrightPermission.length > 0) {
    filterParts.push(`${filters.filterCopyrightPermission.length} permissions`)
  }
  if (filters.filterSpecimenRepository && filters.filterSpecimenRepository.length > 0) {
    filterParts.push(`${filters.filterSpecimenRepository.length} repositories`)
  }
  if (filters.filterStatus && filters.filterStatus.length > 0) {
    filterParts.push(`${filters.filterStatus.length} status filters`)
  }
  if (filters.filterOther && Object.keys(filters.filterOther).length > 0) {
    filterParts.push(`${Object.keys(filters.filterOther).length} other criteria`)
  }
  
  if (filterParts.length === 0) return 'No filters active'
  if (filterParts.length === 1) return filterParts[0]
  if (filterParts.length === 2) return `${filterParts[0]} and ${filterParts[1]}`
  
  // For 3+ filters, use more compact display
  if (filterParts.length > 4) {
    const totalCategories = filterParts.length
    return `${totalCategories} filter categories active`
  }
  
  // For 3-4 filters, show "X, Y, and Z"
  const lastFilter = filterParts.pop()
  return `${filterParts.join(', ')}, and ${lastFilter}`
}

// Folio tools state
const showFolioOptions = ref(false)
const selectedFolioId = ref('')
const folioToolsTooltip = 'Folios are annotated booklets of media that you may wish to make as part of your Project. To make one, start by clicking on Folios at the left, name your Folio and then go to Folio Tools to fill the Folio with media.'

// Tooltip constants for batch edit/selection bar
const batchEditTooltip = 'Edit all selected media items at the same time. You can modify copyright information, views, specimens, and other metadata for multiple files simultaneously.'
const downloadSelectedTooltip = 'Download original files for all selected media items.'
const addToFolioTooltip = 'Add selected media items to a folio for organization and annotation.'
const deleteSelectedTooltip = 'Permanently delete all selected media items. This action cannot be undone.'

// Upload button tooltips
const uploadTooltips = {
  upload2D: 'Upload images (JPG, PNG, GIF, etc.) to your project',
  upload3D: 'Upload 3D models (PLY, OBJ, STL, etc.) for interactive viewing',
  uploadVideo: 'Upload video files (MP4, MOV, AVI, etc.) to your project',
  uploadStacks: 'Upload zipped archives of CT scan stacks (Dicom, TIFF)',
  uploadBatch: 'Upload multiple 2D images at once with batch metadata editing',
  importEOL: 'Import images directly from Encyclopedia of Life (EOL)',
  importIDigBio: 'Import specimen images from iDigBio collections'
}

// Download options tooltips
const downloadTooltips = {
  originalFilenames: 'Download a CSV file containing the original filenames of all media in this project'
}

// Control tooltips
const controlTooltips = {
  showFilter: 'Filter media by identification status or copyright information',
  orderBy: 'Sort media by different criteria including taxonomic classification'
}

// Educational tooltip about views
const whatIsViewTooltip = 'A View should indicate both the orientation and element in your 2D or 3D image (Media), for example \'dorsal skull\' or \'cross-section of leaf\' or \'CT scan of insect body\'. The best practice for using the MorphoBank database, and one that will make your work maximally searchable, is to include only one View per image (Media) rather than multi-image plates.'

// View tools tooltip
const viewToolsTooltip = 'Click here to display your media without views and batch curate them.<br/><br/>A View should indicate both the orientation and element in your 2D or 3D image (Media), for example \'dorsal skull\' or \'cross-section of leaf\' or \'CT scan of insect body\'. The best practice for using the MorphoBank database, and one that will make your work maximally searchable, is to include only one View per image (Media) rather than multi-image plates.'

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
        WIDTH: 120,
        HEIGHT: 120,
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

// Computed property for media without views
const mediaWithoutViews = computed(() => {
  return filteredMedia.value.filter(m => !m.view_id).length
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
  // console.log('specimen', specimen)
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

onMounted(async () => {
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
  if (!foliosStore.isLoaded) {
    foliosStore.fetch(projectId)
  }
  
  // Initialize filters from sessionStorage if they exist
  const existingFilter = sessionStorage.getItem(serializedFilterName)
  if (existingFilter) {
    try {
      const { applyFilter } = await import('@/views/project/media/filter')
      const filter = JSON.parse(existingFilter)
      await applyFilter(projectId, filter, setFilter, clearFilter)
      filterUpdateTrigger.value++
    } catch (e) {
      console.error('Error applying existing filters:', e)
    }
  }
  
  // Initialize fast-responding tooltips
  setTimeout(() => {
    initializeFastTooltips()
  }, 100)
  
  // Add global cleanup for tooltips on page unload
  const handleBeforeUnload = () => {
    disposeAllTooltips()
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // Store the cleanup function for removal in onBeforeUnmount
  window._tooltipCleanupHandler = handleBeforeUnload
})

// Cleanup tooltips when component unmounts to prevent persistent tooltips
onBeforeUnmount(() => {
  disposeAllTooltips()
  
  // Remove the global event listener if it exists
  if (window._tooltipCleanupHandler) {
    window.removeEventListener('beforeunload', window._tooltipCleanupHandler)
    delete window._tooltipCleanupHandler
  }
})

// Cleanup tooltips when navigating away using Vue Router
onBeforeRouteLeave((to, from) => {
  disposeAllTooltips()
  return true
})

function refresh() {
  mediaStore.fetchMedia(projectId)
  specimensStore.fetchSpecimens(projectId)
  taxaStore.fetch(projectId)
  mediaViewsStore.fetchMediaViews(projectId)
  foliosStore.fetch(projectId)
}

const baseUrl = apiService.buildUrl(`/projects/${projectId}/media`)
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
      const downloadUrl = apiService.buildUrl(`/public/media/${projectId}/serve/${mediaFile.media_id}/original`)
      // Create a temporary link element to trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      // Extract extension from media file data or default to jpg
      // The backend will set Content-Disposition header, but we set download attribute for consistency
      const extension = getMediaExtension(mediaFile) || 'jpg'
      link.download = `M${mediaFile.media_id}.${extension}`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, index * 100) // 100ms delay between each download
  })
}

/**
 * Extract file extension from media file object
 * @param {Object} mediaFile - Media file object
 * @returns {string|null} File extension without dot, or null if not found
 */
function getMediaExtension(mediaFile) {
  if (!mediaFile) return null
  
  // Try to get extension from original filename
  if (mediaFile.original_filename) {
    const match = mediaFile.original_filename.match(/\.([a-z0-9]+)$/i)
    if (match) return match[1].toLowerCase()
  }
  
  // Try to get extension from media object
  if (mediaFile.media && mediaFile.media.original) {
    const original = mediaFile.media.original
    // Check S3 key
    if (original.s3_key || original.S3_KEY) {
      const s3Key = original.s3_key || original.S3_KEY
      const match = s3Key.match(/\.([a-z0-9]+)$/i)
      if (match) return match[1].toLowerCase()
    }
    // Check filename
    if (original.FILENAME) {
      const match = original.FILENAME.match(/\.([a-z0-9]+)$/i)
      if (match) return match[1].toLowerCase()
    }
  }
  
  return null
}

// Folio tools functions
function toggleFolioOptions(event) {
  showFolioOptions.value = !showFolioOptions.value
  // If hiding folio options, reset selected folio
  if (!showFolioOptions.value) {
    selectedFolioId.value = ''
  }
  
  // Hide tooltip after click to prevent it from staying visible
  hideTooltipOnClick(event)
}

async function addToFolio() {
  if (!selectedFolioId.value) {
    showError('Please select a folio')
    return
  }

  const selectedMediaFiles = filteredMedia.value
    .filter((m) => selectedMedia[m.media_id])
    .map((m) => m.media_id)
  
  if (selectedMediaFiles.length === 0) {
    showError('Please select media files to add to folio')
    return
  }

  try {
    const success = await folioMediaStore.create(projectId, selectedFolioId.value, selectedMediaFiles)
    if (success) {
      showSuccess(`Added ${selectedMediaFiles.length} media files to folio`)
      // Clear selections
      Object.keys(selectedMedia).forEach(key => {
        selectedMedia[key] = false
      })
      // Hide folio options
      showFolioOptions.value = false
      selectedFolioId.value = ''
    } else {
      showError('Failed to add media to folio')
    }
  } catch (error) {
    console.error('Error adding media to folio:', error)
    showError('An error occurred while adding media to folio')
  }
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

// Watch for folio options changes to reinitialize tooltips
watch(showFolioOptions, () => {
  setTimeout(() => {
    initializeFastTooltips()
  }, 50)
})

// Watch for active filters changes to reinitialize tooltips
watch(activeFilters, () => {
  setTimeout(() => {
    initializeFastTooltips()
  }, 50)
})

// Watch for paginated media changes to reinitialize tooltips for new media cards
watch(paginatedMedia, () => {
  setTimeout(() => {
    initializeFastTooltips()
  }, 100)
}, { deep: true })

// Function to generate detailed tooltip content for media cards
function getMediaTooltipContent(media_file) {
  if (!media_file) return ''
  
  const specimen = specimensStore.getSpecimenById(media_file.specimen_id)
  const view = mediaViewsStore.getMediaViewById(media_file.view_id)
  const user = projectUsersStore.getUserById(media_file.user_id)
  const taxon = getTaxon(media_file)
  
  // Helper function to escape HTML characters in tooltip content
  const escapeHtml = (text) => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
  
  let tooltip = `<strong>Media ID:</strong> M${media_file.media_id}<br/>`
  
  if (specimen && specimen.specimen_id) {
    // Get the specimen's taxon to build a proper display name
    const specimenTaxon = specimen.taxon_id ? taxaStore.getTaxonById(specimen.taxon_id) : null
    const specimenName = specimenTaxon 
      ? getSpecimenDisplayName(specimen, specimenTaxon) 
      : `S${specimen.specimen_id}`
    tooltip += `<strong>Specimen:</strong> ${escapeHtml(specimenName) || `S${specimen.specimen_id}`}<br/>`
  }
  
  if (view && view.name) {
    tooltip += `<strong>View:</strong> ${escapeHtml(view.name)}<br/>`
  }
  
  if (taxon) {
    const taxonName = getTaxonName(media_file)
    if (taxonName) {
      tooltip += `<strong>Taxon:</strong> ${escapeHtml(taxonName)}<br/>`
    }
  }
  
  if (user && user.fname && user.lname) {
    tooltip += `<strong>Submitter:</strong> ${escapeHtml(user.fname)} ${escapeHtml(user.lname)}<br/>`
  }
  
  if (media_file.is_copyrighted) {
    tooltip += `<strong>Copyright:</strong> Yes<br/>`
  }
  
  if (media_file.media && media_file.media.original) {
    const width = media_file.media.original.WIDTH || 'N/A'
    const height = media_file.media.original.HEIGHT || 'N/A'
    tooltip += `<strong>File:</strong> ${width}x${height}<br/>`
  }
  
  // Remove trailing <br/> if present
  return tooltip.replace(/<br\/>$/, '')
}

// Function to set a media file as the project exemplar
async function setAsExemplar(mediaId) {
  try {
    const success = await projectsStore.setExemplarMedia(projectId, mediaId)
    if (success) {
      showSuccess('Media set as project exemplar successfully')
      // Refresh project overview to get updated exemplar_media_id
      await projectOverviewStore.fetchProject(projectId)
    } else {
      showError('Failed to set media as project exemplar')
    }
  } catch (error) {
    console.error('Error setting exemplar media:', error)
    const errorMsg = error.response?.data?.message || error.message || 'Failed to set media as project exemplar'
    showError(errorMsg)
  }
}

// Function to navigate to curate view for media without views
function fixMediaWithoutViews() {
  // Navigate to the curate view which is designed for batch editing media
  window.location.href = `/myprojects/${projectId}/media/curate`
}
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
        <button 
          type="button" 
          class="btn btn-m btn-outline-primary"
          data-bs-toggle="tooltip"
          :data-bs-title="uploadTooltips.upload2D"
          :title="uploadTooltips.upload2D"
        >
          <i class="fa fa-plus"></i>
          <span> Upload 2D Media</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/media/create/3d`">
        <button 
          type="button" 
          class="btn btn-m btn-outline-primary"
          data-bs-toggle="tooltip"
          :data-bs-title="uploadTooltips.upload3D"
          :title="uploadTooltips.upload3D"
        >
          <i class="fa fa-cube"></i>
          <span> Upload 3D Media</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/media/create/video`">
        <button 
          type="button" 
          class="btn btn-m btn-outline-primary"
          data-bs-toggle="tooltip"
          :data-bs-title="uploadTooltips.uploadVideo"
          :title="uploadTooltips.uploadVideo"
        >
          <i class="fa fa-video"></i>
          <span> Upload Video</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/media/create/stacks`">
        <button 
          type="button" 
          class="btn btn-m btn-outline-primary"
          data-bs-toggle="tooltip"
          :data-bs-title="uploadTooltips.uploadStacks"
          :title="uploadTooltips.uploadStacks"
        >
          <i class="fa fa-layer-group"></i>
          <span> Upload CT Stacks</span>
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
        <button 
          type="button" 
          class="btn btn-m btn-outline-primary"
          data-bs-toggle="tooltip"
          :data-bs-title="uploadTooltips.uploadBatch"
          :title="uploadTooltips.uploadBatch"
        >
          <i class="fa fa-plus"></i>
          <span> Upload 2D Media Batch</span>
        </button>
      </RouterLink>
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-m btn-outline-primary dropdown-toggle"
          data-bs-toggle="dropdown"
          title="Import media from external sources"
        >
          <i class="fa fa-file-arrow-up"></i>
          <span> Import Media </span>
        </button>
        <div class="dropdown-menu">
          <RouterLink :to="`/myprojects/${projectId}/media/import/eol`">
            <button 
              type="button" 
              class="dropdown-item"
              data-bs-toggle="tooltip"
              :data-bs-title="uploadTooltips.importEOL"
              :title="uploadTooltips.importEOL"
            >
              Import from EOL
            </button>
          </RouterLink>
          <RouterLink :to="`/myprojects/${projectId}/media/import/idigbio`">
            <button 
              type="button" 
              class="dropdown-item"
              data-bs-toggle="tooltip"
              :data-bs-title="uploadTooltips.importIDigBio"
              :title="uploadTooltips.importIDigBio"
            >
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
          title="Download project media data"
        >
          <i class="fa fa-download"></i>
          <span> Download </span>
        </button>
        <div class="dropdown-menu">
          <button
            type="button"
            class="dropdown-item"
            @click="onClickDownloadOriginalFilenames"
            data-bs-toggle="tooltip"
            :data-bs-title="downloadTooltips.originalFilenames"
            :title="downloadTooltips.originalFilenames"
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

    <!-- Media without views warning -->
    <div v-if="mediaWithoutViews > 0" class="alert alert-warning">
      <i class="fa fa-exclamation-triangle"></i>
      {{ mediaWithoutViews }} of your images do not have Views 
      <span 
        class="text-primary cursor-pointer"
        data-bs-toggle="tooltip"
        data-bs-html="true"
        :data-bs-title="whatIsViewTooltip"
        :title="whatIsViewTooltip"
        style="text-decoration: underline; cursor: pointer;"
      >
        (what's a view?)
      </span>
      <button 
        class="btn btn-sm btn-warning ms-2"
        @click="fixMediaWithoutViews"
        data-bs-toggle="tooltip"
        data-bs-html="true"
        :data-bs-title="viewToolsTooltip"
        :title="viewToolsTooltip"
      >
        Fix this now, it's easy.
      </button>
    </div>

    <!-- Folio Selection Dropdown -->
    <div v-if="showFolioOptions && foliosStore.folios.length > 0" class="folio-options mb-3">
      <div class="alert alert-light border">
        <p class="mb-2">
          <i class="fa fa-info-circle text-primary"></i>
          Use the checkboxes below to select media to add to the following folio:
        </p>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <label for="folio-select" class="form-label mb-0">Select Folio:</label>
          <select
            id="folio-select"
            v-model="selectedFolioId"
            class="form-select"
            style="width: auto;"
          >
            <option value="">Choose a folio...</option>
            <option
              v-for="folio in foliosStore.folios"
              :key="folio.folio_id"
              :value="folio.folio_id"
            >
              {{ folio.name }}
            </option>
          </select>
          <button
            @click="addToFolio"
            :disabled="!selectedFolioId || !someSelected"
            class="btn btn-primary"
          >
            <i class="fa fa-plus"></i>
            Add Media to Folio
          </button>
          <button
            @click="toggleFolioOptions"
            class="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
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
            <select 
              id="show-filter" 
              @change="onSelectShow"
              data-bs-toggle="tooltip"
              :data-bs-title="controlTooltips.showFilter"
              :title="controlTooltips.showFilter"
            >
              <option value="all">all media</option>
              <option value="identified">identified media</option>
              <option value="unidentified">unidentified media</option>
              <option value="copyrighted">copyrighted media</option>
              <option value="noncopyrighted">non-copyrighted media</option>
            </select>
          </div>
          <div>
            <label for="order-by" class="me-2">Order by:</label>
            <select 
              id="order-by" 
              v-model="orderBySelection"
              data-bs-toggle="tooltip"
              :data-bs-title="controlTooltips.orderBy"
              :title="controlTooltips.orderBy"
            >
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
        <div class="d-flex col-7 justify-content-end align-items-center flex-wrap gap-2">
          <div class="pagination-info">
            Showing page
            <select v-model="selectedPage" class="form-select form-select-sm d-inline-block" style="width: auto;">
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

          <div class="items-per-page">
            Items per page:
            <select v-model="selectedPageSize" class="form-select form-select-sm d-inline-block" style="width: auto;">
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

          <!-- Filter Button -->
          <div class="position-relative">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :class="{ 'btn-warning': activeFilters, 'text-dark': activeFilters }"
              data-bs-toggle="modal"
              data-bs-target="#mediaFilterModal"
              data-bs-title="Filter media by taxa, views, submitters, and more"
              title="Filter Media"
            >
              <i class="fa fa-filter"></i>
              <span class="d-none d-md-inline"> 
                {{ activeFilters ? 'Filtered' : 'Filter' }}
              </span>
              <!-- Active filter indicator -->
              <span 
                v-if="activeFilters" 
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
                style="font-size: 0.6rem; padding: 0.2rem 0.4rem;"
              >
                !
              </span>
            </button>
            <!-- Clear filters button when filters are active -->
            <button
              v-if="activeFilters"
              type="button"
              class="btn btn-sm btn-outline-danger ms-1"
              @click="clearAllFilters($event)"
              data-bs-toggle="tooltip"
              data-bs-title="Remove all active filters"
              title="Clear All Filters"
            >
              <i class="fa fa-times"></i>
              <span class="d-none d-lg-inline"> Clear</span>
            </button>
          </div>

          <!-- Folio Tools Button -->
          <div v-if="foliosStore.folios.length > 0">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="toggleFolioOptions($event)"
              :class="{ active: showFolioOptions }"
              data-bs-toggle="tooltip"
              :data-bs-title="folioToolsTooltip"
              :title="folioToolsTooltip"
            >
              <i class="fa fa-book"></i>
              <span class="d-none d-lg-inline"> Folio Tools</span>
            </button>
          </div>

          <div class="view-toggles d-flex">
            <button
              @click="setThumbnailView($event)"
              :style="{ backgroundColor: thumbnailView ? '#e0e0e0' : '#fff' }"
              data-bs-toggle="tooltip"
              data-bs-title="Thumbnail view"
              title="thumbnail-view"
              class="btn btn-sm btn-outline-secondary me-1"
            >
              <i class="fa-solid fa-border-all"></i>
            </button>
            <button
              @click="setCompactView($event)"
              :style="{ backgroundColor: thumbnailView ? '#fff' : '#e0e0e0' }"
              data-bs-toggle="tooltip"
              data-bs-title="Compact view"
              title="mosaic-view"
              class="btn btn-sm btn-outline-secondary"
            >
              <i class="fa-solid fa-table-cells"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Active filters indicator -->
      <div v-if="activeFilters" class="active-filters-bar mb-3">
        <div class="alert alert-warning d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center">
            <i class="fa fa-filter me-2"></i>
            <span class="fw-bold">Filters Active:</span>
            <span class="ms-2">
              {{ getActiveFiltersText(activeFilters) }}
            </span>
          </div>
          <div class="d-flex gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-warning"
              data-bs-toggle="modal"
              data-bs-target="#mediaFilterModal"
            >
              <i class="fa fa-edit"></i> Edit Filters
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              @click="clearAllFilters($event)"
            >
              <i class="fa fa-times"></i> Clear All
            </button>
          </div>
        </div>
      </div>

      <!-- Selection Bar for batch operations - Always visible -->
      <div class="selection-bar mb-3">
        <label class="item" title="Select all">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="allSelected"
            :indeterminate.prop="someSelected && !allSelected"
            aria-label="Select all items"
            title="Select all"
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
          :class="{ disabled: !someSelected }"
          data-bs-toggle="modal"
          :data-bs-target="someSelected ? '#mediaEditModal' : ''"
          :title="batchEditTooltip"
        >
          <i class="fa-regular fa-pen-to-square"></i>
        </span>
        <span
          class="item"
          :class="{ disabled: !someSelected }"
          @click="someSelected ? downloadSelected() : null"
          data-bs-toggle="tooltip"
          :data-bs-title="downloadSelectedTooltip"
          :title="downloadSelectedTooltip"
        >
          <i class="fa-solid fa-download"></i>
        </span>
        <span
          v-if="foliosStore.folios.length > 0"
          class="item"
          :class="{ disabled: !someSelected }"
          @click="someSelected ? toggleFolioOptions() : null"
          data-bs-toggle="tooltip"
          :data-bs-title="addToFolioTooltip"
          :title="addToFolioTooltip"
        >
          <i class="fa-solid fa-book"></i>
        </span>
        <span
          class="item"
          :class="{ disabled: !someSelected }"
          data-bs-toggle="modal"
          :data-bs-target="someSelected ? '#mediaDeleteModal' : ''"
          @click="
            someSelected ? (mediaToDelete = filteredMedia.filter(
              (b) => selectedMedia[b.media_id]
            )) : null
          "
          :title="deleteSelectedTooltip"
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
          <div class="media-card-wrapper position-relative" 
               @mouseenter="hoveredMedia[media_file.media_id] = true"
               @mouseleave="hoveredMedia[media_file.media_id] = false">
            <!-- Exemplar Badge - Bottom left corner -->
            <div 
              v-if="media_file.media_id === projectExemplarMediaId"
              class="position-absolute bottom-0 start-0"
              style="z-index: 10; margin: 8px;"
              title="Project Exemplar"
            >
              <span style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 10px;
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #000;
                font-size: 0.7rem;
                font-weight: 600;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
                border: 1px solid rgba(255, 215, 0, 0.3);
              ">
                <i class="fa fa-star" style="font-size: 0.75rem; color: #000;"></i>
                <span style="letter-spacing: 0.3px;">EXEMPLAR</span>
              </span>
            </div>
            
            <!-- Quick Set Exemplar Button - Only visible on hover -->
            <transition name="fade">
              <button
                v-if="hoveredMedia[media_file.media_id] &&
                      media_file.media_type === 'image' && 
                      media_file.cataloguing_status === 0 && 
                      media_file.specimen_id && 
                      media_file.view_id && 
                      media_file.is_copyrighted !== null &&
                      media_file.media_id !== projectExemplarMediaId"
                @click.stop="setAsExemplar(media_file.media_id)"
                class="position-absolute bottom-0 end-0"
                style="
                  z-index: 10;
                  margin: 8px;
                  background: rgba(255, 255, 255, 0.95);
                  border: 1px solid rgba(0, 0, 0, 0.1);
                  border-radius: 50%;
                  width: 32px;
                  height: 32px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  transition: all 0.2s ease;
                  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                "
                onmouseover="this.style.background='#FFD700'; this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(255, 215, 0, 0.5)'"
                onmouseout="this.style.background='rgba(255, 255, 255, 0.95)'; this.style.transform='scale(1)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.15)'"
                title="Set as Project Exemplar"
              >
                <i class="fa fa-star" style="font-size: 0.9rem; color: #666; transition: color 0.2s ease;" 
                   onmouseover="this.style.color='#000'"
                   onmouseout="this.style.color='#666'"></i>
              </button>
            </transition>

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
                data-bs-toggle="tooltip"
                data-bs-html="true"
                :data-bs-title="getMediaTooltipContent(media_file)"
                :title="getMediaTooltipContent(media_file)"
              ></MediaCardComp>
            </RouterLink>
          </div>
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
    :onFiltersUpdated="onFiltersUpdated"
    :clearAllFilters="clearAllFilters"
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

.selection-bar .item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.selection-bar .item.disabled:hover {
  background-color: transparent;
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
    gap: 0.5rem !important;
  }

  .pagination-info,
  .items-per-page {
    font-size: 0.9rem;
  }

  /* Stack controls vertically on small screens */
  .view-toggles {
    margin-top: 0.25rem;
  }
}

@media (max-width: 1024px) {
  /* Hide text on medium screens, keep icon */
  .folio-tools-text {
    display: none;
  }
}

/* Empty state styling */
.fa-images {
  opacity: 0.5;
}

/* Folio tools styling */
.btn.active {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.btn-outline-secondary.active {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

.folio-options .form-select {
  min-width: 200px;
}

.folio-options .alert {
  margin-bottom: 0;
}

/* Control section styling */
.pagination-info,
.items-per-page {
  white-space: nowrap;
  font-size: 0.9rem;
}

.view-toggles button {
  border-radius: 0.375rem;
}

/* Filter button styling */
.btn-warning.text-dark {
  border-color: #ffc107;
  background-color: #fff3cd;
}

.btn-warning.text-dark:hover {
  background-color: #ffc107;
  border-color: #ffca2c;
  color: #000;
}

/* Active filters bar styling */
.active-filters-bar .alert {
  margin-bottom: 0;
  font-size: 0.9rem;
}

.active-filters-bar .alert-warning {
  background-color: #fff3cd;
  border-color: #ffeaa7;
  color: #856404;
}

/* Filter button badge */
.badge.bg-warning.text-dark {
  background-color: #ffc107 !important;
  color: #000 !important;
}

/* Cursor pointer utility class */
.cursor-pointer {
  cursor: pointer;
}

/* Fade transition for exemplar button */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
