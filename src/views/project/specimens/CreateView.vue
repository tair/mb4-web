<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema } from '@/views/project/specimens/schema.js'
import Tooltip from '@/components/main/Tooltip.vue'
import {
  getSpecimenTypeTooltipText,
  getTaxonTooltipText,
} from '@/utils/util.js'
import { RouterLink } from 'vue-router'

const route = useRoute()
const projectId = route.params.id
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()

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

// Watch for changes in reference source and clear hidden fields
watch(referenceSource, (newValue) => {
  if (newValue === 1) {
    // Unvouchered - clear all voucher-only field values
    voucheredOnlyFields.forEach((fieldName) => {
      fieldValues.value[fieldName] = ''
    })
  }
})

async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)

  // Remove hidden field values when "Unvouchered" is selected
  if (referenceSource.value === 1) {
    voucheredOnlyFields.forEach((fieldName) => {
      delete json[fieldName]
    })
  }

  const success = await specimensStore.create(projectId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to create specimen')
  }
}
</script>
<template>
  <header>
    <b>Create new</b>
  </header>
  <form @submit.prevent="create">
    <template v-for="(definition, index) in schema" :key="index">
      <div
        v-if="!definition.existed && shouldShowField(index)"
        class="form-group"
      >
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
          <div v-if="index === 'taxon_id'" class="ms-2 d-inline-block">
            <RouterLink
              :to="{ name: 'MyProjectTaxaCreateView', params: { id: projectId } }"
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
                :class="isRefreshingTaxa ? 'fa-spinner fa-spin' : 'fa-arrow-rotate-right'"
              ></i>
              Refresh Taxa
            </a>
            <span 
              v-if="taxaRefreshed" 
              class="text-success ms-2 small"
            >
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
          v-bind="definition.args"
        >
        </component>
      </div>
    </template>
    <div class="btn-form-group">
      <button
        class="btn btn-outline-primary"
        type="button"
        @click="$router.go(-1)"
      >
        Cancel
      </button>
      <button class="btn btn-primary" type="submit">Create</button>
    </div>
  </form>
</template>
