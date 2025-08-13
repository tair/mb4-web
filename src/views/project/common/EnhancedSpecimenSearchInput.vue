<script setup>
import axios from 'axios'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getSpecimenName } from '@/utils/specimens'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import SearchSelectInput from '@/components/project/SearchSelectInput.vue'
import SpecimenName from '@/components/project/SpecimenName.vue'
import SelectInput from '@/components/project/SelectInput.vue'
import TaxaSearchInput from '@/views/project/common/TaxaSearchInput.vue'
import TextInput from '@/components/project/TextInput.vue'
import TextArea from '@/components/project/TextArea.vue'

defineProps({
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

const emit = defineEmits(['specimenCreated'])

const route = useRoute()
const projectId = route.params.id

const specimenStore = useSpecimensStore()
const taxaStore = useTaxaStore()

const showCreateForm = ref(false)
const isCreating = ref(false)
const createError = ref('')

// Form data for new specimen - using same structure as original
const newSpecimen = ref({
  catalog_number: '',
  institution_code: '',
  collection_code: '',
  occurrence_id: '',
  description: '', // notes field is called 'description' in backend
  reference_source: 0, // Default to "Vouchered"
  taxon_id: null
})

// Track reference source type for conditional field display
const referenceSource = ref(0)

// Fields that should be hidden when "Unvouchered" is selected
const voucheredOnlyFields = [
  'institution_code',
  'collection_code', 
  'catalog_number',
  'occurrence_id',
]

// Function to check if a field should be shown
function shouldShowField(fieldName) {
  if (voucheredOnlyFields.includes(fieldName)) {
    return referenceSource.value === 0 // Only show for "Vouchered"
  }
  return true // Show all other fields
}

// Watch for changes in reference source and clear hidden fields
watch(referenceSource, (newValue) => {
  newSpecimen.value.reference_source = newValue
  if (newValue === 1) {
    // Unvouchered - clear all voucher-only field values
    voucheredOnlyFields.forEach((fieldName) => {
      newSpecimen.value[fieldName] = ''
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

async function createNewSpecimen() {
  // Validate required fields
  if (referenceSource.value === 0 && !newSpecimen.value.catalog_number.trim()) {
    createError.value = 'Catalog number is required for vouchered specimens'
    return
  }

  isCreating.value = true
  createError.value = ''

  try {
    const specimenData = { ...newSpecimen.value }
    
    // Remove hidden field values when "Unvouchered" is selected
    if (referenceSource.value === 1) {
      voucheredOnlyFields.forEach((fieldName) => {
        delete specimenData[fieldName]
      })
    }

    const success = await specimenStore.create(projectId, specimenData)

    if (success) {
      // Reset form
      newSpecimen.value = {
        catalog_number: '',
        institution_code: '',
        collection_code: '',
        occurrence_id: '',
        description: '',
        reference_source: 0,
        taxon_id: null
      }
      referenceSource.value = 0
      showCreateForm.value = false
      emit('specimenCreated')
    } else {
      createError.value = 'Failed to create specimen'
    }
  } catch (error) {
    createError.value = 'An error occurred while creating the specimen'
  } finally {
    isCreating.value = false
  }
}

function cancelCreate() {
  showCreateForm.value = false
  newSpecimen.value = {
    catalog_number: '',
    institution_code: '',
    collection_code: '',
    occurrence_id: '',
    description: '',
    reference_source: 0,
    taxon_id: null
  }
  referenceSource.value = 0
  createError.value = ''
}

const referenceSourceOptions = {
  'Vouchered': 0,
  'Unvouchered': 1,
}
</script>

<template>
  <div>
    <SearchSelectInput
      :name="name"
      :initialValue="value"
      :disabled="disabled"
      :getText="getText"
      :getId="getSpecimenNumber"
      :getItem="getItem"
      :search="searchSpecimen"
    >
      <template #item="specimen">
        <SpecimenName
          :specimen="specimen"
          :taxon="taxaStore.getTaxonById(specimen.taxon_id)"
        />
      </template>
    </SearchSelectInput>
    
    <div class="mt-2">
      <button
        v-if="!showCreateForm"
        type="button"
        class="btn btn-sm btn-outline-secondary"
        @click="showCreateForm = true"
      >
        <i class="fa-solid fa-plus"></i> Create New Specimen
      </button>
      
      <div v-else class="border p-3 rounded mt-2">
        <h6>Create New Specimen</h6>
        
        <div class="mb-2">
          <label class="form-label">Reference Source</label>
          <select
            v-model="referenceSource"
            class="form-control"
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
        
        <div v-if="shouldShowField('institution_code')" class="mb-2">
          <label class="form-label">Institution Code</label>
          <TextInput
            name="institution_code"
            :value="newSpecimen.institution_code"
            @input="newSpecimen.institution_code = $event.target.value"
          />
        </div>
        
        <div v-if="shouldShowField('collection_code')" class="mb-2">
          <label class="form-label">Collection Code</label>
          <TextInput
            name="collection_code"
            :value="newSpecimen.collection_code"
            @input="newSpecimen.collection_code = $event.target.value"
          />
        </div>
        
        <div v-if="shouldShowField('catalog_number')" class="mb-2">
          <label class="form-label">Catalog Number</label>
          <TextInput
            name="catalog_number"
            :value="newSpecimen.catalog_number"
            @input="newSpecimen.catalog_number = $event.target.value"
          />
        </div>
        
        <div v-if="shouldShowField('occurrence_id')" class="mb-2">
          <label class="form-label">Occurrence ID</label>
          <TextInput
            name="occurrence_id"
            :value="newSpecimen.occurrence_id"
            @input="newSpecimen.occurrence_id = $event.target.value"
          />
        </div>
        
        <div class="mb-2">
          <label class="form-label">Taxon</label>
          <TaxaSearchInput
            name="taxon_id"
            :value="newSpecimen.taxon_id"
            @select="newSpecimen.taxon_id = $event ? $event.taxon_id : null"
          />
        </div>
        
        <div class="mb-2">
          <label class="form-label">Notes</label>
          <TextArea
            name="description"
            :value="newSpecimen.description"
            @input="newSpecimen.description = $event.target.value"
          />
        </div>
        
        <div v-if="createError" class="alert alert-danger py-2 mb-2">
          {{ createError }}
        </div>
        
        <div class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-sm btn-primary"
            @click="createNewSpecimen"
            :disabled="isCreating"
          >
            <i v-if="isCreating" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-check"></i>
            {{ isCreating ? 'Creating...' : 'Create' }}
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="cancelCreate"
            :disabled="isCreating"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
