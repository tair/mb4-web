<script setup>
import router from '@/router'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
import InstitutionSearchInput from '@/views/project/common/InstitutionSearchInput.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id
const projectInstitutionsStore = useProjectInstitutionStore()
const isLoaded = computed(() => projectInstitutionsStore.isLoaded)

let institutionId = null
let institutionName = null

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
    const result = await projectInstitutionsStore.addInstitution(
      projectId,
      institutionId,
      name
    )

    if (!result) {
      alert('Could not add Institution to Project')
    } else {
      await router.push({ path: `/myprojects/${projectId}/institutions` })
    }
  } else {
    alert('Institution already associated with this project')
  }
}

function setInstitutionData(name, id) {
  institutionName = name
  institutionId = id
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
        :projectId="Number(projectId)"
        @updateParent="setInstitutionData"
      >
      </InstitutionSearchInput>
      <button
        type="button"
        @click="createInstitution(institutionId, institutionName)"
      >
        Save
      </button>
    </form>
  </LoadingIndicator>
</template>

<style scoped>
@import '@/views/project/styles.css';
</style>
