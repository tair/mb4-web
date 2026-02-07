<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import { useNotifications } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/AuthStore'
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
const authStore = useAuthStore()
const { showError, showSuccess } = useNotifications()
const isSubmitting = ref(false)

// Reactive copyright state for UI behaviors
const isCopyrighted = ref(false)
const copyrightPermission = ref(0)
const copyrightLicense = ref(0)
const copyrightInfo = ref('')

// Computed: Show license field (hide when permission=4 - expired/public domain)
const showLicenseField = computed(() => {
  return copyrightPermission.value !== 4
})

// Watch permission changes to auto-fill copyright holder
watch(copyrightPermission, (newVal) => {
  // Auto-fill copyright holder when user owns copyright (permission=1)
  if (newVal === 1 && authStore.user?.name) {
    copyrightInfo.value = authStore.user.name
  }
})

const menuCollapsed = ref({
  mediaEditCopyright: true,
  mediaEditView: true,
  mediaEditFolio: true,
  mediaEditSide: true,
  mediaEditSpecimen: true,
  mediaEditBibliography: true,
  mediaEditModalPublication: true,
})

function validateFormData() {
  const errors: string[] = []
  
  if (isCopyrighted.value) {
    const permValue = copyrightPermission.value
    const licValue = copyrightLicense.value
    
    // Permission must be set
    if (permValue === 0) {
      errors.push('Copyright permission must be selected when media is under copyright')
    }
    
    // Permission 4 (expired) is contradictory when copyright is checked
    if (permValue === 4) {
      errors.push('Cannot select "Copyright expired or work otherwise in public domain" when media is under copyright')
    }
    
    // License must be set (unless permission is 4 where it's hidden)
    if (showLicenseField.value && licValue === 0) {
      errors.push('Media reuse license must be selected when media is under copyright')
    }
    
    // CC0 is contradictory when copyright is checked
    if (licValue === 1) {
      errors.push('Cannot select "CC0 - relinquish copyright" when media is under copyright')
    }
    
    // Copyright holder required for permissions 2, 3, 5
    if ([2, 3, 5].includes(permValue) && !copyrightInfo.value?.trim()) {
      errors.push('Copyright holder must be entered for this permission type')
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
    
    // Only include fields from expanded accordions to avoid overwriting unrelated fields
    const json: Record<string, any> = {}
    
    // Helper to check if accordion is expanded
    const isExpanded = (id: string) => {
      const element = document.getElementById(id)
      return element?.classList.contains('show')
    }
    
    // Copyright fields - only include if accordion is expanded
    if (isExpanded('mediaEditCopyright')) {
      // Use reactive state values
      json.is_copyrighted = isCopyrighted.value ? '1' : '0'
      json.copyright_permission = copyrightPermission.value
      json.copyright_license = copyrightLicense.value
      if (copyrightInfo.value) {
        json.copyright_info = copyrightInfo.value
      }
    }
    
    // View fields - only include if accordion is expanded
    if (isExpanded('mediaEditView')) {
      if (formData.has('view_id')) {
        json.view_id = formData.get('view_id')
      }
    }
    
    // Folio fields - only include if accordion is expanded
    if (isExpanded('mediaEditFolio')) {
      if (formData.has('folio_id')) {
        json.folio_id = formData.get('folio_id')
      }
    }
    
    // Side fields - only include if accordion is expanded
    if (isExpanded('mediaEditSide')) {
      if (formData.has('is_sided')) {
        json.is_sided = formData.get('is_sided')
      }
    }
    
    // Specimen fields - only include if accordion is expanded
    if (isExpanded('mediaEditSpecimen')) {
      if (formData.has('specimen_id')) {
        json.specimen_id = formData.get('specimen_id')
      }
    }
    
    // Bibliography fields - only include if accordion is expanded
    if (isExpanded('mediaEditBibliography')) {
      if (formData.has('reference_id')) {
        json.reference_id = formData.get('reference_id')
      }
    }
    
    // Publication fields - only include if accordion is expanded
    if (isExpanded('mediaEditModalPublication')) {
      if (formData.has('published')) {
        json.published = formData.get('published')
      }
    }
    
    // Validate copyright form data only if copyright accordion is expanded
    if (isExpanded('mediaEditCopyright')) {
      const errors = validateFormData()
      if (errors.length > 0) {
        showError(errors.join('; '), 'Validation Error')
        isSubmitting.value = false
        return
      }
    }
    
    // Validate form data (no copyright validation needed here anymore)
    const errors: string[] = []
    if (errors.length > 0) {
      showError(errors.join('; '), 'Validation Error')
      isSubmitting.value = false
      return
    }
    
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
    data-bs-keyboard="true"
    tabindex="-1"
  >
    <form @submit.prevent="handleSubmitClicked">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Applying batch changes to media search results
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
                  <div class="accordion-body">
                    <!-- Is Copyrighted Checkbox -->
                    <div class="form-group mb-3">
                      <label class="form-label">Is under copyright?</label>
                      <div class="form-check">
                        <input
                          type="checkbox"
                          class="form-check-input"
                          name="is_copyrighted"
                          :value="1"
                          v-model="isCopyrighted"
                        />
                        <small class="text-muted">
                          Leave unchecked to release media to public domain (CC0).
                        </small>
                      </div>
                    </div>

                    <!-- Copyright fields (shown when copyrighted) -->
                    <div v-if="isCopyrighted" class="copyright-details">
                      <!-- Copyright Permission -->
                      <div class="form-group mb-3">
                        <label class="form-label">Copyright permission</label>
                        <select
                          class="form-select"
                          name="copyright_permission"
                          v-model.number="copyrightPermission"
                        >
                          <option :value="0">Copyright permission not set</option>
                          <option :value="1">Person loading media owns copyright and grants permission for use of media on MorphoBank</option>
                          <option :value="2">Permission to use media on MorphoBank granted by copyright holder</option>
                          <option :value="3">Permission pending</option>
                          <option :value="4">Copyright expired or work otherwise in public domain</option>
                          <option :value="5">Copyright permission not yet requested</option>
                        </select>
                      </div>

                      <!-- Copyright License (hidden when permission=4) -->
                      <div v-if="showLicenseField" class="form-group mb-3">
                        <label class="form-label">Media reuse license</label>
                        <select
                          class="form-select"
                          name="copyright_license"
                          v-model.number="copyrightLicense"
                        >
                          <option :value="0">Media reuse policy not set</option>
                          <option :value="1">CC0 - relinquish copyright</option>
                          <option :value="2">Attribution CC BY - reuse with attribution</option>
                          <option :value="3">Attribution-NonCommercial CC BY-NC - reuse but noncommercial</option>
                          <option :value="4">Attribution-ShareAlike CC BY-SA - reuse here and applied to future uses</option>
                          <option :value="5">Attribution- CC BY-NC-SA - reuse here and applied to future uses but noncommercial</option>
                          <option :value="6">Attribution-NoDerivs CC BY-ND - reuse but no changes</option>
                          <option :value="7">Attribution-NonCommercial-NoDerivs CC BY-NC-ND - reuse noncommerical no changes</option>
                          <option :value="8">Media released for onetime use, no reuse without permission</option>
                          <option :value="20">Unknown - Will set before project publication</option>
                        </select>
                      </div>

                      <!-- Copyright Holder -->
                      <div class="form-group mb-3">
                        <label class="form-label">
                          Copyright holder
                          <span v-if="[2, 3, 5].includes(copyrightPermission)" class="text-danger">*</span>
                        </label>
                        <textarea
                          class="form-control"
                          name="copyright_info"
                          rows="2"
                          v-model="copyrightInfo"
                          placeholder="Enter the name of the copyright holder"
                        ></textarea>
                        <small v-if="copyrightPermission === 1" class="text-muted">
                          <i class="fa-solid fa-check-circle text-success me-1"></i>
                          Auto-filled with your name since you own the copyright.
                        </small>
                      </div>
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
                        name="published"
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

.copyright-details {
  padding-left: 0.5rem;
  border-left: 3px solid #dee2e6;
  margin-top: 0.5rem;
}
</style>
