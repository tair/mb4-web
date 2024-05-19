<script setup>
import router from '@/router'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id
const searchTerm = ref(null)
const ProjectInstitutionsStore = useProjectInstitutionStore()
const isLoaded = computed(() => ProjectInstitutionsStore.isLoaded)

onMounted(() => {
  if (!ProjectInstitutionsStore.isLoaded) {
    ProjectInstitutionsStore.fetchInstitutions(projectId)
  }
})

async function addInstitution(institutionId, index) {
  const success = await ProjectInstitutionsStore.addInstitution(
    projectId,
    institutionId
  )

  if (success) {
    ProjectInstitutionsStore.institutionList.splice(index, 1)

    await router.push({ path: `/myprojects/${projectId}/institutions` })
  } else {
    alert('Failed to Assign Institution')
  }
}

function searchInstitutions() {
  if (
    !ProjectInstitutionsStore.seachInstitutionsBySegment(projectId, searchTerm)
  ) {
    alert('could not obtain list of institutions')
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
          v-if="ProjectInstitutionsStore.institutionList.length"
          :size="10"
          class="form-control"
        >
          <option
            v-for="(
              institution, index
            ) in ProjectInstitutionsStore.institutionList"
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
