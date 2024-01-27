<script setup lang="ts">
import { Modal } from 'bootstrap'
import { computed, reactive, ref } from 'vue'
import { useMediaStore } from '@/stores/MediaStore'
import MediaImage from '@/components/project/MediaImage.vue'

const props = defineProps<{
  findMedia: (text: string) => Promise<number[]>
  addMedia: (mediaIds: number[]) => Promise<boolean>
}>()

const text = ref('')
const mediaIds = ref([])
const mediaStore = useMediaStore()

const selectedMediaIds: Set<number> = reactive(new Set())

async function handleAdd() {
  const addMediaIds = Array.from(selectedMediaIds)
  const added = await props.addMedia(addMediaIds)
  if (added) {
    const element = document.getElementById('addMediaModal')
    const modal = Modal.getInstance(element)
    modal.hide()
    reset()
  } else {
    alert('Failed to add media')
  }
}

async function find() {
  mediaIds.value = await props.findMedia(text.value)
}

function selectedMedia(mediaId: number) {
  if (selectedMediaIds.has(mediaId)) {
    selectedMediaIds.delete(mediaId)
  } else {
    selectedMediaIds.add(mediaId)
  }
}

function reset() {
  selectedMediaIds.clear()
  mediaIds.value = []
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
                placeholder="Search for Media"
                v-model="text"
              />
              <button
                class="media-find-button btn btn-primary"
                type="button"
                id=""
                :disabled="!text.length"
                :onclick="find"
              >
                Find
              </button>
            </div>
          </div>
          <div class="addMedia">
            <div class="mediaGrid">
              <template v-for="mediaId in mediaIds" :key="mediaId">
                <div
                  :class="{
                    selected: selectedMediaIds.has(mediaId),
                    mediaGridItem: true,
                  }"
                  @click="selectedMedia(mediaId)"
                >
                  <MediaImage
                    :image="mediaStore.getMediaById(mediaId)?.icon"
                  ></MediaImage>
                  <span>M{{ mediaId }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
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
  display: block;
  padding: 10px;
  margin: auto;
}

.mediaGridItem.selected {
  background-color: #b2e1ff;
}
</style>
