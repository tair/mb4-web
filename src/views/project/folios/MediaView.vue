<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useFoliosStore } from '@/stores/FoliosStore'
import { useFolioMediaStore } from '@/stores/FolioMediaStore'
import { useMediaStore } from '@/stores/MediaStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { getTaxonForMediaId } from '@/views/project/utils'
import AddMediaDialog from '@/views/project/common/AddMediaDialog.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MediaCard from '@/components/project/MediaCard.vue'
import DeleteDialog from '@/views/project/common/DeleteDialog.vue'
import { buildMediaUrl } from '@/utils/fileUtils.js'
// @ts-ignore
import Draggable from 'vuedraggable'

const route = useRoute()
const projectId = parseInt(route.params.id as string)
const folioId = parseInt(route.params.folioId as string)

const foliosStore = useFoliosStore()
const folioMediaStore = useFolioMediaStore()
const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()

const isLoaded = computed(
  () =>
    foliosStore.isLoaded &&
    folioMediaStore.isLoaded &&
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)

const folioMedia = ref<any[]>([])

// Drag and drop functionality - declare these before using them
const isDragging = ref(false)
const isUpdatingOrder = ref(false)

// Watch for changes in the stores and update folioMedia
function updateFolioMedia() {
  // Don't update if we're in the middle of a drag operation
  if (isUpdatingOrder.value || isDragging.value) {
    console.log('Skipping updateFolioMedia - drag operation in progress')
    return
  }

  if (!folioMediaStore.isLoaded || !mediaStore.isLoaded) {
    folioMedia.value = []
    return
  }

  // Get the media with position information from the folio store
  const folioMediaWithPositions = folioMediaStore.media

  // Create a map of current selected states to preserve them
  const selectedStates = new Map()
  folioMedia.value.forEach((item: any) => {
    if (item.media_id && item.selected) {
      selectedStates.set(item.media_id, true)
    }
  })

  // Get the actual media data and merge with folio info
  const media = folioMediaWithPositions.map((folioMediaItem: any) => {
    const mediaData = mediaStore.getMediaById(folioMediaItem.media_id)
    // If mediaData is undefined (media not in store yet), skip this item
    // It will be properly loaded when the store is refreshed
    if (!mediaData) {
      return null
    }
    return {
      ...mediaData,
      link_id: folioMediaItem.link_id,
      position: folioMediaItem.position,
      folio_id: folioMediaItem.folio_id,
      selected: selectedStates.get(folioMediaItem.media_id) || false,
    }
  }).filter(item => item !== null) // Remove null items
  // Sort by position to maintain order
  folioMedia.value = media.sort(
    (a: any, b: any) => (a.position || 0) - (b.position || 0)
  )
}

// Watch for store changes
watchEffect(() => {
  // Only update if not dragging
  if (!isDragging.value && !isUpdatingOrder.value) {
    updateFolioMedia()
  }
})

const filioMediaToDelete = ref([])

const allSelected = computed({
  get: function () {
    return folioMedia.value.every((b: any) => b.selected)
  },
  set: function (value: any) {
    folioMedia.value.forEach((b: any) => {
      b.selected = value
    })
  },
})

const someSelected = computed(() =>
  folioMedia.value.some((b: any) => b.selected)
)

onMounted(async () => {
  if (!folioMediaStore.isLoaded) {
    await folioMediaStore.fetch(projectId, folioId)
  }
  if (!foliosStore.isLoaded) {
    foliosStore.fetch(projectId)
  }
  if (!mediaStore.isLoaded) {
    await mediaStore.fetchMedia(projectId)
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

  // Update folioMedia after stores are loaded
  updateFolioMedia()
})

onUnmounted(() => {
  folioMediaStore.invalidate()
})

async function addMedia(mediaIds: number[]): Promise<boolean> {
  return folioMediaStore.create(projectId, folioId, mediaIds)
}

function handleMediaAdded() {
  // Refresh the folio media store to get the updated list
  folioMediaStore.fetch(projectId, folioId)
}

async function deleteFolioMedia(): Promise<boolean> {
  const mediaIds: number[] = filioMediaToDelete.value
  const linkIds = folioMedia.value
    .filter((m: any) => mediaIds.includes(m.media_id))
    .map((m: any) => m.link_id)
  const deleted = folioMediaStore.deleteIds(projectId, folioId, linkIds)
  if (deleted) {
    filioMediaToDelete.value = []
  }
  return deleted
}

async function refresh() {
  await Promise.all([
    folioMediaStore.fetch(projectId, folioId),
    foliosStore.fetch(projectId),
    mediaStore.fetchMedia(projectId),
    taxaStore.fetch(projectId),
    mediaViewsStore.fetchMediaViews(projectId),
  ])
}

// Helper function to create S3 media URLs for MediaCard
function getMediaThumbnailUrl(media: any) {
  if (media.media_id) {
    // Check if this is a 3D file that should use the 3D icon
    const url =
      media.media_type === '3d'
        ? '/images/3DImage.png'
        : buildMediaUrl(projectId, media.media_id, 'thumbnail')
    return {
      url: url,
      width: media.thumbnail?.WIDTH || media.thumbnail?.width || 120,
      height: media.thumbnail?.HEIGHT || media.thumbnail?.height || 120,
    }
  }
  // Fallback to existing thumbnail object
  return media.thumbnail
}

async function onDragEnd(event: any) {
  if (event.oldIndex !== event.newIndex) {
    // Get the moved item from the current array (after draggable has reordered it)
    const movedItem = folioMedia.value[event.newIndex]
    const linkId = movedItem?.link_id

    if (linkId) {
      // Keep the update flag on to prevent store updates
      isUpdatingOrder.value = true

      // Convert from 0-based array index to 1-based position
      const newPosition = event.newIndex + 1

      try {
        // Update the server
        const result = await folioMediaStore.reorderMedia(
          projectId,
          folioId,
          [linkId],
          newPosition
        )

        // Wait for the store to update with the new positions
        await folioMediaStore.fetch(projectId, folioId)
      } catch (error) {
        console.error('Failed to reorder media:', error)
        // On error, revert by fetching fresh data
        await folioMediaStore.fetch(projectId, folioId)
      } finally {
        // Clear the flags and update the local array
        isUpdatingOrder.value = false
        // Force update after clearing the flag
        updateFolioMedia()
      }
    } else {
      console.error('No link_id found for moved item:', movedItem)
    }
  }

  // Always clear the dragging flag
  isDragging.value = false
}

function onDragStart() {
  isDragging.value = true
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="action-bar">
      <button
        type="button"
        class="btn btn-m btn-outline-primary"
        data-bs-toggle="modal"
        data-bs-target="#addMediaModal"
      >
        <i class="fa fa-plus"></i>
        <span> Add Media</span>
      </button>
    </div>
    <div>
      Drag and drop images into desired order. Your changes are saved
      automatically.
    </div>
    <div v-if="folioMedia?.length">
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
        </label>
        <span v-if="!someSelected" class="item" @click="refresh">
          <i class="fa-solid fa-arrow-rotate-right"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#deleteModal"
          @click="
            filioMediaToDelete = folioMedia
              .filter((m: any) => m.selected)
              .map((m: any) => m.media_id)
          "
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>
      <Draggable
        v-model="folioMedia"
        item-key="media_id"
        class="grid-group-items"
        :class="{ dragging: isDragging }"
        @start="onDragStart"
        @end="onDragEnd"
        :animation="200"
        :force-fallback="true"
        ghost-class="ghost"
        chosen-class="chosen"
        drag-class="drag"
      >
        <template #item="{ element: media }">
          <div>
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
                />
              </template>
            </MediaCard>
          </div>
        </template>
      </Draggable>
    </div>
  </LoadingIndicator>
  <AddMediaDialog
    :addMedia="addMedia"
    :projectId="projectId"
    :excludeMediaIds="folioMedia.map((m: any) => m.media_id)"
    @mediaAdded="handleMediaAdded"
  />
  <DeleteDialog :delete="deleteFolioMedia">
    <template #modal-body>
      Really delete {{ filioMediaToDelete.length }} media from this folio?
    </template>
  </DeleteDialog>
</template>
<style scoped>
@import '@/views/project/styles.css';

.media-checkbox {
  border: var(--bs-card-border-width) solid var(--bs-card-border-color);
  margin: 5px 10px 0;
}

/* Drag and drop styles */
.dragging {
  cursor: grabbing;
}

.grid-group-items .ghost {
  opacity: 0.5;
  background: #f0f0f0;
  border: 2px dashed #ccc;
}

.grid-group-items .chosen {
  opacity: 0.8;
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.grid-group-items .drag {
  transform: rotate(5deg);
  opacity: 0.9;
}

.grid-group-items > div {
  cursor: grab;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.grid-group-items > div:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
