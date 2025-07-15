<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
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

const isLoaded = computed(
  () =>
    specimensStore.isLoaded && projectUsersStore.isLoaded && taxaStore.isLoaded
)

const specimen = computed(() => specimensStore.getSpecimenById(specimenId))

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
function shouldShowField(fieldName) {
  if (voucheredOnlyFields.includes(fieldName)) {
    return referenceSource.value === 0 // Only show for "Vouchered"
  }
  return true // Show all other fields
}

// Watch for changes in reference source and clear hidden fields
watch(referenceSource, (newValue) => {
  if (newValue === 1) {
    // Unvouchered - clear all voucher-only field values
    voucheredOnlyFields.forEach((fieldName) => {
      fieldValues.value[fieldName] = ''
    })
  }
})

// Initialize values when specimen data is loaded
watch(
  specimen,
  (newSpecimen) => {
    if (newSpecimen) {
      referenceSource.value = newSpecimen.reference_source || 0
      voucheredOnlyFields.forEach((fieldName) => {
        fieldValues.value[fieldName] = newSpecimen[fieldName] || ''
      })
    }
  },
  { immediate: true }
)

onMounted(() => {
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

async function edit(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)

  // Remove hidden field values when "Unvouchered" is selected
  if (referenceSource.value === 1) {
    voucheredOnlyFields.forEach((fieldName) => {
      delete json[fieldName]
    })
  }

  const success = await specimensStore.edit(projectId, specimenId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to update specimen')
  }
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <form @submit.prevent="edit">
      <template v-for="(definition, index) in schema" :key="index">
        <div v-if="shouldShowField(index)" class="mb-3">
          <label for="index" class="form-label">
            {{ definition.label }}
            <Tooltip
              v-if="index === 'reference_source'"
              :content="getSpecimenTypeTooltipText()"
            ></Tooltip>
            <Tooltip
              v-if="index === 'taxon_id'"
              :content="getTaxonTooltipText()"
            ></Tooltip>
            <RouterLink
              v-if="index === 'taxon_id'"
              :to="{
                name: 'MyProjectTaxaCreateView',
                params: { id: projectId },
              }"
              target="_blank"
              class="ms-2"
            >
              Add new taxon
            </RouterLink>
          </label>

          <!-- Special handling for reference_source to track changes -->
          <select
            v-if="index === 'reference_source'"
            :key="`${index}-select`"
            :name="index"
            class="form-control"
            v-model="referenceSource"
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
            @input="fieldValues[index] = $event.target.value"
          >
          </component>

          <!-- Default component for other fields -->
          <component
            v-else
            :key="`${index}-default`"
            :is="definition.view"
            :name="index"
            :value="specimen[index]"
            v-bind="definition.args"
          >
          </component>
        </div>
      </template>
      <div class="btn-form-group">
        <RouterLink :to="{ name: 'MyProjectSpecimensListView' }">
          <button class="btn btn-outline-primary" type="button">Cancel</button>
        </RouterLink>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  </LoadingIndicator>
</template>
