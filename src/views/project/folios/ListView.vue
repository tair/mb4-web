<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useFoliosStore } from '@/stores/FoliosStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import DeleteDialog from '@/views/project/folios/DeleteDialog.vue'

const route = useRoute()
const projectId = parseInt(route.params.id as string)

const foliosStore = useFoliosStore()
const folios = computed(() =>
  foliosStore.folios.sort((a, b) => {
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

const foliosToDelete = ref([])

const allSelected = computed({
  get: function () {
    return folios.value.every((b) => b.selected)
  },
  set: function (value) {
    folios.value.forEach((b) => {
      b.selected = value
    })
  },
})
const someSelected = computed(() => folios.value.some((b) => b.selected))

onMounted(() => {
  if (!foliosStore.isLoaded) {
    foliosStore.fetch(projectId)
  }
})

function refresh() {
  foliosStore.fetch(projectId)
}
</script>
<template>
  <LoadingIndicator :isLoaded="foliosStore.isLoaded">
    <header>
      There are {{ folios?.length }} folios associated with this project.
    </header>
    <br />

    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/folios/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Create Folio</span>
        </button>
      </RouterLink>
    </div>
    <div v-if="folios?.length">
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
          data-bs-target="#folioDeleteModal"
          @click="foliosToDelete = folios.filter((b) => b.selected)"
        >
          <i class="fa-regular fa-trash-can"></i>
        </span>
      </div>
      <div class="item-list">
        <ul class="list-group">
          <li
            v-for="folio in folios"
            :key="folio.folio_id"
            class="list-group-item"
          >
            <div class="list-group-item-content">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="folio.selected"
              />
              <div class="list-group-item-name">
                {{ folio.name }}
              </div>
              <div class="list-group-item-buttons">
                <RouterLink
                  :to="`/myprojects/${projectId}/folios/${folio.folio_id}/edit`"
                >
                  <button type="button" class="btn btn-sm btn-secondary">
                    <i class="fa-regular fa-pen-to-square"></i>
                  </button>
                </RouterLink>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#folioDeleteModal"
                  @click="foliosToDelete = [folio]"
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
  <DeleteDialog :folios="foliosToDelete" :projectId="projectId"></DeleteDialog>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
