<script setup>
// import vue functions
import { computed, ref, onMounted} from 'vue'
import { useRoute } from 'vue-router'

// import functions from stores
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'

// import other functions for the dom
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

// get route for the specific project 
const route = useRoute()
const projectId = route.params.id

// get the project store to extract insitutions
const ProjectInstitutionsStore = useProjectInstitutionStore()

// Check if loaded in
const isLoaded = computed(
  () =>
    ProjectInstitutionsStore.isLoaded
)

// once mounted get Projects
onMounted(() => {
  if(!ProjectInstitutionsStore.isLoaded)
  {
    ProjectInstitutionsStore.fetchInstitutions(projectId)    
  }
})

// might need a refresh here

</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">

  <header>
    There are {{ ProjectInstitutionsStore.institutions.length != 0 ? ProjectInstitutionsStore.institutions.length : 'no' }} institutions associated 
    with this project.

  </header>

  <h1>Project Institutions</h1>
    
  <div class="action-bar">

    <RouterLink :to="`/myProjects/${projectId}/institutions/assign`">
      <button type="button" class="btn btn-m btn-outline-primary">
        <i class = "fa fa-plus"></i>
        <span>Add Institutions</span>
      </button>
    </RouterLink>  

    <RouterLink :to="`/myProjects/${projectId}/institutions/remove`">
      <button type="button" class="tn btn-m btn-outline-primary">
        <i class = "fa fa-plus"></i>
        <span>Remove Institutions</span>
      </button>
    </RouterLink>

    <div v-if="ProjectInstitutionsStore.institutions.length" :size="10" class="form-control">
       Current Institutions Associated with this Project
    </div>

      <label v-for="(institution, index) in ProjectInstitutionsStore.institutions"
            :key="index"
            :value="institution"
            class="grid-group-items"
      >
      {{institution}}
      </label>

  </div>

  </LoadingIndicator>
</template>

<style scoped>
@import '@/views/project/styles.css';
</style>