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

async function addInstitution(name) {
  // list of viable institutions from the database
  let institution = searchList.value.find(
    (institution) => institution.name == name
  )

  if (institution == undefined) {
    return createInstitution(name)
  }

  const success = await projectInstitutionsStore.addInstitution(
    projectId,
    institution.institution_id
  )

  if (success) {
    await router.push({ path: `/myprojects/${projectId}/institutions` })
  } else {
    alert('Failed to Assign Institution')
  }
}

async function createInstitution(name) {
  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/institutions/createInstitution`
  const response = await axios.post(url, { name })

  if (response.status == 200) {
    const institution = response.data.newInstitution
    projectInstitutionsStore.institutions.push(institution)
    await router.push({ path: `/myprojects/${projectId}/institutions` })
  } else {
    alert('Could not add institution to the database')
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
    return true
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
        <p>To add an institution fill out the text field and select save.</p>
        <div class="search-container">
          <input
            id="newInstitution"
            type="text"
            class="searchTerm"
            v-model="searchTerm"
            @input="searchInstitutions"
          />
          <button type="button" @click="addInstitution(searchTerm)">
            Save
          </button>
        </div>

        <select v-if="searchList.length" :size="10" class="form-control">
          <option
            v-for="(institution, index) in searchList"
            :key="index"
            :value="institution.institution_id"
            @click="searchTerm = institution.name"
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
