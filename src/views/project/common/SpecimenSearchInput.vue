<script setup>
import axios from 'axios'
import { useRoute } from 'vue-router'
import { getSpecimenName } from '@/utils/specimens'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import SearchSelectInput from '@/components/project/SearchSelectInput.vue'
import SpecimenName from '@/components/project/SpecimenName.vue'

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

const route = useRoute()
const projectId = route.params.id

const specimenStore = useSpecimensStore()
const taxaStore = useTaxaStore()

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
</script>
<template>
  <SearchSelectInput
    :name="name"
    :initial-value="value"
    :disabled="disabled"
    :get-text="getText"
    :get-id="getSpecimenNumber"
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
</template>
