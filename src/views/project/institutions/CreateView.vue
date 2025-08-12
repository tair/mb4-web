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
    <h1>Add Institution</h1>

    <header>
      To add an institution fill out the text field and select save.
    </header>

    <div class="action-bar">
      <RouterLink :to="`/myProjects/${projectId}/institutions`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-arrow-left"></i>
          <span>Back to Institutions</span>
        </button>
      </RouterLink>
    </div>

    <form>
      <div class="form-section">
        <InstitutionSearchInput
          :projectId="Number(projectId)"
          @updateParent="setInstitutionData"
        >
        </InstitutionSearchInput>
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-primary"
            @click="createInstitution(institutionId, institutionName)"
          >
            <i class="fa fa-save"></i>
            Save
          </button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>

<style scoped>
@import '@/views/project/styles.css';

.form-section {
  margin: 32px 0;
  padding: 20px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.form-actions .btn {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
