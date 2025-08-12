<script setup lang="ts">
import { Modal } from 'bootstrap'
import { reactive, ref, computed } from 'vue'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import MediaImage from '@/components/project/MediaImage.vue'

const props = defineProps<{
  addMedia: (mediaIds: number[]) => Promise<boolean>
  projectId: number | string
  excludeMediaIds?: number[]
}>()

const emit = defineEmits<{
  mediaAdded: [mediaIds: number[]]
}>()

const text = ref('')
const mediaStore = useMediaStore()
const mediaViewsStore = useMediaViewsStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const projectUsersStore = useProjectUsersStore()

const selectedMediaIds: Set<number> = reactive(new Set())

// Helper functions (same as ListView.vue)
function getTaxon(media: any) {
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

function getTaxonName(media: any) {
  const taxon = getTaxon(media)
  if (!taxon) return ''

  const parts = []
  if (taxon.genus) parts.push(taxon.genus)
  if (taxon.specific_epithet) parts.push(taxon.specific_epithet)
  return parts.join(' ')
}

function getViewName(media: any) {
  return mediaViewsStore.getMediaViewById(media.view_id)?.name || ''
}

function getUser(media: any) {
  if (media.user_id == null) {
    return null
  }
  return projectUsersStore.getUserById(media.user_id)
}

function getUserName(media: any) {
  const user = getUser(media)
  return user ? `${user.fname} ${user.lname}` : ''
}

// Client-side search logic - show all media but mark existing ones
const filteredMedia = computed(() => {
  const allMedia = Array.isArray(mediaStore.media) ? mediaStore.media : []

  // If no search text, return all media
  if (!text.value || !text.value.trim()) {
    return allMedia.map((m: any) => ({
      media_id: m.media_id,
      isInFolio: (props.excludeMediaIds || []).includes(m.media_id),
      taxonName: getTaxonName(m),
      viewName: getViewName(m),
      userName: getUserName(m),
    }))
  }

  const searchLower = text.value.toLowerCase().trim()
  const filtered = allMedia.filter((m: any) => {
    const mediaIdStr = `M${m.media_id}`.toLowerCase()
    const viewName = getViewName(m)?.toLowerCase() || ''
    const taxonName = getTaxonName(m)?.toLowerCase() || ''
    const userName = getUserName(m)?.toLowerCase() || ''

    return (
      mediaIdStr.includes(searchLower) ||
      viewName.includes(searchLower) ||
      taxonName.includes(searchLower) ||
      userName.includes(searchLower)
    )
  })

  return filtered.map((m: any) => ({
    media_id: m.media_id,
    isInFolio: (props.excludeMediaIds || []).includes(m.media_id),
    taxonName: getTaxonName(m),
    viewName: getViewName(m),
    userName: getUserName(m),
  }))
})

async function handleAdd() {
  const addMediaIds = Array.from(selectedMediaIds)
  const added = await props.addMedia(addMediaIds)
  if (added) {
    // Emit the added media IDs so parent can update its exclude list
    emit('mediaAdded', addMediaIds)

    const element = document.getElementById('addMediaModal')
    const modal = Modal.getInstance(element)
    modal.hide()
    reset()
  } else {
    alert('Failed to add media')
  }
}

// No need for async find function - using reactive computed property

function selectedMedia(mediaItem: any) {
  // Don't allow selecting media that's already in folio
  if (mediaItem.isInFolio) {
    return
  }

  if (selectedMediaIds.has(mediaItem.media_id)) {
    selectedMediaIds.delete(mediaItem.media_id)
  } else {
    selectedMediaIds.add(mediaItem.media_id)
  }
}

function reset() {
  selectedMediaIds.clear()
  text.value = ''
}
</script>
<template>
  <div
    class="modal fade"
    id="addMediaModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Add Media</h5>
        </div>
        <div class="modal-body">
          <div class="searchControls">
            <div class="input-group mb-3">
              <input
                type="text"
                class="mediaInput form-control"
                placeholder="Search for Media (type to filter instantly)"
                v-model="text"
              />
            </div>
          </div>
          <div class="addMedia">
            <div class="mediaGrid">
              <template
                v-for="mediaItem in filteredMedia"
                :key="mediaItem.media_id"
              >
                <div
                  :class="{
                    selected: selectedMediaIds.has(mediaItem.media_id),
                    inFolio: mediaItem.isInFolio,
                    mediaGridItem: true,
                  }"
                  @click="selectedMedia(mediaItem)"
                  :title="
                    mediaItem.isInFolio ? 'Already in folio' : 'Click to select'
                  "
                >
                  <MediaImage
                    :projectId="props.projectId"
                    :mediaId="mediaItem.media_id"
                    :fileSize="'thumbnail'"
                  ></MediaImage>
                  <div class="mediaInfo">
                    <span class="mediaId">M{{ mediaItem.media_id }}</span>
                    <span v-if="mediaItem.taxonName" class="taxonName">{{
                      mediaItem.taxonName
                    }}</span>
                    <span v-if="mediaItem.viewName" class="viewName">{{
                      mediaItem.viewName
                    }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-outline-primary"
            data-bs-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!selectedMediaIds.size"
            @click="handleAdd"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.mediaInput {
  outline: none;
}

.mediaInput:focus {
  border-color: #ef782f;
  box-shadow: none;
}

.searchControls {
  margin-bottom: 5px;
}

.addMedia {
  border: 1px solid #ddd;
  border-radius: var(--bs-border-radius);
  height: 50vh;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 3px;
  position: relative;
}

.mediaGrid {
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(5, 1fr);
  padding: 10px;
}

.mediaGridItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  margin: auto;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.mediaGridItem:hover:not(.inFolio) {
  background-color: #f0f0f0;
}

.mediaGridItem.selected {
  background-color: #b2e1ff;
}

.mediaGridItem.inFolio {
  opacity: 0.5;
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.mediaInfo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 5px;
  min-height: 60px;
  text-align: center;
}

.mediaId {
  font-weight: bold;
  font-size: 12px;
  color: #666;
}

.taxonName {
  font-style: italic;
  font-size: 11px;
  color: #333;
  margin-top: 2px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viewName {
  font-size: 10px;
  color: #888;
  margin-top: 1px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
