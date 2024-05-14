<script setup>

// import stores and vue libraries
import router from '@/router'
import {ref, computed, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
import { usePublicProjectsStore } from '@/stores/PublicProjectsStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

// set const values
const route = useRoute()
const projectId = route.params.id
const searchTerm = ref(null)
const ProjectInstitutionsStore = useProjectInstitutionStore()
const isLoaded = computed( 
    () =>
    ProjectInstitutionsStore.isLoaded
)

// fetch institutions once mounted
onMounted( () => {
    if(!ProjectInstitutionsStore.isLoaded)
    {
        ProjectInstitutionsStore.fetchInstitutions(projectId)
    }
})

async function assignInstitution(institutionId) {
    
    // attempt to add institution
    const success = await ProjectInstitutionsStore.assignInstitution(projectId, institutionId)

    // check if institution was successfully added
    if(success)
    {
        // push to update data
        router.push({ path: `/myprojects/${projectId}/institutions` })
    }
    else
    {
        // alert the error
        alert('Failed to Assign Institution')
    }
}

function searchInstitutions() {
    if(!ProjectInstitutionsStore.seachInstitutionsBySegment(projectId, searchTerm))
    {
        alert('could not obtain list of institutions')
    }
}


// user should be able to look at a dropdown of all existing institutions and select which to assign

    // what if their institution is not listed below?

    // Shouldn't be able to show or add an existant institution 

</script>

<template>
    <LoadingIndicator :isLoaded="isLoaded">
        <h1> Select an institution to add </h1>
        <form >
            <div class="form-class">
                <div class="search-container">
                    <input id="newInstitution" type="text" class="searchTerm" v-model= "searchTerm" @input="searchInstitutions" />
                    
                </div> 

                <select v-if="ProjectInstitutionsStore.institutionList.length" :size="10" class="form-control">
                    <option
                        v-for="institution in ProjectInstitutionsStore.institutionList"
                        :key="institution.institution_id"
                        :value="institution.institution_id"
                        @click="assignInstitution(institution.institution_id)"
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