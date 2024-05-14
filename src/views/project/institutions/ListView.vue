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
const projectInstitutionsStore = useProjectInstitutionStore()

// Check if loaded in
const isLoaded = computed(
  () =>
    projectInstitutionsStore.isLoaded
)

// once mounted get Projects
onMounted(() => {
  if(!projectInstitutionsStore.isLoaded)
  {
    projectInstitutionsStore.fetchInstitutions(projectId)    
  }
})

// might need a refresh here

</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">

  <header>
    There are {{ projectInstitutionsStore.institutions ? projectInstitutionsStore.institutions.length : 'no' }} institutions associated 
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

  </div>

  </LoadingIndicator>
</template>

<style scoped>
@import '@/views/project/styles.css';
</style>