<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaStore } from '@/stores/MediaStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { getTaxonForMediaId } from '@/views/project/utils'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MediaCard from '@/components/project/MediaCard.vue'

const route = useRoute()
const projectId = route.params.id

const mediaStore = useMediaStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const mediaViewsStore = useMediaViewsStore()
const isLoaded = computed(
  () =>
    mediaStore.isLoaded &&
    specimensStore.isLoaded &&
    taxaStore.isLoaded &&
    mediaViewsStore.isLoaded
)

const filters = reactive({
  released: (media) => media.cataloguing_status == 1,
})
const filteredMedia = computed(() =>
  Object.values(filters).reduce(
    (media, filter) => media.filter(filter),
    mediaStore.media
  )
)

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

async function releaseSelectedMedia() {
  const mediaIds = filteredMedia.value
    .filter((m) => m.selected)
    .map((m) => m.media_id)
  const success = await mediaStore.editIds(projectId, mediaIds, {
    media: { cataloguing_status: 0 },
  })
  if (!success) {
    alert('Failed to release the media')
  }
}

async function deleteSelectedMedia() {
  const mediaIds = filteredMedia.value
    .filter((m) => m.selected)
    .map((m) => m.media_id)
  const success = await mediaStore.deleteIds(projectId, mediaIds)
  if (!success) {
    alert('Failed to delete the media')
  }
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
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      Your batch information is saved (mouse over to see). Usually there are a
      few more edits to make before your Media are ready. Click the upper right
      box on your Media to edit Views or Specimens, then Save. When everything
      has an orange box you are done. Then Release!
      <p>
        Click here to add your
        <RouterLink :to="`/myprojects/${projectId}/specimens/`"
          >specimens</RouterLink
        >
        or
        <RouterLink :to="`/myprojects/${projectId}/views/`">views</RouterLink>.
      </p>
    </header>
    <br />
    <div v-if="mediaStore.media?.length">
      <div class="selection-bar">
        <label class="item">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="allSelected"
            :indeterminate.prop="someSelected && !allSelected"
          />
        </label>
        <button
          v-if="someSelected"
          type="button"
          class="btn btn-outline-secondary btn-sm"
          @click="releaseSelectedMedia"
        >
          <i class="fa fa-arrow-up-from-bracket"></i>
          <span> Release Media</span>
        </button>
        <button
          v-if="someSelected"
          type="button"
          class="btn btn-outline-secondary btn-sm"
          @click="deleteSelectedMedia"
        >
          <i class="fa fa-trash-can"></i>
          <span> Delete Media</span>
        </button>
      </div>
      <div class="grid-group-items">
        <div v-for="media in filteredMedia" :key="media.media_id">
          <MediaCard
            :mediaId="media.media_id"
            :image="media.thumbnail"
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
</template>
<style scoped>
@import '@/views/project/styles.css';

.media-checkbox {
  border: var(--bs-card-border-width) solid var(--bs-card-border-color);
  margin: 5px 10px 0;
}
</style>
