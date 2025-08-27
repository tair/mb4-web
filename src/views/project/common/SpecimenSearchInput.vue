<script setup>
import axios from 'axios'
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getSpecimenName } from '@/utils/specimens'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import SearchSelectInput from '@/components/project/SearchSelectInput.vue'
import SpecimenName from '@/components/project/SpecimenName.vue'
import TaxaSearchInput from '@/views/project/common/TaxaSearchInput.vue'

const props = defineProps({
  name: {
    type: String,
  },
  value: {
    type: Number,
  },
  disabled: {
    type: Boolean,
  },
})

const emit = defineEmits(['select'])

const route = useRoute()
const projectId = route.params.id

const specimenStore = useSpecimensStore()
const taxaStore = useTaxaStore()

// Inline creation state
const showCreateForm = ref(false)
const isCreating = ref(false)
const createFormData = ref({
  taxon_id: null,
  reference_source: 0,
  institution_code: '',
  collection_code: '',
  catalog_number: '',
  occurrence_id: '',
  description: '',
  access: 0
})

const currentValue = ref(props.value)

// Watch for prop changes
watch(() => props.value, (newValue) => {
  currentValue.value = newValue
})

const referenceSourceOptions = {
  'Vouchered': 0,
  'Unvouchered': 1,
}

const accessOptions = {
  'Anyone in my project may edit this specimen': 0,
  'Only the owner may edit this specimen': 1,
}

const voucheredOnlyFields = ['institution_code', 'collection_code', 'catalog_number', 'occurrence_id']

const shouldShowVoucheredFields = computed(() => {
  return createFormData.value.reference_source === 0
})

// Clear vouchered fields when switching to unvouchered
watch(() => createFormData.value.reference_source, (newValue) => {
  if (newValue === 1) {
    voucheredOnlyFields.forEach(field => {
      createFormData.value[field] = ''
    })
  }
})



function getSpecimenNumber(specimen) {
  return specimen.specimen_id
}

function getText(specimen) {
  if (specimen) {
    const taxon = taxaStore.getTaxonById(specimen.taxon_id)
    return getSpecimenName(specimen, taxon)
  }
  return ''
}

async function searchSpecimen(text) {
  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/specimens/search`
  const response = await axios.post(url, {
    text: text,
  })
  const specimenIds = response.data.results
  return specimenStore.specimens.filter((specimen) =>
    specimenIds.includes(specimen.specimen_id)
  )
}

function getItem(specimenId) {
  return specimenStore.getSpecimenById(specimenId)
}

function handleSpecimenSelect(specimen) {
  currentValue.value = specimen ? specimen.specimen_id : null
  emit('select', specimen)
}

function toggleCreateForm() {
  showCreateForm.value = !showCreateForm.value
  if (!showCreateForm.value) {
    resetCreateForm()
  }
}

function resetCreateForm() {
  createFormData.value = {
    taxon_id: null,
    reference_source: 0,
    institution_code: '',
    collection_code: '',
    catalog_number: '',
    occurrence_id: '',
    description: '',
    access: 0
  }
}

async function createSpecimen() {
  if (!createFormData.value.taxon_id) {
    alert('Please select a taxon')
    return
  }

  isCreating.value = true
  
  try {
    // Prepare data - clean up empty fields
    const dataToSend = { ...createFormData.value }
    
    // Remove empty vouchered fields if unvouchered
    if (dataToSend.reference_source === 1) {
      voucheredOnlyFields.forEach(field => {
        delete dataToSend[field]
      })
    } else {
      // For vouchered specimens, remove empty string fields
      voucheredOnlyFields.forEach(field => {
        if (dataToSend[field] === '') {
          delete dataToSend[field]
        }
      })
    }
    
    // Remove empty description if not provided
    if (dataToSend.description === '') {
      delete dataToSend.description
    }

    const success = await specimenStore.create(projectId, dataToSend)
    
    if (success) {
      // Get the newly created specimen (should be the last one added)
      const specimens = specimenStore.specimens
      if (specimens.length > 0) {
        const newSpecimen = specimens[specimens.length - 1]
        currentValue.value = newSpecimen.specimen_id
        emit('select', newSpecimen)
      }
      
      showCreateForm.value = false
      resetCreateForm()
    } else {
      alert('Failed to create specimen')
    }
  } catch (error) {
    console.error('Error creating specimen:', error)
    alert('Failed to create specimen')
  } finally {
    isCreating.value = false
  }
}

function cancelCreate() {
  showCreateForm.value = false
  resetCreateForm()
}


</script>
<template>
  <div class="specimen-search-with-create">
    <!-- Main search input with add button -->
    <div class="d-flex align-items-center gap-2">
      <div class="flex-grow-1">
        <SearchSelectInput
          :name="name"
          :initial-value="currentValue"
          :disabled="disabled"
          :get-text="getText"
          :get-id="getSpecimenNumber"
          :getItem="getItem"
          :search="searchSpecimen"
          @select="handleSpecimenSelect"
        >
          <template #item="specimen">
            <SpecimenName
              :specimen="specimen"
              :taxon="taxaStore.getTaxonById(specimen.taxon_id)"
            />
          </template>
        </SearchSelectInput>
      </div>
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm"
        @click="toggleCreateForm"
        :disabled="disabled"
      >
        <i class="fa-solid fa-plus"></i>
        {{ showCreateForm ? 'Cancel' : 'New' }}
      </button>
    </div>

    <!-- Inline create form -->
    <div v-if="showCreateForm" class="create-form mt-3 p-3 border rounded bg-light">
      <h6 class="mb-3">Create New Specimen</h6>
      
      <div class="form-group mb-3">
        <label class="form-label">Taxonomic name <span class="text-danger">*</span></label>
        <TaxaSearchInput
          name="create_taxon_id"
          :value="createFormData.taxon_id"
          @select="(taxon) => createFormData.taxon_id = taxon?.taxon_id"
        />
      </div>

      <div class="form-group mb-3">
        <label class="form-label">Type of specimen record</label>
        <select 
          class="form-control"
          v-model="createFormData.reference_source"
        >
          <option 
            v-for="(optionValue, optionLabel) in referenceSourceOptions" 
            :key="optionValue"
            :value="optionValue"
          >
            {{ optionLabel }}
          </option>
        </select>
      </div>

      <!-- Vouchered fields -->
      <template v-if="shouldShowVoucheredFields">
        <div class="form-group mb-3">
          <label class="form-label">Institution code for specimens repository</label>
          <input 
            type="text"
            class="form-control"
            v-model="createFormData.institution_code"
          />
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Collection code for specimens repository</label>
          <input 
            type="text"
            class="form-control"
            v-model="createFormData.collection_code"
          />
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Catalog number</label>
          <input 
            type="text"
            class="form-control"
            v-model="createFormData.catalog_number"
          />
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Occurrence ID</label>
          <input 
            type="text"
            class="form-control"
            v-model="createFormData.occurrence_id"
          />
        </div>
      </template>

      <div class="form-group mb-3">
        <label class="form-label">Notes</label>
        <textarea 
          class="form-control"
          v-model="createFormData.description"
          rows="3"
        ></textarea>
      </div>

      <div class="form-group mb-3">
        <label class="form-label">Access granted to this specimen</label>
        <select 
          class="form-control"
          v-model="createFormData.access"
        >
          <option 
            v-for="(optionValue, optionLabel) in accessOptions" 
            :key="optionValue"
            :value="optionValue"
          >
            {{ optionLabel }}
          </option>
        </select>
      </div>

      <div class="d-flex gap-2">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          @click="createSpecimen"
          :disabled="isCreating || !createFormData.taxon_id"
        >
          <i v-if="isCreating" class="fa-solid fa-spinner fa-spin me-1"></i>
          {{ isCreating ? 'Creating...' : 'Create Specimen' }}
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-sm"
          @click="cancelCreate"
          :disabled="isCreating"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.specimen-search-with-create {
  position: relative;
}

.create-form {
  border: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.text-danger {
  color: #dc3545 !important;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}
</style>
