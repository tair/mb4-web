<script setup>
import axios from 'axios'
import { useRoute } from 'vue-router'
import { getBibliographyText } from '@/utils/bibliography'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import SearchSelectInput from '@/components/project/SearchSelectInput.vue'
import BibliographyItem from '@/components/project/BibliographyItem.vue'

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

const bibliographiesStore = useBibliographiesStore()

function getBibliographyNumber(bibliography) {
  return bibliography.reference_id
}

async function searchBibliographies(text) {
  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/bibliography/search`
  const response = await axios.post(url, {
    text: text,
  })
  const bibliographyIds = response.data.results
  return bibliographiesStore.bibliographies.filter((bibliography) =>
    bibliographyIds.includes(bibliography.reference_id)
  )
}

function getItem(referenceId) {
  return bibliographiesStore.getReferenceById(referenceId)
}
</script>
<template>
  <SearchSelectInput
    :name="name"
    :initialValue="value"
    :getText="getBibliographyText"
    :getId="getBibliographyNumber"
    :getItem="getItem"
    :search="searchBibliographies"
  >
    <template #item="reference">
      <BibliographyItem :bibliography="reference" />
    </template>
  </SearchSelectInput>
</template>
