<script setup>
import axios from 'axios'
import router from '@/router'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
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

async function addInstitution(institutionId, index) {
  const success = await projectInstitutionsStore.addInstitution(
    projectId,
    institutionId
  )

  if (success) {
    searchList.value.splice(index, 1)

    await router.push({ path: `/myprojects/${projectId}/institutions` })
  } else {
    alert('Failed to Assign Institution')
  }
}

async function searchInstitutions() {
  try {
        const url = `${
          import.meta.env.VITE_API_URL
        }/projects/${projectId}/institutions/search`

        const response = await axios.get(url, {
          params: { searchTerm: searchTerm.value },
        })
        

        searchList.value = response.data
        console.log('help: ', searchList.value.length)
  } catch (e) {
    console.error('Error getting Institutions')
    return false
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <h1>Select an institution to add</h1>
    <form>
      <div class="form-class">
        <div class="search-container">
          <input
            id="newInstitution"
            type="text"
            class="searchTerm"
            v-model="searchTerm"
            @input="searchInstitutions"
          />
        </div>

        <select
          v-if="searchList.length"
          :size="10"
          class="form-control"
        >
          <option
            v-for="(
              institution, index
            ) in searchList"
            :key="index"
            :value="institution.institution_id"
            @click="addInstitution(institution.institution_id, index)"
          >
            {{ institution.name }}
          </option>
        </select>
      </div>
    </form>
  </LoadingIndicator>
</template>

<style scoped>
@import '@/views/project/styles.css';
</style>
