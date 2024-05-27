<script setup>
import axios from 'axios'
import router from '@/router'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
import InstitutionSearchInput from '@/components/project/InstitutionSearchInput.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id
const searchTerm = ref(null)
let searchList = ref([])
const projectInstitutionsStore = useProjectInstitutionStore()
const isLoaded = computed(() => projectInstitutionsStore.isLoaded)

onMounted(() => {
  if (!projectInstitutionsStore.isLoaded) {
    projectInstitutionsStore.fetchInstitutions(projectId)
  }
})

async function createInstitution(institutionId, name) {
  const institutionXProject = projectInstitutionsStore.institutions.find(
    (institution) => institution.name == name
  )

  if (institutionXProject == null) {
    if (
      !projectInstitutionsStore.addInstitution(projectId, institutionId, name)
    ) {
      alert('Could not add Institution to Project')
    } else {
      await router.push({ path: `/myprojects/${projectId}/institutions` })
    }
  } else {
    alert('Institution already associated with this project')
  }
}

async function searchInstitutions(searchTerm) {
  try {
    const url = `${
      import.meta.env.VITE_API_URL
    }/projects/${projectId}/institutions/search`

    const response = await axios.get(url, {
      params: { searchTerm: searchTerm },
    })

    return response.data
  } catch (e) {
    console.error('Error getting Institutions\n', e)
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <h1>Select an institution to add</h1>
    <form>
      <div class="form-class">
        <p>To add an institution fill out the text field and select save.</p>
      </div>
      <InstitutionSearchInput
        :search="searchInstitutions"
        :creation="createInstitution"
      >
      </InstitutionSearchInput>
    </form>
  </LoadingIndicator>
</template>

<style scoped>
@import '@/views/project/styles.css';
</style>
