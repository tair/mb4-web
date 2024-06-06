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

const mediaToDelete = ref([])

const filters = reactive({
  released: (media) => media.cataloguing_status == 0,
})
const filteredMedia = computed(() =>
  Object.values(filters).reduce(
    (media, filter) => media.filter(filter),
    mediaStore.media
  )
)

const uncuratedMediaCount = computed(
  () => mediaStore.media.filter((m) => m.cataloguing_status == 1).length
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

function refresh() {
  mediaStore.fetchMedia(projectId)
  specimensStore.fetchSpecimens(projectId)
  taxaStore.fetch(projectId)
  mediaViewsStore.fetchMediaViews(projectId)
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      There are {{ mediaStore.media?.length }} media associated with this
      project.
      <p v-if="uncuratedMediaCount > 0">
        <i>*You must curate all your media before adding a new batch</i>
      </p>
    </header>
    <br />
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/media/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Create Media</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/media/upload/batch`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Upload Media</span>
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
      <RouterLink v-else :to="`/myprojects/${projectId}/media/batch`">
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
          <i class="fa fa-file-arrow-down"></i>
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
    </div>
    <div v-if="uncuratedMediaCount > 0">
      This project has {{ mediaStore.media?.length }} media. MorphoBank displays
      {{ filteredMedia.length }} media because {{ uncuratedMediaCount }}
      batch media still need to be curated and released to the general media
      pool.
    </div>
    <div v-else>Displaying {{ filteredMedia.length }} media.</div>
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
        <span v-if="!someSelected" class="item" @click="refresh">
          <i class="fa-solid fa-arrow-rotate-right"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#mediaDeleteModal"
          @click="mediaToDelete = filteredMedia.filter((b) => b.selected)"
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>
      <div class="grid-group-items">
        <RouterLink
          v-for="media in filteredMedia"
          :key="media.media_id"
          :to="`/myprojects/${projectId}/media/${media.media_id}/edit`"
        >
          <MediaCard
            :mediaId="media.media_id"
            :image="media.thumbnail"
            :viewName="mediaViewsStore.getMediaViewById(media.view_id)?.name"
            :taxon="getTaxonForMediaId(media)"
          >
          </MediaCard>
        </RouterLink>
      </div>
    </div>
  </LoadingIndicator>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
