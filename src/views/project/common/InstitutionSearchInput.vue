<script setup lang="ts">
import axios from 'axios'
import { useRoute } from 'vue-router'
import SearchSelectInput from '@/components/project/SearchSelectInput.vue'

const route = useRoute()
const projectId = route.params.id
const institutionCache = new Map()

const emit = defineEmits(['updateParent'])

async function searchInstitutions(searchTerm: string) {
  try {
    const url = `${
      import.meta.env.VITE_API_URL
    }/projects/${projectId}/institutions/search`

    const response = await axios.get(url, {
      params: { searchTerm: searchTerm },
    })

    const institutionsFound = response.data

    institutionsFound.forEach((institution: any) => {
      institutionCache.set(institution.id, institution)
    })

    return institutionsFound
  } catch (e) {
    console.error('Error getting Institutions\n', e)
  }
}

function getInstitutionId(institution: any) {
  return institution.institution_id
}

function getInstitutionName(institution: any) {
  return institution.name
}

async function getInstitution(institutionId: number) {
  return institutionCache.get(institutionId)
}

function handleSelect(institution: any) {
  emit('updateParent', institution.name, institution.institution_id)
}
function handleUpdate(text: string) {
  emit('updateParent', text, null)
}
</script>
<template>
  <SearchSelectInput
    :get-text="getInstitutionName"
    :get-id="getInstitutionId"
    :get-item="getInstitution"
    :search="searchInstitutions"
    @select="handleSelect"
    @updateTextboxString="handleUpdate"
  >
    <template #item="institution">
      {{ institution.name }}
    </template>
  </SearchSelectInput>
</template>
