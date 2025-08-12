<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useAuthStore } from '@/stores/AuthStore'
import { AccessControlService, EntityType } from '@/lib/access-control.js'
import { schema } from '@/views/project/specimens/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import Tooltip from '@/components/main/Tooltip.vue'
import {
  getSpecimenTypeTooltipText,
  getTaxonTooltipText,
} from '@/utils/util.js'

const route = useRoute()
const projectId = parseInt(route.params.id)
const specimenId = parseInt(route.params.specimenId)

const projectUsersStore = useProjectUsersStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const authStore = useAuthStore()

const isLoaded = computed(
  () =>
    specimensStore.isLoaded && projectUsersStore.isLoaded && taxaStore.isLoaded
)

const specimen = computed(() => specimensStore.getSpecimenById(specimenId))

// ACCESS CONTROL - Using centralized service
const accessResult = ref(null)
const restrictedFields = ref([])
const accessChecked = ref(false)

// Reactive access control check
const canEditSpecimen = computed(() => accessResult.value?.canEdit || false)
const accessMessage = computed(() => {
  if (!accessResult.value) return null
  return AccessControlService.getAccessMessage(
    accessResult.value,
    EntityType.SPECIMEN
  )
})

// Check access when data is loaded
async function checkAccess() {
  if (!specimen.value || !isLoaded.value || accessChecked.value) return

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
      entityType: EntityType.SPECIMEN,
      projectId,
      entity: specimen.value,
    })

    accessResult.value = result
    restrictedFields.value = AccessControlService.getRestrictedFields(
      EntityType.SPECIMEN,
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
  [isLoaded, specimen, () => authStore.user],
  () => {
    if (
      isLoaded.value &&
      specimen.value &&
      authStore.user &&
      !accessChecked.value
    ) {
      checkAccess()
    }
  },
  { immediate: true }
)

// Track the selected reference source type
const referenceSource = ref(0) // Default to "Vouchered" (0)

// Fields that should be hidden when "Unvouchered" is selected
const voucheredOnlyFields = [
  'institution_code',
  'collection_code',
  'catalog_number',
  'occurrence_id',
]

// Reactive field values for voucher-only fields
const fieldValues = ref({
  institution_code: '',
  collection_code: '',
  catalog_number: '',
  occurrence_id: '',
})

// Function to check if a field should be shown
function shouldShowField(field) {
  if (referenceSource.value === 1 && voucheredOnlyFields.includes(field)) {
    return false // Hide vouchered-only fields when "Unvouchered" is selected
  }
  return true
}

// Helper function to check if a field should be disabled
function isFieldDisabled(field) {
  // Disable all fields if user can't edit the specimen
  if (!canEditSpecimen.value) return true

  // Disable restricted fields
  if (restrictedFields.value.includes(field)) return true

  return false
}

// Watch for changes in reference source
watch(referenceSource, (newValue) => {
  if (newValue === 1) {
    // If "Unvouchered" is selected, clear the vouchered-only fields
    voucheredOnlyFields.forEach((field) => {
      fieldValues.value[field] = ''
    })
  }
})

// Initialize reference source from specimen data when loaded
watch(
  specimen,
  (newSpecimen) => {
    if (newSpecimen && newSpecimen.reference_source !== undefined) {
      referenceSource.value = newSpecimen.reference_source
    }
  },
  { immediate: true }
)

// Initialize field values from specimen data
watch(
  specimen,
  (newSpecimen) => {
    if (newSpecimen) {
      voucheredOnlyFields.forEach((field) => {
        if (newSpecimen[field] !== undefined) {
          fieldValues.value[field] = newSpecimen[field]
        }
      })
    }
  },
  { immediate: true }
)

function getFieldValue(field, value) {
  if (voucheredOnlyFields.includes(field)) {
    return fieldValues.value[field]
  }
  return value
}

function updateFieldValue(field, event) {
  if (voucheredOnlyFields.includes(field)) {
    fieldValues.value[field] = event.target.value
  }
}

function onReferenceSourceChange(event) {
  referenceSource.value = parseInt(event.target.value)
}

// State for taxa refresh feedback
const isRefreshingTaxa = ref(false)
const taxaRefreshed = ref(false)

// Function to refresh taxa list
async function refreshTaxa() {
  isRefreshingTaxa.value = true
  try {
    await taxaStore.fetch(projectId)
    taxaRefreshed.value = true
    // Hide success message after 2 seconds
    setTimeout(() => {
      taxaRefreshed.value = false
    }, 2000)
  } finally {
    isRefreshingTaxa.value = false
  }
}

async function editSpecimen(event) {
  // Prevent submission if user doesn't have access
  if (!canEditSpecimen.value) {
    alert('You do not have permission to edit this specimen.')
    return
  }

  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)

  // Set the reference source
  json.reference_source = referenceSource.value

  // If "Unvouchered" is selected, explicitly set vouchered-only fields to empty
  if (referenceSource.value === 1) {
    voucheredOnlyFields.forEach((field) => {
      json[field] = ''
    })
  } else {
    // If "Vouchered" is selected, use the field values from our reactive state
    voucheredOnlyFields.forEach((field) => {
      json[field] = fieldValues.value[field]
    })
  }

  // Remove restricted fields from the submission for security
  restrictedFields.value.forEach((field) => {
    delete json[field]
  })

  const success = await specimensStore.edit(projectId, specimenId, json)
  if (!success) {
    alert('Failed to modify specimen')
    return
  }

  router.push({ path: `/myprojects/${projectId}/specimens` })
}

onMounted(() => {
  // Ensure auth store is loaded from localStorage
  if (!authStore.user?.access) {
    authStore.fetchLocalStore()
  }

  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
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

    <form @submit.prevent="editSpecimen">
      <template v-for="(definition, index) in schema" :key="index">
        <div v-if="shouldShowField(index)" class="mb-3">
          <label for="index" class="form-label">
            {{ definition.label }}
            <span v-if="isFieldDisabled(index)" class="text-muted ms-1"
              >(read-only)</span
            >
            <Tooltip
              v-if="index === 'reference_source'"
              :content="getSpecimenTypeTooltipText()"
            ></Tooltip>
            <Tooltip
              v-if="index === 'taxon_id'"
              :content="getTaxonTooltipText()"
            ></Tooltip>
            <div v-if="index === 'taxon_id'" class="ms-2 d-inline-block">
              <RouterLink
                :to="{
                  name: 'MyProjectTaxaCreateView',
                  params: { id: projectId },
                }"
                target="_blank"
              >
                Add new taxon
              </RouterLink>
              <a
                href="#"
                @click.prevent="refreshTaxa"
                class="ms-2"
                title="Refresh taxa list"
                :class="{ 'text-muted': isRefreshingTaxa }"
              >
                <i
                  class="fa-solid"
                  :class="
                    isRefreshingTaxa
                      ? 'fa-spinner fa-spin'
                      : 'fa-arrow-rotate-right'
                  "
                ></i>
                Refresh Taxa
              </a>
              <span v-if="taxaRefreshed" class="text-success ms-2 small">
                <i class="fa-solid fa-check"></i>
                Refreshed!
              </span>
            </div>
          </label>

          <!-- Special handling for reference_source to track changes -->
          <select
            v-if="index === 'reference_source'"
            :key="`${index}-select`"
            :name="index"
            class="form-control"
            v-model="referenceSource"
            :disabled="isFieldDisabled(index)"
          >
            <option
              v-for="(optionValue, optionLabel) in definition.args.options"
              :key="optionValue"
              :value="optionValue"
            >
              {{ optionLabel }}
            </option>
          </select>

          <!-- Special handling for voucher-only fields to bind values -->
          <component
            v-else-if="voucheredOnlyFields.includes(index)"
            :key="`${index}-voucher`"
            :is="definition.view"
            :name="index"
            v-bind="definition.args"
            :value="fieldValues[index]"
            @input="updateFieldValue(index, $event)"
            :disabled="isFieldDisabled(index)"
          >
          </component>

          <!-- Default component for other fields -->
          <component
            v-else
            :key="`${index}-default`"
            :is="definition.view"
            :name="index"
            :value="getFieldValue(index, specimen[index])"
            v-bind="definition.args"
            :disabled="isFieldDisabled(index)"
          >
          </component>
        </div>
      </template>
      <div class="btn-form-group">
        <RouterLink :to="{ name: 'MyProjectSpecimensListView' }">
          <button class="btn btn-outline-primary" type="button">Cancel</button>
        </RouterLink>
        <button
          class="btn btn-primary"
          type="submit"
          :disabled="!canEditSpecimen"
          :title="
            !canEditSpecimen
              ? 'You do not have permission to edit this specimen'
              : ''
          "
        >
          Save
        </button>
      </div>
    </form>
  </LoadingIndicator>
</template>
