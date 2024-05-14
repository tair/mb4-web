<script setup>
// import vue and vue router
import router from '@/router'
import {ref, computed, onMounted} from 'vue'
import {useRoute} from'vue-router'

// import stores
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'

// import others
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

// get consts
const route = useRoute()
const projectId = route.params.id
const ProjectInstitutionsStore = useProjectInstitutionStore()
const isLoaded = computed(
    () => 
        ProjectInstitutionsStore.isLoaded
)

// get project institutions
onMounted(() => {
    if(!(ProjectInstitutionsStore.isLoaded))
    {
        ProjectInstitutionsStore.fetchInstitutions(projectId)
    }
})

// remove said project instituion from list
async function removeInstitution(institutionName)  
{
    // try to delete institution
    const deleted = await ProjectInstitutionsStore.removeInstitution(projectId, institutionName)

    if( deleted ) 
    {
        // push to bring back to list page
        await router.push({ path: `/myprojects/${projectId}/institutions` })
    }    
    else
    {
        // alert if fails to delete
        alert('Failed to delete Institution')
    }
}

// User should be able to look at a dropdown or a list of all current institutions attached to this project

    // Should update on the spot 


</script>

<template>
    <LoadingIndicator :isLoaded="isLoaded">
        <form>
            <div class="form-class">
                <label for="Institution">Select an Institution to Remove</label>
                <select v-if="ProjectInstitutionsStore.institutions.length" :size="10" class="form-control">
                    <option v-for="(institution, index) in ProjectInstitutionsStore.institutions" :key="index" :value="institution" @click="removeInstitution(institution)">
                         {{ institution }}
                    </option>
                </select>
            </div>              
        </form>
    </LoadingIndicator>
</template>