<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import { useNotifications } from '@/composables/useNotifications'
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
const { showError, showSuccess } = useNotifications()
const isSubmitting = ref(false)

const menuCollapsed = ref({
  mediaEditCopyright: true,
  mediaEditView: true,
  mediaEditFolio: true,
  mediaEditSide: true,
  mediaEditSpecimen: true,
  mediaEditBibliography: true,
  mediaEditModalPublication: true,
})

function validateFormData(formData: FormData) {
  const errors: string[] = []
  
  // Conditional validation for copyright fields
  const copyrightCheckbox = formData.get('is_copyrighted')
  const isCopyrighted = copyrightCheckbox === '1' || copyrightCheckbox === 1
  
  if (isCopyrighted) {
    // Check copyright_permission - must not be the default "not set" option (value 0)
    const copyrightPermission = formData.get('copyright_permission')
    const copyrightPermissionValue = parseInt(String(copyrightPermission), 10)
    
    if (isNaN(copyrightPermissionValue) || copyrightPermissionValue === 0) {
      errors.push('Copyright permission must be selected when media is under copyright (cannot use "Copyright permission not set")')
    }
    
    // Validate that copyright_permission is not contradictory
    // Value 4 = "Copyright expired or work otherwise in public domain"
    if (copyrightPermissionValue === 4) {
      errors.push('Cannot select "Copyright expired or work otherwise in public domain" when media is under copyright')
    }
    
    // Check copyright_license - must not be the default "not set" option (value 0)
    const copyrightLicense = formData.get('copyright_license')
    const copyrightLicenseValue = parseInt(String(copyrightLicense), 10)
    
    if (isNaN(copyrightLicenseValue) || copyrightLicenseValue === 0) {
      errors.push('Media reuse license must be selected when media is under copyright (cannot use "Media reuse policy not set")')
    }
    
    // Validate that copyright_license is not contradictory
    // Value 1 = "CC0 - relinquish copyright"
    if (copyrightLicenseValue === 1) {
      errors.push('Cannot select "CC0 - relinquish copyright" when media is under copyright')
    }
  }
  
  return errors
}

async function handleSubmitClicked(event: Event) {
  if (isSubmitting.value) return // Prevent double submission
  
  isSubmitting.value = true
  
  try {
    const target = event.currentTarget as any
    const formData = new FormData(target)
    
    // FIX: Explicitly set is_copyrighted to 0 if checkbox is unchecked
    if (!formData.has('is_copyrighted')) {
      formData.set('is_copyrighted', '0')
    }
    
    // Validate form data
    const errors = validateFormData(formData)
    if (errors.length > 0) {
      showError(errors.join('; '), 'Validation Error')
      isSubmitting.value = false
      return
    }
    
    const json = Object.fromEntries(formData)
    const success = await props.batchEdit(json)
    if (!success) {
      showError('Failed to edit media files')
      return
    }
    
    showSuccess('Media files updated successfully!')
  } catch (error) {
    console.error('Batch edit error:', error)
    showError('Failed to edit media files')
  } finally {
    isSubmitting.value = false
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
              class="btn btn-outline-primary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting">
                <i class="fa fa-spinner fa-spin me-2"></i>
                Saving...
              </span>
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-label {
  font-weight: bold;
}
</style>
