<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import DeleteDialog from '@/views/project/views/DeleteDialog.vue'

const route = useRoute()
const projectId = route.params.id

const mediaViewsStore = useMediaViewsStore()
const mediaViewsToDelete = ref([])

const selectedLetter = ref(null)
const letters = computed(() => {
  const letters = new Set()
  for (const mediaView of mediaViewsStore.mediaViews) {
    if (mediaView?.name?.length > 0) {
      const firstLetter = mediaView.name[0]
      letters.add(firstLetter.toUpperCase())
    }
  }
  return [...letters].sort()
})

const filters = reactive({})
const filteredMediaViews = computed(() =>
  Object.values(filters)
    .reduce(
      (mediaViews, filter) => mediaViews.filter(filter),
      mediaViewsStore.mediaViews
    )
    .sort((a, b) => {
      const nameA = a.name
      if (!nameA) {
        return -1
      }

      const nameB = b.name
      if (!nameB) {
        return -1
      }

      const compare = nameA.localeCompare(nameB)
      if (compare) {
        return compare
      }
    })
)

const allSelected = computed({
  get: function () {
    return filteredMediaViews.value.every((b) => b.selected)
  },
  set: function (value) {
    filteredMediaViews.value.forEach((b) => {
      b.selected = value
    })
  },
})
const someSelected = computed(() =>
  filteredMediaViews.value.some((b) => b.selected)
)

onMounted(() => {
  if (!mediaViewsStore.isLoaded) {
    mediaViewsStore.fetchMediaViews(projectId)
  }
})

function refresh() {
  mediaViewsStore.fetchMediaViews(projectId)
}

function setPage(event) {
  const text = event.target.textContent
  if (text == 'ALL') {
    clearFilters()
  } else {
    filterByLetter(text)
  }
}

function clearFilters() {
  selectedLetter.value = null
  delete filters['page']
}

function filterByLetter(letter) {
  selectedLetter.value = letter
  filters['page'] = (mediaView) => {
    if (mediaView?.name.length > 0) {
      const name = mediaView?.name[0]
      return name.toUpperCase() == letter
    }
    return false
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="mediaViewsStore.isLoaded">
    <header>
      There are {{ mediaViewsStore.mediaViews?.length }} media views associated
      with this project.
    </header>
    <br />
    <p>
      A View should indicate both the orientation and element in your 2D or 3D
      image (Media), for example 'dorsal skull' or 'cross-section of leaf' or
      'CT scan of insect body'. The best practice for using the MorphoBank
      database, and one that will make your work maximally searchable, is to
      include only one View per image (Media) rather than multi-image plates.
    </p>
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/views/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Create Media View</span>
        </button>
      </RouterLink>
    </div>
    <div v-if="filteredMediaViews.length">
      <div class="alphabet-bar">
        Display media views beginning with:
        <template v-for="letter in letters">
          <span
            :class="{ selected: selectedLetter == letter }"
            @click="setPage"
            >{{ letter }}</span
          >
        </template>
        <span class="separator">|</span>
        <span @click="setPage" :class="{ selected: selectedLetter == null }"
          >ALL</span
        >
      </div>
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
          data-bs-target="#viewDeleteModal"
          @click="
            mediaViewsToDelete = filteredMediaViews.filter((b) => b.selected)
          "
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>
      <div class="item-list">
        <ul class="list-group">
          <li
            v-for="mediaView in filteredMediaViews"
            :key="mediaView.view_id"
            class="list-group-item"
          >
            <div class="list-group-item-content">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="mediaView.selected"
              />
              <div class="list-group-item-name">
                {{ mediaView.name }}
              </div>
              <div class="list-group-item-buttons">
                <RouterLink
                  :to="`/myprojects/${projectId}/views/${mediaView.view_id}/edit`"
                  @click.stop.prevent="$router.push({ name: 'MyProjectMediaViewEditView', params: { id: projectId, viewId: mediaView.view_id } })"
                >
                  <button type="button" class="btn btn-sm btn-secondary">
                    <i class="fa-regular fa-pen-to-square"></i>
                  </button>
                </RouterLink>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#viewDeleteModal"
                  @click="mediaViewsToDelete = [mediaView]"
                >
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </LoadingIndicator>
  <DeleteDialog
    :mediaViews="mediaViewsToDelete"
    :projectId="projectId"
  ></DeleteDialog>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
