<script setup>
import axios from 'axios'
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatricesStore } from '@/stores/MatricesStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import {
  getTaxonomicUnitOptions,
  getTaxonName,
  sortTaxaAlphabetically,
} from '@/utils/taxa'
import router from '@/router'

const route = useRoute()
const router_instance = useRouter()
const matricesStore = useMatricesStore()
const taxaStore = useTaxaStore()

const projectId = route.params.id

// Taxonomic unit options for dropdown
const taxonomicUnits = getTaxonomicUnitOptions()

// Form data
const formData = reactive({
  title: '',
  notes: '',
  otu: 'genus',
  published: 0,
})

// Loading and error states
const isCreating = ref(false)
const createError = ref(null)
const errors = ref({})

// Check if project has taxa
const hasTaxa = ref(false)
const taxaCount = ref(0)
const firstTaxonName = ref('')

function validateForm() {
  errors.value = {}

  if (!formData.title.trim()) {
    errors.value.title = 'Matrix title is required'
  }

  if (!hasTaxa.value) {
    errors.value.general =
      'Cannot create matrix: This project has no taxa. Please add taxa to the project first.'
    return false
  }

  return Object.keys(errors.value).length === 0
}

async function createMatrix() {
  if (!validateForm()) {
    return
  }

  isCreating.value = true
  createError.value = null
  errors.value = {}

  try {
    const url = `${
      import.meta.env.VITE_API_URL
    }/projects/${projectId}/matrices/create`

    const response = await axios.post(url, {
      title: formData.title,
      notes: formData.notes,
      otu: formData.otu,
      published: formData.published,
    })

    if (response.status === 200) {
      // Clear matrices store to refresh data
      await matricesStore.invalidate()

      // Navigate to matrices list
      window.location.href = `/myprojects/${projectId}/matrices`
    }
  } catch (error) {
    console.error('Error creating manual matrix:', error)
    createError.value =
      error.response?.data?.message ||
      'Failed to create matrix. Please try again.'
  } finally {
    isCreating.value = false
  }
}

function cancelCreate() {
  router.push({ path: `/myprojects/${projectId}/matrices` })
}

function goBack() {
  router_instance.go(-1)
}

onMounted(async () => {
  // Load taxa to check if project has any
  if (!taxaStore.isLoaded) {
    await taxaStore.fetch(projectId)
  }

  if (taxaStore.taxa && taxaStore.taxa.length > 0) {
    hasTaxa.value = true
    taxaCount.value = taxaStore.taxa.length

    // Sort taxa alphabetically using the consolidated utility function
    const sortedTaxa = sortTaxaAlphabetically(taxaStore.taxa)

    firstTaxonName.value = getTaxonName(sortedTaxa[0]) || 'Unknown'
  }
})

onUnmounted(() => {
  // Clean up any pending operations
})
</script>

<template>
  <div class="nav-link d-flex align-items-center fw-bold small m-0 p-0 mb-3">
    <i class="fa-solid fa-chevron-left"></i>
    <a class="nav-link m-0 p-0 pl-1" @click="goBack">Back</a>
  </div>

  <div class="container">
    <form @submit.prevent="createMatrix">
      <!-- Taxa check warning -->
      <div v-if="!hasTaxa" class="alert alert-warning">
        <i class="fa-solid fa-exclamation-triangle"></i>
        <strong>No Taxa Found:</strong> This project has no taxa associated with
        it. You need to add taxa to the project before you can create a matrix.
        <RouterLink
          :to="`/myprojects/${projectId}/taxa`"
          class="btn btn-sm btn-outline-primary ml-2 mt-2"
        >
          Add Taxa
        </RouterLink>
      </div>

      <!-- Taxa count info -->
      <div v-if="hasTaxa" class="alert alert-info">
        <i class="fa-solid fa-info-circle"></i>
        <strong>Note</strong> - your newly created matrix will include, by
        default, the first taxon alphabetically in your project taxon list ({{
          firstTaxonName
        }}). To add more taxa to your matrix first go to the Taxa link on the
        left and add them there. You can define characters for your new matrix
        within the Matrix Editor using its built-in Character Editor.
      </div>

      <!-- General error -->
      <div v-if="errors.general" class="alert alert-danger">
        {{ errors.general }}
      </div>

      <!-- Matrix Title -->
      <div class="form-group">
        <label for="matrix-title" class="form-label">
          Title <span class="text-danger">*</span>
        </label>
        <input
          id="matrix-title"
          v-model="formData.title"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errors.title }"
          placeholder="Enter matrix title"
          required
        />
        <div v-if="errors.title" class="invalid-feedback">
          {{ errors.title }}
        </div>
      </div>

      <!-- Matrix Notes -->
      <div class="form-group">
        <label for="matrix-notes" class="form-label">Notes</label>
        <textarea
          id="matrix-notes"
          v-model="formData.notes"
          class="form-control"
          rows="4"
          placeholder="Enter matrix notes (optional)"
        ></textarea>
      </div>

      <!-- OTU Selection -->
      <div class="form-group">
        <label for="otu" class="form-label">Operational Taxonomic Unit</label>
        <select id="otu" v-model="formData.otu" class="form-control">
          <option
            v-for="unit in taxonomicUnits"
            :key="unit.value"
            :value="unit.value"
          >
            {{ unit.label }}
          </option>
        </select>
      </div>

      <!-- Published Status -->
      <div class="form-group">
        <label for="published" class="form-label">Published Status</label>
        <select
          id="published"
          v-model="formData.published"
          class="form-control"
        >
          <option :value="0">Publish when project is published</option>
          <option :value="1">Never publish to project</option>
        </select>
      </div>

      <!-- Submit Button -->
      <div class="btn-form-group">
        <button
          class="btn btn-outline-primary"
          type="button"
          @click="cancelCreate"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          type="submit"
          :disabled="isCreating || !hasTaxa"
        >
          <span
            v-if="isCreating"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          {{ isCreating ? 'Creating Matrix...' : 'Create Matrix' }}
        </button>
      </div>

      <div v-if="createError" class="alert alert-danger mt-3" role="alert">
        {{ createError }}
      </div>
    </form>
  </div>
</template>

<style scoped>
.container {
  margin: 10px;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #dc3545;
}

.alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
}

.alert-warning {
  color: #856404;
  background-color: #fff3cd;
  border-color: #ffeaa7;
}

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}

.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.btn-step-group {
  display: flex;
  flex: 1;
  margin-top: 15px;
  padding: 0;
}

.btn-step-next {
  flex-grow: 0;
  margin-left: auto;
  order: 2;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 1rem;
  line-height: 1.5;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.15s ease-in-out;
}

.btn-primary {
  background-color: #ef782f;
  border-color: #ef782f;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #d66928;
  border-color: #d66928;
}

.btn-outline-primary {
  background-color: transparent;
  border-color: #ef782f;
  color: #ef782f;
}

.btn-outline-primary:hover {
  background-color: #ef782f;
  color: #fff;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.text-danger {
  color: #dc3545;
}

.ml-2 {
  margin-left: 0.5rem;
}

.me-2 {
  margin-right: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  vertical-align: text-bottom;
  border: 0.125em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 0.125em;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}
</style>
