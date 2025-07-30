<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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

const folioMedia = computed(() => {
  const mediaIds = folioMediaStore.mediaIds
  return Array.from(mediaStore.getMediaByIds(mediaIds).values())
})

const filioMediaToDelete = ref([])

const allSelected = computed({
  get: function () {
    return folioMedia.value.every((b) => b.selected)
  },
  set: function (value) {
    folioMedia.value.forEach((b) => {
      b.selected = value
    })
  },
})

const someSelected = computed(() => folioMedia.value.some((b) => b.selected))

onMounted(() => {
  if (!folioMediaStore.isLoaded) {
    folioMediaStore.fetch(projectId, folioId)
  }
  if (!foliosStore.isLoaded) {
    foliosStore.fetch(projectId)
  }
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
})

onUnmounted(() => {
  folioMediaStore.invalidate()
})

async function addMedia(mediaIds: number[]): Promise<boolean> {
  return folioMediaStore.create(projectId, folioId, mediaIds)
}

async function findMedia(text: string): Promise<number[]> {
  const mediaIds = await folioMediaStore.find(projectId, folioId, text)
  return mediaIds
}

async function deleteFolioMedia(): Promise<boolean> {
  const mediaIds: number[] = filioMediaToDelete.value
  const linkIds = folioMediaStore.media
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
    return {
      url: buildMediaUrl(projectId, media.media_id, 'thumbnail'),
      width: media.thumbnail?.WIDTH || media.thumbnail?.width || 120,
      height: media.thumbnail?.HEIGHT || media.thumbnail?.height || 120,
    }
  }
  // Fallback to existing thumbnail object
  return media.thumbnail
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
      automatically. Click the X button to remove media. You can batch load
      media into your folios in the Media tab by clicking the Folio Options
      link.
    </div>
    <div v-if="folioMedia?.length">
      <div class="selection-bar">
        <label class="item">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="allSelected"
            :indeterminate.prop="someSelected && !allSelected"
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
              .filter((m) => m.selected)
              .map((m) => m.media_id)
          "
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>
      <div class="grid-group-items">
        <div v-for="media in folioMedia" :key="media.media_id">
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
      </div>
    </div>
  </LoadingIndicator>
  <AddMediaDialog :findMedia="findMedia" :addMedia="addMedia" />
  <DeleteDialog :delete="deleteFolioMedia">
    <template #modal-body>
      Really delete {{ filioMediaToDelete.length }} media?
    </template>
  </DeleteDialog>
</template>
<style scoped>
@import '@/views/project/styles.css';

.media-checkbox {
  border: var(--bs-card-border-width) solid var(--bs-card-border-color);
  margin: 5px 10px 0;
}
</style>
