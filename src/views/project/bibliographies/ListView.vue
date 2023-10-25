<script setup>
import { useRoute } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import BibliographyItem from '@/components/project/BibliographyItem.vue'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'

const route = useRoute()
const projectId = route.params.id

const bibliographiesToDelete = ref([])

const bibliographiesStore = useBibliographiesStore()
const allSelected = computed({
  get: function () {
    return bibliographiesStore.filteredBibliographies.every((b) => b.selected)
  },
  set: function (value) {
    bibliographiesStore.filteredBibliographies.forEach((b) => {
      b.selected = value
    })
  },
})
const someSelected = computed(() =>
  bibliographiesStore.filteredBibliographies.some((b) => b.selected)
)

onMounted(() => {
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
})

function refresh() {
  bibliographiesStore.fetchBibliographies(projectId)
}

function setPage(event) {
  const text = event.target.textContent
  if (text == 'ALL') {
    bibliographiesStore.clearFilters()
  } else {
    bibliographiesStore.filterByLetter(text)
  }
}

async function deleteBibliographies(referenceIds) {
  const deleted = bibliographiesStore.deleteIds(projectId, referenceIds)
  if (!deleted) {
    alert('Failed to delete bibliographies')
  }
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
      <RouterLink :to="`/myprojects/${projectId}/bibliography/upload`">
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
          <button type="button" class="dropdown-item">
            Endnote tab-delimited File
          </button>
        </div>
      </div>
    </div>
    <div v-if="bibliographiesStore.bibliographies?.length">
      <div class="alphabet-bar">
        Display bibliographic references beginning with:
        <template v-for="letter in bibliographiesStore.letters">
          <span
            :class="{ selected: bibliographiesStore.selectedLetter == letter }"
            @click="setPage"
            >{{ letter }}</span
          >
        </template>
        <span class="separator">|</span>
        <span
          @click="setPage"
          :class="{ selected: bibliographiesStore.selectedLetter == null }"
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
        <span v-if="someSelected" class="item">
          <i class="bi bi-pencil-square fa-m"></i>
        </span>
        <span
          v-if="someSelected"
          class="item"
          data-bs-toggle="modal"
          data-bs-target="#bibliographyDeleteModal"
          @click="
            bibliographiesToDelete =
              bibliographiesStore.filteredBibliographies.filter(
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
            v-for="bibliography in bibliographiesStore.filteredBibliographies"
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
                  :to="`/myprojects/${projectId}/bibliography/${bibliography.reference_id}/edit`"
                >
                  <button type="button" class="btn btn-sm btn-secondary">
                    <i class="bi bi-pencil-square fa-m"></i>
                  </button>
                </RouterLink>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  data-bs-toggle="modal"
                  data-bs-target="#bibliographyDeleteModal"
                  @click="bibliographiesToDelete = [bibliography]"
                >
                  <i class="bi bi-trash fa-m"></i>
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="modal" id="bibliographyDeleteModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm</h5>
          </div>
          <div class="modal-body" v-if="bibliographiesToDelete.length">
            Really delete Biliographies:
            <p
              v-for="bibliography in bibliographiesToDelete"
              :key="bibliography.reference_id"
            >
              <BibliographyItem :bibliography="bibliography" />
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
                deleteBibliographies(
                  bibliographiesToDelete.map((b) => b.reference_id)
                )
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
@import '../styles.css';
</style>
