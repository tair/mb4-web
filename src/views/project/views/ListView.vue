<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'

const route = useRoute()
const projectId = route.params.id

const mediaViewsStore = useMediaViewsStore()

const mediaViewsToDelete = ref([])

const allSelected = computed({
  get: function () {
    return mediaViewsStore.filteredMediaViews.every((b) => b.selected)
  },
  set: function (value) {
    mediaViewsStore.filteredMediaViews.forEach((b) => {
      b.selected = value
    })
  },
})
const someSelected = computed(() =>
  mediaViewsStore.filteredMediaViews.some((b) => b.selected)
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
    mediaViewsStore.clearFilters()
  } else {
    mediaViewsStore.filterByLetter(text)
  }
}

async function deleteMediaViews(viewIds) {
  const deleted = mediaViewsStore.deleteIds(projectId, viewIds)
  if (!deleted) {
    alert('Failed to delete views')
  }
}
</script>

<template>
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="!mediaViewsStore.isLoaded"
    :errorMessage="null"
    basePath="myprojects"
    itemName="media_views"
  >
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
          <i class="bi bi-plus-square fa-m"></i>
          <span> Create Media View</span>
        </button>
      </RouterLink>
    </div>
    <div v-if="mediaViewsStore.mediaViews?.length">
      <div class="alphabet-bar">
        Display media views beginning with:
        <template v-for="letter in mediaViewsStore.letters">
          <span
            :class="{ selected: mediaViewsStore.selectedLetter == letter }"
            @click="setPage"
            >{{ letter }}</span
          >
        </template>
        <span class="separator">|</span>
        <span
          @click="setPage"
          :class="{ selected: mediaViewsStore.selectedLetter == null }"
          >ALL</span
        >
      </div>
      <div class="selection-bar">
        <label class="item">
          <input
            type="checkbox"
            class="form-check-input"
            v-model="allSelected"
          />
        </label>
        <span v-if="!someSelected" class="item" @click="refresh">
          <i class="bi bi-arrow-clockwise fa-m"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#viewDeleteModal"
          @click="
            mediaViewsToDelete = mediaViewsStore.filteredMediaViews.filter(
              (b) => b.selected
            )
          "
        >
          <i class="bi bi-trash fa-m"></i>
        </span>
      </div>
      <div class="item-list">
        <ul class="list-group">
          <li
            v-for="mediaView in mediaViewsStore.filteredMediaViews"
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
                >
                  <button type="button" class="btn btn-sm btn-secondary">
                    <i class="bi bi-pencil-square fa-m"></i>
                  </button>
                </RouterLink>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#viewDeleteModal"
                  @click="mediaViewsToDelete = [mediaView]"
                >
                  <i class="bi bi-trash fa-m"></i>
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="modal" id="viewDeleteModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm</h5>
          </div>
          <div class="modal-body" v-if="mediaViewsToDelete.length">
            Really delete media views:
            <p v-for="mediaView in mediaViewsToDelete" :key="mediaView.view_id">
              {{ mediaView.name }}
            </p>
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
              data-bs-dismiss="modal"
              @click="
                deleteMediaViews(mediaViewsToDelete.map((v) => v.view_id))
              "
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </ProjectContainerComp>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
