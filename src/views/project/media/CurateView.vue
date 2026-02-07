<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { getTaxonForMediaId } from '@/views/project/utils'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MediaCard from '@/components/project/MediaCard.vue'
import { buildMediaUrl, isZipMedia } from '@/utils/fileUtils.js'
import { useNotifications } from '@/composables/useNotifications'
import CurationBatchDialog from './CurationBatchDialog.vue'
import ViewBatchDialog from './ViewBatchDialog.vue'
import SpecimenBatchDialog from './SpecimenBatchDialog.vue'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id

const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const { showError, showSuccess } = useNotifications()
const mediaViewsStore = useMediaViewsStore()
const isLoaded = computed(
  () =>
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)

const filters = reactive({
  uncurated: (media) => media.cataloguing_status == 1,
})
const filteredMedia = computed(() => {
  const filtered = Object.values(filters).reduce(
    (media, filter) => media.filter(filter),
    mediaStore.media
  )
  return filtered
})

const allSelected = computed({
  get: function () {
    return filteredMedia.value.every((b) => b.selected)
  },
  set: function (value) {
    filteredMedia.value.forEach((b) => {
      b.selected = value
    })
  },
})

const someSelected = computed(() => filteredMedia.value.some((b) => b.selected))

// Get selected media for batch operations
const selectedMedia = computed(() =>
  filteredMedia.value.filter((media) => media.selected)
)

// Check if selected media can be released (have both specimen and view assigned)
const canReleaseSelected = computed(() => {
  return selectedMedia.value.every(
    (media) =>
      media.specimen_id &&
      media.view_id &&
      media.specimen_id !== 0 &&
      media.view_id !== 0
  )
})

// Helper function to create S3 media URLs for MediaCard
function getMediaThumbnailUrl(media) {
  if (media.media_id) {
    // Check if this is a 3D file that should use the 3D icon
    if (media.media_type === '3d') {
      return {
        url: '/images/3DImage.png',
        width: 120,
        height: 120,
      }
    }
    // Check if this is a ZIP/archive file (CT scans) that should use the CT scan icon
    if (isZipMedia(media)) {
      return {
        url: '/images/CTScan.png',
        width: 120,
        height: 120,
      }
    }
    return {
      url: buildMediaUrl(projectId, media.media_id, 'thumbnail'),
      width: 120,
      height: 120,
    }
  }
  // Fallback to existing thumbnail object
  return media.thumbnail
}

// Helper function to get large image URL for hover preview
function getMediaLargeUrl(media) {
  // Skip preview for 3D media (no large image available)
  if (media.media_type === '3d') {
    return null
  }
  // Skip preview for ZIP/archive media (CT scans - no large image available)
  if (isZipMedia(media)) {
    return null
  }
  if (media.media_id) {
    return buildMediaUrl(projectId, media.media_id, 'large')
  }
  return null
}

// Helper function to get specimen name for hover preview
function getSpecimenName(media) {
  if (!media.specimen_id) return null
  
  const specimen = specimensStore.getSpecimenById(media.specimen_id)
  if (!specimen) return null
  
  // Build a display name from the specimen and its taxon
  const taxon = specimen.taxon_id ? taxaStore.getTaxonById(specimen.taxon_id) : null
  
  if (taxon) {
    // Build taxon name: genus + specific_epithet
    let name = ''
    if (taxon.genus) name += taxon.genus
    if (taxon.specific_epithet) name += ' ' + taxon.specific_epithet
    
    // Add specimen reference (institution code, catalog number, etc.)
    if (specimen.reference_source === 0) {
      let ref = specimen.institution_code || ''
      if (specimen.collection_code) ref += '/' + specimen.collection_code
      if (specimen.catalog_number) ref += ':' + specimen.catalog_number
      if (ref) name += ' (' + ref + ')'
    } else if (specimen.reference_source === 1) {
      name += ' (unvouchered)'
    }
    
    return name.trim() || `S${specimen.specimen_id}`
  }
  
  // Fallback to specimen ID
  return `S${specimen.specimen_id}`
}

async function releaseSelectedMedia() {
  // Check if all selected media have specimen and view assigned
  if (!canReleaseSelected.value) {
    showError('All selected media must have both specimen and view assigned before release.')
    return
  }

  // Confirm the action
  if (
    !confirm(
      `Are you sure you want to release ${selectedMedia.value.length} media items?`
    )
  ) {
    return
  }

  const mediaIds = selectedMedia.value.map((m) => m.media_id)

  const success = await mediaStore.editIds(projectId, mediaIds, {
    cataloguing_status: 0,
  })

  if (!success) {
    showError('Failed to release the media')
  } else {
    // Clear the store first to ensure fresh data
    mediaStore.invalidate()
    // Refresh the media list to show updated status
    await mediaStore.fetchMedia(projectId)
    showSuccess(`Successfully released ${mediaIds.length} media items!`)
  }
}

async function batchEditMedia(formData) {
  const mediaIds = selectedMedia.value.map((m) => m.media_id)

  // Convert form data to proper format
  const json = {}

  // Handle both FormData and plain objects
  if (formData instanceof FormData) {
    for (const [key, value] of formData.entries()) {
      if (value && value !== '0') {
        json[key] = parseInt(value) || value
      }
    }
  } else {
    // Handle plain object (from CurationBatchDialog)
    for (const [key, value] of Object.entries(formData)) {
      if (value && value !== '0') {
        json[key] = parseInt(value) || value
      }
    }
  }

  const success = await mediaStore.editIds(projectId, mediaIds, json)

  if (success) {
    // Refresh the media list to show updated assignments
    await mediaStore.fetchMedia(projectId)
  }

  return success
}

async function deleteSelectedMedia() {
  const mediaIds = selectedMedia.value.map((m) => m.media_id)
  const success = await mediaStore.deleteIds(projectId, mediaIds)
  if (!success) {
    showError('Failed to delete the media')
  } else {
    showSuccess(`Successfully deleted ${mediaIds.length} media items!`)
    // Refresh the media list to show updated status
    await mediaStore.fetchMedia(projectId)
  }
}

onMounted(() => {
  console.log('CurateView: Component mounted, refreshing data...')

  // Invalidate the media store to ensure we get fresh data
  mediaStore.invalidate()

  // Always refresh data when component mounts to ensure we have the latest data
  mediaStore.fetchMedia(projectId)
  specimensStore.fetchSpecimens(projectId)
  taxaStore.fetch(projectId)
  mediaViewsStore.fetchMediaViews(projectId)
})

// Watch for route changes to refresh data when navigating to this view
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath && newPath.includes('/media/curate')) {
      // Refresh data when navigating to curate view
      mediaStore.invalidate()
      mediaStore.fetchMedia(projectId)
    }
  }
)

// Redirect to media list if there's no media to curate
watch(
  [isLoaded, filteredMedia],
  ([loaded, media]) => {
    if (loaded && media.length === 0) {
      // Small delay to ensure any modal cleanup completes before navigation
      setTimeout(() => {
        // Force cleanup any remaining modal artifacts before navigation
        const backdrop = document.querySelector('.modal-backdrop')
        if (backdrop) {
          backdrop.remove()
        }
        document.body.classList.remove('modal-open')
        document.body.style.removeProperty('overflow')
        document.body.style.removeProperty('padding-right')
        
        router.push(`/myprojects/${projectId}/media`)
      }, 200)
    }
  },
  { immediate: true }
)
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded" :key="`curate-${projectId}`">
    <header>
      <div class="alert alert-info compact-workflow">
        <h5 class="mb-0">
          <button
            class="btn btn-link text-decoration-none text-start w-100 p-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#curationWorkflowHelp"
            aria-expanded="true"
            aria-controls="curationWorkflowHelp"
          >
            <i class="fa fa-info-circle me-2"></i>Curation Workflow
            <i class="fa fa-chevron-down ms-2 collapse-icon"></i>
          </button>
        </h5>
        <div class="collapse show" id="curationWorkflowHelp">
          <div class="mt-2">
            <p class="mb-2 small">
              Your uploaded media need to be curated before they can be released.
              Each media item must have both a <strong>specimen</strong> and a
              <strong>view</strong> assigned.
            </p>
            <div class="row g-2">
              <div class="col-md-6">
                <strong class="small">How to curate:</strong>
                <ol class="mb-0 small compact-list">
                  <li>Select one or more media items using the checkboxes</li>
                  <li>Choose an assignment option:
                    <ul class="mt-1">
                      <li><strong>Assign View</strong> - Assign the same view to multiple items that may have different specimens</li>
                      <li><strong>Assign Specimen</strong> - Assign the same specimen to multiple items that may have different views</li>
                      <li><strong>Assign Specimen, View & Release</strong> - Assign both and release immediately</li>
                    </ul>
                  </li>
                  <li>Or use <strong>Release Media</strong> to release items that already have both assigned</li>
                </ol>
              </div>
              <div class="col-md-6">
                <strong class="small">Status indicators:</strong>
                <ul class="mb-0 small compact-list">
                  <li><span class="badge bg-success">Green</span> = Assigned</li>
                  <li><span class="badge bg-danger">Red</span> = Missing</li>
                </ul>
                <!-- <p class="mt-2 mb-0"><small><strong>Tip:</strong> Use "Assign View Only" when multiple items share the same view but have different specimens, or vice versa.</small></p> -->
              </div>
            </div>
            <hr class="my-2" />
            <p class="mb-0 small">
              <i class="fa fa-exclamation-triangle me-2"></i>
              Make sure you have
              <RouterLink
                :to="`/myprojects/${projectId}/specimens/`"
                class="alert-link"
                >specimens</RouterLink
              >
              and
              <RouterLink :to="`/myprojects/${projectId}/views/`" class="alert-link"
                >views</RouterLink
              >
              created before starting curation.
            </p>
          </div>
        </div>
      </div>
    </header>
    <br />
    <div v-if="mediaStore.media?.length">
      <div class="selection-bar">
        <label class="item" title="Select all">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="allSelected"
            :indeterminate.prop="someSelected && !allSelected"
            aria-label="Select all items"
            title="Select all"
          />
          <span class="ms-2">Select All</span>
        </label>

        <!-- Batch Edit Button -->
        <button
          v-if="someSelected"
          type="button"
          class="btn btn-outline-primary btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#curationBatchModal"
        >
          <i class="fa fa-edit"></i>
          <span> Assign Specimen, View & Release</span>
        </button>

        <!-- Assign View Only Button -->
        <button
          v-if="someSelected"
          type="button"
          class="btn btn-outline-primary btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#viewBatchModal"
        >
          <i class="fa fa-eye"></i>
          <span> Assign View</span>
        </button>

        <!-- Assign Specimen Only Button -->
        <button
          v-if="someSelected"
          type="button"
          class="btn btn-outline-primary btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#specimenBatchModal"
        >
          <i class="fa fa-bone"></i>
          <span> Assign Specimen</span>
        </button>

        <!-- Release Button (only enabled if all selected have specimen and view) -->
        <button
          v-if="someSelected"
          type="button"
          class="btn btn-outline-success btn-sm"
          @click="releaseSelectedMedia"
          :disabled="!canReleaseSelected"
          :title="
            !canReleaseSelected
              ? 'All selected media must have specimen and view assigned'
              : 'Release selected media'
          "
        >
          <i class="fa fa-arrow-up-from-bracket"></i>
          <span> Release Media ({{ selectedMedia.length }})</span>
        </button>

        <button
          v-if="someSelected"
          type="button"
          class="btn btn-outline-danger btn-sm"
          @click="deleteSelectedMedia"
        >
          <i class="fa fa-trash-can"></i>
          <span> Delete Media</span>
        </button>
      </div>

      <!-- Curation Summary -->
      <div class="curation-summary mb-3">
        <div class="row">
          <div class="col-md-3">
            <div class="summary-card">
              <div class="summary-number">{{ filteredMedia.length }}</div>
              <div class="summary-label">Total Uncurated</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="summary-card">
              <div class="summary-number">
                {{
                  filteredMedia.filter(
                    (m) => m.specimen_id && m.specimen_id !== 0
                  ).length
                }}
              </div>
              <div class="summary-label">With Specimen</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="summary-card">
              <div class="summary-number">
                {{
                  filteredMedia.filter((m) => m.view_id && m.view_id !== 0)
                    .length
                }}
              </div>
              <div class="summary-label">With View</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="summary-card ready">
              <div class="summary-number">
                {{
                  filteredMedia.filter(
                    (m) =>
                      m.specimen_id &&
                      m.specimen_id !== 0 &&
                      m.view_id &&
                      m.view_id !== 0
                  ).length
                }}
              </div>
              <div class="summary-label">Ready to Release</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-group-items">
        <div
          v-for="media in filteredMedia"
          :key="media.media_id"
          class="media-card-container"
        >
          <MediaCard
            :mediaId="media.media_id"
            :image="getMediaThumbnailUrl(media)"
            :viewName="mediaViewsStore.getMediaViewById(media.view_id)?.name"
            :taxon="getTaxonForMediaId(media)"
            :largeImageUrl="getMediaLargeUrl(media)"
            :mediaData="media"
            :specimenName="getSpecimenName(media)"
          >
            <template #bar>
              <input
                class="form-check-input media-checkbox"
                type="checkbox"
                v-model="media.selected"
              />
            </template>
          </MediaCard>

          <!-- Assignment Status Indicators -->
          <div class="assignment-status">
            <div
              class="status-indicator"
              :class="{
                assigned: media.specimen_id && media.specimen_id !== 0,
                missing: !media.specimen_id || media.specimen_id === 0,
              }"
            >
              <i class="fa fa-bone"></i>
              <span class="status-text">{{
                media.specimen_id && media.specimen_id !== 0
                  ? 'Specimen'
                  : 'No Specimen'
              }}</span>
            </div>
            <div
              class="status-indicator"
              :class="{
                assigned: media.view_id && media.view_id !== 0,
                missing: !media.view_id || media.view_id === 0,
              }"
            >
              <i class="fa fa-eye"></i>
              <span class="status-text">{{
                media.view_id && media.view_id !== 0 ? 'View' : 'No View'
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </LoadingIndicator>

  <!-- Batch Edit Dialog -->
  <CurationBatchDialog
    :batchEdit="batchEditMedia"
    :selectedMedia="selectedMedia"
  />

  <!-- View Only Batch Dialog -->
  <ViewBatchDialog
    :batchEdit="batchEditMedia"
    :selectedMedia="selectedMedia"
  />

  <!-- Specimen Only Batch Dialog -->
  <SpecimenBatchDialog
    :batchEdit="batchEditMedia"
    :selectedMedia="selectedMedia"
  />
</template>
<style scoped>
@import '@/views/project/styles.css';

/* Compact workflow styling */
.compact-workflow {
  padding: 0.75rem 1rem;
}

.compact-workflow .compact-list {
  margin-bottom: 0.25rem;
}

.compact-workflow .compact-list li {
  margin-bottom: 0.25rem;
  line-height: 1.4;
}

.compact-workflow .compact-list ul {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

/* Collapsible workflow header */
.alert-info .btn-link {
  color: inherit;
  font-size: 1.1rem;
  font-weight: 500;
}

.alert-info .btn-link:hover {
  color: inherit;
  opacity: 0.8;
}

.alert-info .btn-link .collapse-icon {
  font-size: 0.875rem;
  transition: transform 0.3s ease;
}

.alert-info .btn-link:not(.collapsed) .collapse-icon {
  transform: rotate(180deg);
}

.media-checkbox {
  border: var(--bs-card-border-width) solid var(--bs-card-border-color);
  margin: 5px 10px 0;
}

.media-card-container {
  position: relative;
  margin-bottom: 1rem;
}

.assignment-status {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 10;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
}

.status-indicator.assigned {
  background-color: rgba(25, 135, 84, 0.9);
  color: white;
}

.status-indicator.missing {
  background-color: rgba(220, 53, 69, 0.9);
  color: white;
}

.status-indicator i {
  font-size: 0.7rem;
}

.status-text {
  white-space: nowrap;
}

/* Disabled button styling */
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Selection bar improvements */
.selection-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  border: 1px solid #dee2e6;
}

.selection-bar .item {
  margin: 0;
  display: flex;
  align-items: center;
}

/* Curation Summary Cards */
.curation-summary {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #dee2e6;
}

.summary-card {
  text-align: center;
  padding: 1rem;
  background-color: white;
  border-radius: 0.375rem;
  border: 1px solid #dee2e6;
  transition: all 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.summary-card.ready {
  background-color: #d1e7dd;
  border-color: #badbcc;
}

.summary-number {
  font-size: 2rem;
  font-weight: bold;
  color: #0d6efd;
  margin-bottom: 0.5rem;
}

.summary-card.ready .summary-number {
  color: #198754;
}

.summary-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}
</style>
