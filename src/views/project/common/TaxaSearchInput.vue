<script setup>
import { useRoute } from 'vue-router'
import { getTaxonName } from '@/utils/taxa'
import { useTaxaStore } from '@/stores/TaxaStore'
import SearchSelectInput from '@/components/project/SearchSelectInput.vue'
import TaxonomicName from '@/components/project/TaxonomicName.vue'
import { apiService } from '@/services/apiService.js'

defineProps({
  name: {
    type: String,
  },
  value: {
    type: Number,
  },
})

const route = useRoute()
const projectId = route.params.id

const taxaStore = useTaxaStore()

function getTaxonNumber(taxon) {
  return taxon.taxon_id
}

async function searchTaxa(text) {
  // If no search text, return first 50 taxa sorted alphabetically
  if (!text || text.length < 1) {
    return taxaStore.taxa
      .slice() // Create a copy to avoid mutating original array
      .sort((a, b) => {
        const nameA = getTaxonName(a).toLowerCase()
        const nameB = getTaxonName(b).toLowerCase()
        return nameA.localeCompare(nameB)
      })
      .slice(0, 50) // Limit to first 50 results
  }

  // For search text, use the search API
  const url = apiService.buildUrl(`/projects/${projectId}/taxa/search`)
  const response = await apiService.post(url, {
    text: text,
  })
  const responseData = await response.json()
  const taxonIds = responseData.results
  return taxaStore.taxa.filter((taxon) => taxonIds.includes(taxon.taxon_id))
}

function getItem(taxonId) {
  return taxaStore.getTaxonById(taxonId)
}
</script>
<template>
  <SearchSelectInput
    :name="name"
    :initial-value="value"
    :get-text="getTaxonName"
    :get-id="getTaxonNumber"
    :getItem="getItem"
    :search="searchTaxa"
  >
    <template #item="taxon">
      <TaxonomicName :showExtinctMarker="true" :taxon="taxon" />
    </template>
  </SearchSelectInput>
</template>
