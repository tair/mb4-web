<script setup>
import router from '@/router'
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema } from '@/views/project/taxa/schema.js'
import { TAXA_COLUMN_NAMES } from '@/utils/taxa'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import Alert from '@/components/main/Alert.vue'

const route = useRoute()
const projectId = parseInt(route.params.id)

const projectUsersStore = useProjectUsersStore()
const taxaStore = useTaxaStore()
const isLoaded = computed(
  () => projectUsersStore.isLoaded && taxaStore.isLoaded
)

// Track whether additional taxonomic fields are expanded
const showAdditionalFields = ref(false)

// Validation error state
const validationMessages = ref({
  validation: '',
})

// Define which fields are always visible (basic fields)
const basicFields = ['is_extinct', 'genus', 'specific_epithet']

const optionalFields = [
  'scientific_name_author',
  'scientific_name_year',
  'use_parens_for_author',
  'notes',
  'access',
]

const metadataFields = ['user_id', 'created_on', 'last_modified_on']

// Helper computed properties for different sections
const taxonomicFieldsToShow = computed(() => {
  if (!showAdditionalFields.value) return []

  const excludedFields = [...basicFields, ...optionalFields, ...metadataFields]

  return Object.keys(schema).filter((field) => !excludedFields.includes(field))
})

function toggleAdditionalFields() {
  showAdditionalFields.value = !showAdditionalFields.value
}

// Helper function to convert values for checkbox components
function getFieldValue(field, value) {
  // For NumberInput fields, return undefined instead of empty string
  if (field === 'scientific_name_year') {
    return value ? Number(value) : undefined
  }

  // Convert string values to boolean for checkbox fields
  if (field === 'is_extinct' || field === 'use_parens_for_author') {
    return !!value && value !== '0' && value !== 0
  }

  // For other fields, return empty string
  return value
}

function validateTaxonData(formData) {
  // Check if at least one taxonomic rank field has content
  for (const field of TAXA_COLUMN_NAMES) {
    const value = formData.get(field)
    if (value && value.toString().trim() !== '') {
      return true // At least one taxonomic field has meaningful content
    }
  }
  return false // All taxonomic fields are empty
}

async function createTaxon(event) {
  const formData = new FormData(event.currentTarget)

  // Validate that at least one taxonomic field has content
  if (!validateTaxonData(formData)) {
    validationMessages.value.validation =
      'Please fill in at least one taxonomic field before creating the taxon.'
    return
  }

  // Clear validation error if validation passes
  validationMessages.value.validation = ''

  const json = Object.fromEntries(formData)

  // Explicitly handle checkbox values - ensure they're always included
  const checkboxFields = ['is_extinct', 'use_parens_for_author']
  checkboxFields.forEach((field) => {
    // If checkbox field is not in form data, it means it was unchecked
    if (!(field in json)) {
      json[field] = '0'
    }
  })

  const success = await taxaStore.create(projectId, json)
  if (!success) {
    alert(response.data?.message || 'Failed to create taxon')
    return
  }

  router.replace({ path: `/myprojects/${projectId}/taxa` })
}

onMounted(() => {
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <RouterLink
      :to="`/myprojects/${projectId}/taxa`"
      class="mb-3 d-inline-block"
    >
      <i class="fa fa-arrow-left"></i>
      Back to Taxa
    </RouterLink>
    <form @submit.prevent="createTaxon">
      <p class="mt-2">
        You must fill in at least one taxonomic field and indicate whether the
        taxon is extinct.
      </p>
      <div class="row setup-content">
        <!-- 1. Basic Fields Section -->
        <div v-for="field in basicFields" :key="field" class="form-group">
          <label :for="field" class="form-label">
            {{ schema[field].label }}
          </label>
          <component
            :key="field"
            :is="schema[field].view"
            :name="field"
            :value="getFieldValue(field, '')"
            v-bind="schema[field].args"
          >
          </component>
        </div>

        <!-- 2. Expandable Taxonomic Fields Section -->
        <div v-if="showAdditionalFields">
          <div
            v-for="field in taxonomicFieldsToShow"
            :key="field"
            class="form-group"
          >
            <label :for="field" class="form-label">
              {{ schema[field].label }}
            </label>
            <component
              :key="field"
              :is="schema[field].view"
              :name="field"
              :value="getFieldValue(field, '')"
              v-bind="schema[field].args"
            >
            </component>
          </div>
        </div>

        <div class="form-group mb-3">
          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            @click="toggleAdditionalFields"
          >
            <i
              :class="
                showAdditionalFields ? 'fa-solid fa-minus' : 'fa-solid fa-plus'
              "
              class="me-1"
            ></i>
            {{
              showAdditionalFields
                ? 'Hide additional taxonomic ranks'
                : 'Click here for additional taxonomic ranks or a rankless designation'
            }}
          </button>
        </div>

        <!-- 3. Optional Fields Section -->
        <div class="mt-4">
          <h5 class="mb-3">Optional Fields</h5>
          <div v-for="field in optionalFields" :key="field" class="form-group">
            <label :for="field" class="form-label">
              {{ schema[field].label }}
            </label>
            <component
              :key="field"
              :is="schema[field].view"
              :name="field"
              :value="getFieldValue(field, '')"
              v-bind="schema[field].args"
            >
            </component>
          </div>
        </div>

        <Alert
          :message="validationMessages"
          messageName="validation"
          alertType="danger"
        />

        <div class="btn-form-group">
          <RouterLink :to="{ name: 'MyProjectTaxaView' }">
            <button class="btn btn-outline-primary" type="button">
              Cancel
            </button>
          </RouterLink>
          <button class="btn btn-primary" type="submit">Create</button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped></style>
