<script setup>
import router from '@/router'
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useAuthStore } from '@/stores/AuthStore'
import { AccessControlService, EntityType } from '@/lib/access-control.js'
import { schema } from '@/views/project/taxa/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = parseInt(route.params.id)
const taxonId = parseInt(route.params.taxonId)

const projectUsersStore = useProjectUsersStore()
const taxaStore = useTaxaStore()
const authStore = useAuthStore()
const isLoaded = computed(
  () => projectUsersStore.isLoaded && taxaStore.isLoaded
)
const taxon = computed(() => taxaStore.getTaxonById(taxonId))

// Track whether additional taxonomic fields are expanded
const showAdditionalFields = ref(false)

// Define which fields are always visible (basic fields)
const basicFields = ['is_extinct', 'genus', 'specific_epithet']

const optionalFields = [
  'scientific_name_author',
  'scientific_name_year',
  'use_parens_for_author',
  'notes',
]

const metadataFields = ['user_id', 'access', 'created_on', 'last_modified_on']

// ACCESS CONTROL - Simplified using centralized service
const accessResult = ref(null)
const restrictedFields = ref([])
const accessChecked = ref(false)

// Reactive access control check
const canEditTaxon = computed(() => accessResult.value?.canEdit || false)
const accessMessage = computed(() => {
  if (!accessResult.value) return null
  return AccessControlService.getAccessMessage(
    accessResult.value,
    EntityType.TAXON
  )
})

// Check access when data is loaded
async function checkAccess() {
  if (!taxon.value || !isLoaded.value || accessChecked.value) return

  // Ensure auth store is ready
  if (!authStore.user?.access) {
    authStore.fetchLocalStore()

    // If still no access, wait a bit and try again
    if (!authStore.user?.access) {
      setTimeout(checkAccess, 100)
      return
    }
  }

  try {
    const result = await AccessControlService.canEditEntity({
      entityType: EntityType.TAXON,
      projectId,
      entity: taxon.value,
    })

    accessResult.value = result
    restrictedFields.value = AccessControlService.getRestrictedFields(
      EntityType.TAXON,
      result
    )
    accessChecked.value = true
  } catch (error) {
    console.error('Error checking access:', error)
    accessResult.value = {
      canEdit: false,
      reason: 'Error checking permissions',
      level: 'error',
    }
    accessChecked.value = true
  }
}

// Watch for when all required data becomes available
watch(
  [isLoaded, taxon, () => authStore.user],
  () => {
    if (
      isLoaded.value &&
      taxon.value &&
      authStore.user &&
      !accessChecked.value
    ) {
      checkAccess()
    }
  },
  { immediate: true }
)

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
  // Convert string values to boolean for checkbox fields
  if (field === 'is_extinct' || field === 'use_parens_for_author') {
    return !!value && value !== '0' && value !== 0
  }
  return value
}

// Helper function to check if a field should be disabled
function isFieldDisabled(field) {
  // Disable all fields if user can't edit the taxon
  if (!canEditTaxon.value) return true

  // Disable restricted fields
  if (restrictedFields.value.includes(field)) return true

  return false
}

async function editTaxon(event) {
  // Prevent submission if user doesn't have access
  if (!canEditTaxon.value) {
    alert('You do not have permission to edit this taxon.')
    return
  }

  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)

  // Explicitly handle checkbox values - ensure they're always included
  const checkboxFields = ['is_extinct', 'use_parens_for_author']
  checkboxFields.forEach((field) => {
    // If checkbox field is not in form data, it means it was unchecked
    if (!(field in json)) {
      json[field] = '0'
    }
  })

  // Remove restricted fields from the submission for security
  restrictedFields.value.forEach((field) => {
    delete json[field]
  })

  const success = await taxaStore.edit(projectId, taxonId, json)
  if (!success) {
    alert(response.data?.message || 'Failed to modify taxon')
    return
  }

  router.push({ path: `/myprojects/${projectId}/taxa` })
}

onMounted(() => {
  // Ensure auth store is loaded from localStorage
  if (!authStore.user?.access) {
    authStore.fetchLocalStore()
  }

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
    <!-- Access Control Messages -->
    <div
      v-if="accessMessage"
      :class="[
        'alert',
        accessMessage.type === 'error' ? 'alert-danger' : 'alert-info',
      ]"
      role="alert"
    >
      <i
        :class="
          accessMessage.type === 'error'
            ? 'fa-solid fa-exclamation-triangle'
            : 'fa-solid fa-info-circle'
        "
        class="me-2"
      ></i>
      {{ accessMessage.message }}
    </div>

    <form @submit.prevent="editTaxon">
      <p class="mt-2">
        You must fill in at least one taxonomic field and indicate whether the
        taxon is extinct.
      </p>
      <div class="row setup-content">
        <!-- 1. Basic Fields Section -->
        <div v-for="field in basicFields" :key="field" class="form-group">
          <label :for="field" class="form-label">
            {{ schema[field].label }}
            <span v-if="isFieldDisabled(field)" class="text-muted ms-1"
              >(read-only)</span
            >
          </label>
          <component
            :key="field"
            :is="schema[field].view"
            :name="field"
            :value="getFieldValue(field, taxon[field])"
            :disabled="isFieldDisabled(field)"
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
              <span v-if="isFieldDisabled(field)" class="text-muted ms-1"
                >(read-only)</span
              >
            </label>
            <component
              :key="field"
              :is="schema[field].view"
              :name="field"
              :value="getFieldValue(field, taxon[field])"
              :disabled="isFieldDisabled(field)"
              v-bind="schema[field].args"
            >
            </component>
          </div>
        </div>

        <div class="form-group mb-3">
          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            :disabled="!canEditTaxon"
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
              <span v-if="isFieldDisabled(field)" class="text-muted ms-1"
                >(read-only)</span
              >
            </label>
            <component
              :key="field"
              :is="schema[field].view"
              :name="field"
              :value="getFieldValue(field, taxon[field])"
              :disabled="isFieldDisabled(field)"
              v-bind="schema[field].args"
            >
            </component>
          </div>
        </div>

        <!-- 4. Metadata Fields Section -->
        <div v-for="field in metadataFields" :key="field" class="form-group">
          <label :for="field" class="form-label">
            {{ schema[field].label }}
            <span v-if="isFieldDisabled(field)" class="text-muted ms-1"
              >(read-only)</span
            >
          </label>
          <component
            :key="field"
            :is="schema[field].view"
            :name="field"
            :value="getFieldValue(field, taxon[field])"
            :disabled="isFieldDisabled(field)"
            v-bind="schema[field].args"
          >
          </component>
        </div>

        <div class="btn-form-group">
          <RouterLink :to="{ name: 'MyProjectTaxaView' }">
            <button class="btn btn-outline-primary" type="button">
              Cancel
            </button>
          </RouterLink>
          <button
            class="btn btn-primary"
            type="submit"
            :disabled="!canEditTaxon"
            :title="
              !canEditTaxon
                ? 'You do not have permission to edit this taxon'
                : ''
            "
          >
            Save
          </button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped></style>
