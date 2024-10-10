<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Collapse, Modal } from 'bootstrap'
import { schema } from '@/views/project/media/schema.js'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useFoliosStore } from '@/stores/FoliosStore'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { TaxaColumns, getTaxonName } from '@/utils/taxa'
import TaxonomicName from '@/components/project/TaxonomicName.vue'
import {
  applyFilter,
  MediaFilter,
  otherFiltersOptions,
} from '@/views/project/media/filter'

const props = defineProps<{
  setFilter: (key: string, value: (media: any) => boolean) => void
  clearFilter: (key: string) => void
}>()

const route = useRoute()
const projectId = parseInt(route.params.id as string)

const serializedfilterName = `mediaFilter[${projectId}]`

const bibliographiesStore = useBibliographiesStore()
const foliosStore = useFoliosStore()
const mediaStore = useMediaStore()
const mediaViewsStore = useMediaViewsStore()
const projectUsersStore = useProjectUsersStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()

const specimens = computed(() =>
  specimensStore.getSpecimensByIds(
    new Set(
      mediaStore.media.map((m: any) => m.specimen_id).filter((x: any) => !!x)
    )
  )
)
const views = computed(() =>
  mediaViewsStore.getMediaViewByIds(
    new Set(mediaStore.media.map((m: any) => m.view_id).filter((x: any) => !!x))
  )
)
const submitters = computed(() =>
  projectUsersStore
    .getUserByIds(
      new Set(
        mediaStore.media.map((m: any) => m.user_id).filter((x: any) => !!x)
      )
    )
    .sort((a, b) => {
      const fnameA = a?.fname ?? ''
      const fnameB = b?.fname ?? ''
      let compare = fnameA.localeCompare(fnameB)
      if (compare) {
        return compare
      }

      const lnameA = a?.lname ?? ''
      const lnameB = b?.lname ?? ''
      compare = lnameA.localeCompare(lnameB)
      return compare
    })
)
const licenses = computed(
  () =>
    new Set(
      mediaStore.media
        .map((m: any) => m.copyright_license)
        .filter((x: any) => !!x)
    )
)

const permissions = computed(
  () =>
    new Set(
      mediaStore.media
        .map((m: any) => m.copyright_permission)
        .filter((x: any) => !!x)
    )
)

const repositories = computed(
  () =>
    new Set(
      specimens.value
        .map((s) => s.institution_code)
        .filter((x) => !!x)
        .sort()
    )
)
const taxa = computed(() =>
  taxaStore
    .getTaxaByIds(new Set(specimens.value.map((s) => s.taxon_id)))
    .sort((a, b) => {
      const nameA = getTaxonName(a, TaxaColumns.GENUS, false)
      if (!nameA) {
        return -1
      }

      const nameB = getTaxonName(b, TaxaColumns.GENUS, false)
      if (!nameB) {
        return -1
      }

      return nameA.localeCompare(nameB)
    })
)

const menuCollapsed = ref({
  filterTaxa: true,
  filterView: true,
  filterSubmitter: true,
  filterCopyrightLicense: true,
  filterCopyrightPermission: true,
  filterSpecimenRepository: true,
  filterStatus: true,
  filterOther: true,
})

const filter: MediaFilter = getFilter()
function getFilter(): MediaFilter {
  const existingFilter = sessionStorage.getItem(serializedfilterName)
  if (existingFilter) {
    return JSON.parse(existingFilter)
  }

  return {
    filterTaxa: [],
    filterView: [],
    filterSubmitter: [],
    filterCopyrightLicense: [],
    filterCopyrightPermission: [],
    filterSpecimenRepository: [],
    filterStatus: [],
    filterOther: {},
  }
}

async function handleSubmitClicked(event: Event) {
  const target = event.currentTarget as any
  const formData = new FormData(target)

  // Reset Filter since all the vales are defined in the checkboxes.
  filter.filterTaxa = []
  filter.filterView = []
  filter.filterSubmitter = []
  filter.filterCopyrightLicense = []
  filter.filterCopyrightPermission = []
  filter.filterSpecimenRepository = []
  filter.filterStatus = []
  filter.filterOther = {}

  // Set the filters with the new values.
  for (const [key, value] of formData.entries()) {
    switch (key) {
      case 'filterTaxa':
        filter.filterTaxa.push(parseInt(value as string))
        break
      case 'filterView':
        filter.filterView.push(parseInt(value as string))
        break
      case 'filterSubmitter':
        filter.filterSubmitter.push(parseInt(value as string))
        break
      case 'filterCopyrightLicense':
        filter.filterCopyrightLicense.push(parseInt(value as string))
        break
      case 'filterCopyrightPermission':
        filter.filterCopyrightPermission.push(parseInt(value as string))
        break
      case 'filterSpecimenRepository':
        filter.filterSpecimenRepository.push(value.toString())
        break
      case 'filterStatus':
        filter.filterStatus.push(parseInt(value as string))
        break
      // Other Filters
      default:
        if (key.startsWith('filterOther')) {
          const otherFilterKey = key.substring(12)
          filter.filterOther[otherFilterKey] = true
        }
        break
    }
  }

  // Persist the filter so that it remains across pages and refreshes.
  sessionStorage.setItem(serializedfilterName, JSON.stringify(filter))

  applyFilter(projectId, filter, props.setFilter, props.clearFilter)

  const element = document.getElementById('mediaFilterModal')
  if (!element) {
    return
  }

  const modal = Modal.getInstance(element)
  if (modal) {
    modal.hide()
  }
}

function setCheckboxes(id: string, value: boolean) {
  const element = document.getElementById(id)
  const checkboxes = element.querySelectorAll<HTMLInputElement>(
    'input[type=checkbox]'
  )
  for (const checkbox of checkboxes) {
    checkbox.checked = value
  }
  return false
}

function hasFilter(filter: any, key: string) {
  return filter[key].length > 0 || Object.keys(filter[key]).length > 0
}

onMounted(() => {
  applyFilter(projectId, filter, props.setFilter, props.clearFilter)

  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
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
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }

  const values = menuCollapsed.value as any
  for (const id of Object.keys(values)) {
    const element = document.getElementById(id)
    if (element) {
      if (hasFilter(filter, id)) {
        const collapse = Collapse.getOrCreateInstance('#' + id)
        collapse.show()
      }

      const listener = () => {
        values[id] = !element.classList.contains('show')
      }

      element.addEventListener('shown.bs.collapse', listener)
      element.addEventListener('hidden.bs.collapse', listener)
    }
  }
})
</script>
<template>
  <div
    class="modal fade"
    id="mediaFilterModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <form @submit.prevent="handleSubmitClicked">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Applying batch changes to media search results
            </h5>
          </div>
          <div class="modal-body">
            <div class="accordion" id="accordionmediaFilterModal">
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#filterTaxa"
                    aria-expanded="false"
                    aria-controls="filterTaxa"
                  >
                    Filter by Taxa
                  </button>
                </h2>
                <div id="filterTaxa" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div v-if="taxa.length > 0">
                      <div class="selection-section">
                        <span @click="setCheckboxes('filterTaxa', false)"
                          >Clear All</span
                        >
                        <span @click="setCheckboxes('filterTaxa', true)"
                          >Select All</span
                        >
                      </div>
                      <div class="checkbox-group">
                        <label v-for="taxon in taxa" :key="taxon.taxon_id">
                          <input
                            type="checkbox"
                            name="filterTaxa"
                            :value="taxon.taxon_id"
                            :disabled="menuCollapsed['filterTaxa']"
                            :checked="
                              filter.filterTaxa.includes(taxon.taxon_id)
                            "
                          />
                          <TaxonomicName
                            :showExtinctMarker="true"
                            :taxon="taxon"
                          />
                        </label>
                      </div>
                    </div>
                    <div v-else>No taxa are defined</div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#filterView"
                    aria-expanded="false"
                    aria-controls="filterView"
                  >
                    Filter by View
                  </button>
                </h2>
                <div id="filterView" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div v-if="views.length > 0">
                      <div class="selection-section">
                        <span @click="setCheckboxes('filterView', false)"
                          >Clear All</span
                        >
                        <span @click="setCheckboxes('filterView', true)"
                          >Select All</span
                        >
                      </div>
                      <div class="checkbox-group">
                        <label v-for="view in views" :key="view.view_id">
                          <input
                            type="checkbox"
                            name="filterView"
                            :value="view.view_id"
                            :disabled="menuCollapsed['filterView']"
                            :checked="filter.filterView.includes(view.view_id)"
                          />
                          {{ view.name }}
                        </label>
                      </div>
                    </div>
                    <div v-else>No Views defined.</div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#filterSubmitter"
                    aria-expanded="false"
                    aria-controls="filterSubmitter"
                  >
                    Filter by Submitter
                  </button>
                </h2>
                <div id="filterSubmitter" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div v-if="submitters.length">
                      <div class="selection-section">
                        <span @click="setCheckboxes('filterSubmitter', false)"
                          >Clear All</span
                        >
                        <span @click="setCheckboxes('filterSubmitter', true)"
                          >Select All</span
                        >
                      </div>
                      <div class="checkbox-group">
                        <label v-for="user in submitters" :key="user.user_id">
                          <input
                            type="checkbox"
                            name="filterSubmitter"
                            :value="user.user_id"
                            :disabled="menuCollapsed['filterSubmitter']"
                            :checked="
                              filter.filterSubmitter.includes(user.user_id)
                            "
                          />
                          {{ user.fname }} {{ user.lname }}
                        </label>
                      </div>
                    </div>
                    <div v-else>No media defined</div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#filterCopyrightLicense"
                    aria-expanded="false"
                    aria-controls="filterCopyrightLicense"
                  >
                    Filter by Copyright License
                  </button>
                </h2>
                <div
                  id="filterCopyrightLicense"
                  class="accordion-collapse collapse"
                >
                  <div class="accordion-body">
                    <div class="selection-section">
                      <span
                        @click="setCheckboxes('filterCopyrightLicense', false)"
                        >Clear All</span
                      >
                      <span
                        @click="setCheckboxes('filterCopyrightLicense', true)"
                        >Select All</span
                      >
                    </div>
                    <div class="checkbox-group">
                      <template
                        v-for="(value, key) in schema.copyright_license.args
                          .options"
                        :key="value"
                      >
                        <label v-if="licenses.has(value)">
                          <input
                            type="checkbox"
                            name="filterCopyrightLicense"
                            :value="value"
                            :disabled="menuCollapsed['filterCopyrightLicense']"
                            :checked="
                              filter.filterCopyrightLicense.includes(value)
                            "
                          />
                          {{ key }}
                        </label>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#filterCopyrightPermission"
                    aria-expanded="false"
                    aria-controls="filterCopyrightPermission"
                  >
                    Filter by Copyright Permission
                  </button>
                </h2>
                <div
                  id="filterCopyrightPermission"
                  class="accordion-collapse collapse"
                >
                  <div class="accordion-body">
                    <div class="selection-section">
                      <span
                        @click="
                          setCheckboxes('filterCopyrightPermission', false)
                        "
                      >
                        Clear All
                      </span>
                      <span
                        @click="
                          setCheckboxes('filterCopyrightPermission', true)
                        "
                      >
                        Select All
                      </span>
                    </div>
                    <div class="checkbox-group">
                      <template
                        v-for="(value, key) in schema.copyright_permission.args
                          .options"
                        :key="value"
                      >
                        <label v-if="permissions.has(value)">
                          <input
                            type="checkbox"
                            name="filterCopyrightPermission"
                            :value="value"
                            :disabled="
                              menuCollapsed['filterCopyrightPermission']
                            "
                            :checked="
                              filter.filterCopyrightPermission.includes(value)
                            "
                          />
                          {{ key }}
                        </label>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#filterSpecimenRepository"
                    aria-expanded="false"
                    aria-controls="filterSpecimenRepository"
                  >
                    Filter by Repository
                  </button>
                </h2>
                <div
                  id="filterSpecimenRepository"
                  class="accordion-collapse collapse"
                >
                  <div class="accordion-body">
                    <div v-if="repositories.size > 0">
                      <div class="selection-section">
                        <span
                          @click="
                            setCheckboxes('filterSpecimenRepository', false)
                          "
                        >
                          Clear All
                        </span>
                        <span
                          @click="
                            setCheckboxes('filterSpecimenRepository', true)
                          "
                        >
                          Select All
                        </span>
                      </div>
                      <div class="checkbox-group">
                        <label
                          v-for="repository in repositories"
                          :key="repository"
                        >
                          <input
                            type="checkbox"
                            name="filterSpecimenRepository"
                            :value="repository"
                            :disabled="
                              menuCollapsed['filterSpecimenRepository']
                            "
                            :checked="
                              filter.filterSpecimenRepository.includes(
                                repository
                              )
                            "
                          />
                          {{ repository }}
                        </label>
                      </div>
                    </div>
                    <div v-else>No repositories defined.</div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#filterStatus"
                    aria-expanded="false"
                    aria-controls="filterStatus"
                  >
                    Filter by Status
                  </button>
                </h2>
                <div id="filterStatus" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="selection-section">
                      <span @click="setCheckboxes('filterStatus', false)"
                        >Clear All</span
                      >
                      <span @click="setCheckboxes('filterStatus', true)"
                        >Select All</span
                      >
                    </div>
                    <div class="checkbox-group">
                      <label
                        v-for="(value, key) in schema.published.args.options"
                        :key="value"
                      >
                        <input
                          type="checkbox"
                          name="filterStatus"
                          :value="value"
                          :disabled="menuCollapsed['filterStatus']"
                          :checked="filter.filterStatus.includes(value)"
                        />
                        {{ key }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#filterOther"
                    aria-expanded="false"
                    aria-controls="filterOther"
                  >
                    Other Filters
                  </button>
                </h2>
                <div id="filterOther" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="selection-section">
                      <span @click="setCheckboxes('filterOther', false)"
                        >Clear All</span
                      >
                      <span @click="setCheckboxes('filterOther', true)"
                        >Select All</span
                      >
                    </div>
                    <div class="checkbox-group">
                      <template v-for="(args, key) in otherFiltersOptions">
                        <label>
                          <input
                            type="checkbox"
                            :name="`filterOther_${key}`"
                            value="1"
                            :disabled="menuCollapsed['filterOther']"
                            :checked="filter.filterOther[key]"
                          />
                          {{ args.label }}
                        </label>
                      </template>
                    </div>
                  </div>
                </div>
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
              @click="setCheckboxes('mediaFilterModal', false)"
            >
              Clear All
            </button>
            <button type="submit" class="btn btn-primary">Filter</button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
<style scoped>
.checkbox-group {
  display: flex;
  flex: 0 0 100%;
  flex-direction: column;
  gap: 8px;
}
.selection-section {
  display: flex;
  flex-grow: 1;
  flex-direction: row-reverse;
}

.selection-section span {
  color: #ef782f;
  text-decoration: underline;
  padding: 0 5px;
}

.selection-section span:hover {
  color: #6c757d;
  cursor: pointer;
}

.selection-section > span + span {
  border-right: 1px solid #6c757d;
}
</style>
