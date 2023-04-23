<script setup>
import { useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import BibliographyItem from '@/components/project/BibliographyItem.vue'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { bottom } from '@popperjs/core'

const route = useRoute()
const projectId = route.params.id

const bibliographiesStore = useBibliographiesStore()
const allSelected = computed({
  get: function () {
    return bibliographiesStore.filtered_bibliographies.every((b) => b.selected)
  },
  set: function (value) {
    bibliographiesStore.filtered_bibliographies.forEach((b) => {
      b.selected = value
    })
  },
})
const someSelected = computed(() =>
  bibliographiesStore.filtered_bibliographies.some((b) => b.selected)
)

onMounted(() => {
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
})

function refresh() {
  bibliographiesStore.fetchBibliographies(projectId)
}
</script>

<template>
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="!bibliographiesStore.isLoaded"
    :errorMessage="null"
    basePath="myprojects"
    itemName="bibliography"
  >
    <header>
      There are {{ bibliographiesStore.bibliographies?.length }} bibliographic
      references associated with this project.
    </header>
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/bibliography/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="bi bi-plus-square fa-m"></i>
          <span> Create Bibliography</span>
        </button>
      </RouterLink>
      <RouterLink :to="`/myprojects/${projectId}/documents/folders/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="bi bi-plus-square fa-m"></i>
          <span> Import File</span>
        </button>
      </RouterLink>
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-m btn-outline-primary dropdown-toggle"
          data-bs-toggle="dropdown"
        >
          <i class="bi bi-download fa-m"></i>
          <span> Export </span>
        </button>
        <div class="dropdown-menu">
          <button
            type="button"
            class="dropdown-item"
            data-bs-toggle="modal"
            data-bs-target="#copyrightModal"
          >
            Endnote tab-delimited File
          </button>
        </div>
      </div>
    </div>
    <div v-if="bibliographiesStore.bibliographies?.length">
      <div class="alphabet-bar">
        Display bibliographic references beginning with:
        <span v-for="letter in bibliographiesStore.letters">
          {{ letter }}
        </span>
        <span>&nbsp;|&nbsp;</span>
        <span>ALL</span>
      </div>
    </div>
    <div class="selection-bar">
      <label class="item" v-tooltip:bottom="'Select'">
        <input type="checkbox" class="form-check-input" v-model="allSelected" />
      </label>
      <span class="item" v-tooltip:bottom="'Refresh'" @click="refresh">
        <i class="bi bi-arrow-clockwise fa-m"></i>
      </span>
      <span v-if="someSelected" class="item" v-tooltip:bottom="'Edit'">
        <i class="bi bi-pencil-square fa-m"></i>
      </span>
      <span v-if="someSelected" class="item" v-tooltip:bottom="'Delete'">
        <i class="bi bi-trash fa-m"></i>
      </span>
    </div>
    <div class="item-list">
      <ul class="list-group">
        <li
          v-for="bibliography in bibliographiesStore.filtered_bibliographies"
          :key="bibliography.reference_id"
          class="list-group-item"
        >
          <div class="list-group-item-content">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="bibliography.selected"
            />
            <div class="list-group-item-name">
              <BibliographyItem :bibliography="bibliography" />
            </div>
            <div class="list-group-item-buttons">
              <RouterLink
                :to="`/myprojects/${projectId}/biblgraphy/${bibliography.reference_id}/edit`"
              >
                <button type="button" class="btn btn-sm btn-secondary">
                  <i class="bi bi-pencil-square fa-m"></i>
                </button>
              </RouterLink>
              <button type="button" class="btn btn-sm btn-secondary">
                <i class="bi bi-trash fa-m"></i>
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </ProjectContainerComp>
</template>
<style scoped>
@import 'styles.css';
</style>
