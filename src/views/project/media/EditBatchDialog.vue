<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import { schema } from '@/views/project/media/schema.js'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useFoliosStore } from '@/stores/FoliosStore'
import BibliographySearchInput from '@/views/project/common/BibliographySearchInput.vue'

const props = defineProps<{
  batchEdit: (formData: any) => Promise<boolean>
}>()

const route = useRoute()
const projectId = route.params.id

const bibliographiesStore = useBibliographiesStore()
const foliosStore = useFoliosStore()

const menuCollapsed = ref({
  mediaEditCopyright: true,
  mediaEditView: true,
  mediaEditFolio: true,
  mediaEditSide: true,
  mediaEditSpecimen: true,
  mediaEditBibliography: true,
  mediaEditModalPublication: true,
})

async function handleSubmitClicked(event: Event) {
  const target = event.currentTarget as any
  const formData = new FormData(target)
  const json = Object.fromEntries(formData)
  const success = await props.batchEdit(json)
  if (!success) {
    alert('Failed to edit media files')
    return
  }

  const element = document.getElementById('mediaEditModal')
  if (!element) {
    return
  }

  const modal = Modal.getInstance(element)
  if (modal) {
    modal.hide()
  }
}

onMounted(() => {
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
  if (!foliosStore.isLoaded) {
    foliosStore.fetch(projectId)
  }

  const values = menuCollapsed.value as any
  for (const id of Object.keys(values)) {
    const element = document.getElementById(id)
    if (element) {
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
    id="mediaEditModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <form @submit.prevent="handleSubmitClicked">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Applying batch changes to media search results
            </h5>
          </div>
          <div class="modal-body">
            <div class="accordion" id="accordionMediaEditModal">
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#mediaEditCopyright"
                    aria-expanded="false"
                    aria-controls="mediaEditCopyright"
                  >
                    Copyright Information
                  </button>
                </h2>
                <div
                  id="mediaEditCopyright"
                  class="accordion-collapse collapse"
                >
                  <div class="form-group">
                    <label class="form-label">
                      {{ schema.is_copyrighted.label }}
                    </label>
                    <component
                      :is="schema.is_copyrighted.view"
                      :disabled="menuCollapsed['mediaEditCopyright']"
                      name="is_copyrighted"
                    >
                    </component>
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      {{ schema.copyright_permission.label }}
                    </label>
                    <component
                      :is="schema.copyright_permission.view"
                      :disabled="menuCollapsed['mediaEditCopyright']"
                      name="copyright_permission"
                      v-bind="schema.copyright_permission.args"
                    >
                    </component>
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      {{ schema.copyright_license.label }}
                    </label>
                    <component
                      :is="schema.copyright_license.view"
                      :disabled="menuCollapsed['mediaEditCopyright']"
                      name="copyright_license"
                      v-bind="schema.copyright_license.args"
                    >
                    </component>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      {{ schema.copyright_info.label }}
                    </label>
                    <component
                      :is="schema.copyright_info.view"
                      :disabled="menuCollapsed['mediaEditCopyright']"
                      name="copyright_info"
                    ></component>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#mediaEditView"
                    aria-expanded="false"
                    aria-controls="mediaEditView"
                  >
                    View Information
                  </button>
                </h2>
                <div id="mediaEditView" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        {{ schema.view_id.label }}
                      </label>
                      <component
                        :is="schema.view_id.view"
                        :disabled="menuCollapsed['mediaEditView']"
                        name="view_id"
                      >
                      </component>
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
                    data-bs-target="#mediaEditFolio"
                    aria-expanded="false"
                    aria-controls="mediaEditFolio"
                  >
                    Folio Information
                  </button>
                </h2>
                <div id="mediaEditFolio" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label"> Folio </label>
                      <select
                        :disabled="menuCollapsed['mediaEditFolio']"
                        name="folio_id"
                      >
                        <option
                          v-for="folio in foliosStore.folios"
                          :key="folio.folio_id"
                          :value="folio.folio_id"
                        >
                          {{ folio.name }}
                        </option>
                      </select>
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
                    data-bs-target="#mediaEditSide"
                    aria-expanded="false"
                    aria-controls="mediaEditSide"
                  >
                    Side Information
                  </button>
                </h2>
                <div id="mediaEditSide" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        {{ schema.is_sided.label }}
                      </label>
                      <component
                        :is="schema.is_sided.view"
                        :disabled="menuCollapsed['mediaEditSide']"
                        name="is_sided"
                        v-bind="schema.is_sided.args"
                      >
                      </component>
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
                    data-bs-target="#mediaEditSpecimen"
                    aria-expanded="false"
                    aria-controls="mediaEditSpecimen"
                  >
                    Specimen Information
                  </button>
                </h2>
                <div id="mediaEditSpecimen" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        {{ schema.specimen_id.label }}
                      </label>
                      <component
                        :is="schema.specimen_id.view"
                        :disabled="menuCollapsed['mediaEditSpecimen']"
                        name="specimen_id"
                      >
                      </component>
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
                    data-bs-target="#mediaEditBibliography"
                    aria-expanded="false"
                    aria-controls="mediaEditBibliography"
                  >
                    Bibliography Information
                  </button>
                </h2>
                <div
                  id="mediaEditBibliography"
                  class="accordion-collapse collapse"
                >
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        Add a Bibliographic Reference
                      </label>
                      <component
                        :is="BibliographySearchInput"
                        :disabled="menuCollapsed['mediaEditBibliography']"
                        name="reference_id"
                      >
                      </component>
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
                    data-bs-target="#mediaEditModalPublication"
                    aria-expanded="false"
                    aria-controls="mediaEditModalPublication"
                  >
                    Publication Preference
                  </button>
                </h2>
                <div
                  id="mediaEditModalPublication"
                  class="accordion-collapse collapse"
                >
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        {{ schema.published.label }}
                      </label>
                      <component
                        :is="schema.published.view"
                        :disabled="menuCollapsed['mediaEditModalPublication']"
                        name="status"
                        v-bind="schema.published.args"
                      >
                      </component>
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
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
