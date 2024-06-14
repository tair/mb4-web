<script setup lang="ts">
import axios from 'axios'
import SearchSelectInput from '@/components/project/SearchSelectInput.vue'
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'

const props = defineProps<{
  projectId: number
}>()

const emit = defineEmits(['updateParent'])
const ProjectsInstitutionStore = useProjectInstitutionStore()

async function searchInstitutions(searchTerm: string) {
  try {
    const url = `${import.meta.env.VITE_API_URL}/projects/${
      props.projectId
    }/institutions/search`

    const response = await axios.get(url, {
      params: { searchTerm: searchTerm },
    })

    return response.data
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
  return await ProjectsInstitutionStore.getInstitutionById(
    props.projectId,
    institutionId
  )
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
