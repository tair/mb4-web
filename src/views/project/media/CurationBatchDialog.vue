<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import { schema } from '@/views/project/media/schema.js'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'

const props = defineProps<{
  batchEdit: (formData: any) => Promise<boolean>
  selectedMedia: any[]
}>()

const route = useRoute()
const projectId = route.params.id

const mediaViewsStore = useMediaViewsStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()

const menuCollapsed = ref({
  mediaEditView: false, // Start expanded for curation
  mediaEditSpecimen: false, // Start expanded for curation
})

// Validation state
const validationErrors = ref<string[]>([])

// Function to validate form data
function validateForm(formData: any) {
  validationErrors.value = []
  
  if (!formData.specimen_id || formData.specimen_id === '0' || formData.specimen_id === 0) {
    validationErrors.value.push('Specimen must be assigned to release media')
  }
  
  if (!formData.view_id || formData.view_id === '0' || formData.view_id === 0) {
    validationErrors.value.push('View must be assigned to release media')
  }
}

// Computed properties for validation
const canRelease = computed(() => {
  return validationErrors.value.length === 0
})

const selectedCount = computed(() => props.selectedMedia.length)

const specimenOptions = computed(() => {
  const options: Record<string, number> = { '- NONE - ': 0 }
  for (const specimen of specimensStore.specimens) {
    const taxon = taxaStore.getTaxonById(specimen.taxon_id)
    const specimenName = `${specimen.specimen_id} - ${taxon ? taxon.scientific_name : 'Unknown Taxon'}`
    options[specimenName] = specimen.specimen_id
  }
  return options
})

const viewOptions = computed(() => {
  const options: Record<string, number> = { '- NONE - ': 0 }
  for (const mediaView of mediaViewsStore.mediaViews) {
    options[mediaView.name] = mediaView.view_id
  }
  return options
})

async function handleSubmitClicked(event: Event) {
  const target = event.currentTarget as any
  const formData = new FormData(target)
  const json = Object.fromEntries(formData)
  
  // Validate form data
  validateForm(json)
  
  if (validationErrors.value.length > 0) {
    return // Don't submit if validation fails
  }
  
  // Add cataloguing_status to release the media
  json.cataloguing_status = '0'
  
  const success = await props.batchEdit(json)
  if (!success) {
    alert('Failed to assign and release media files')
    return
  }

  const element = document.getElementById('curationBatchModal')
  if (!element) {
    return
  }

  const modal = Modal.getInstance(element)
  if (modal) {
    modal.hide()
  }
}

onMounted(() => {
  if (!mediaViewsStore.isLoaded) {
    mediaViewsStore.fetchMediaViews(projectId)
  }
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
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
  
  // Add event listeners to clear validation errors when form values change
  nextTick(() => {
    const form = document.querySelector('#curationBatchModal form')
    if (form) {
      form.addEventListener('change', () => {
        validationErrors.value = []
      })
      form.addEventListener('input', () => {
        validationErrors.value = []
      })
    }
  })
})
</script>
<template>
  <div
    class="modal fade"
    id="curationBatchModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <form @submit.prevent="handleSubmitClicked">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Assign Specimen and View to {{ selectedCount }} Media Items
            </h5>
          </div>
          <div class="modal-body">
            <!-- Validation Errors -->
            <div v-if="validationErrors.length > 0" class="alert alert-warning">
              <strong>Please fix the following issues:</strong>
              <ul class="mb-0 mt-2">
                <li v-for="error in validationErrors" :key="error">{{ error }}</li>
              </ul>
            </div>
            
            <!-- Assignment Status -->
            <div class="alert alert-info">
              <strong>Assignment Status:</strong>
              <ul class="mb-0 mt-2">
                <li>Specimen assigned: {{ selectedCount }} items</li>
                <li>View assigned: {{ selectedCount }} items</li>
                <li>Ready to release: {{ canRelease ? selectedCount : 0 }} items</li>
              </ul>
            </div>

            <div class="accordion" id="accordionCurationBatchModal">
              <!-- View Assignment -->
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#mediaEditView"
                    aria-expanded="true"
                    aria-controls="mediaEditView"
                  >
                    <i class="fa fa-eye me-2"></i>
                    View Assignment (Required for Release)
                  </button>
                </h2>
                <div id="mediaEditView" class="accordion-collapse collapse show">
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
              
              <!-- Specimen Assignment -->
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#mediaEditSpecimen"
                    aria-expanded="true"
                    aria-controls="mediaEditSpecimen"
                  >
                    <i class="fa fa-bone me-2"></i>
                    Specimen Assignment (Required for Release)
                  </button>
                </h2>
                <div id="mediaEditSpecimen" class="accordion-collapse collapse show">
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
            <button 
              type="submit" 
              class="btn btn-success"
              :disabled="!canRelease"
            >
              <i class="fa fa-check me-2"></i>
              Assign & Release {{ selectedCount }} Media Items
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.accordion-button:not(.collapsed) {
  background-color: #e7f3ff;
  color: #0c63e4;
}

.accordion-button:focus {
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
</style> 