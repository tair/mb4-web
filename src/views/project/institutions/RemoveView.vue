<script setup>
// import vue and vue router
import {ref, computed, onMounted} from 'vue'
import {useRoute} from'vue-router'
import {router} from '@/router'

// import stores
import { useProjectInstitutionsStore } from '@/stores/ProjectInstitutionsStore'

// import others
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

// get consts
const route = useRoute()
const projectId = route.params.id
const projectInstitutionsStore = useProjectInstitutionsStore()
const isLoaded = computed(
    () => 
        projectInstitutionsStore.isLoaded
)

// get project institutions
onMounted(() => {
    if(!(projectInstituinsStore.isLoaded))
    {
        projectInstitutionsStore.fetchInstitutions()
    }
})

// remove said project instituion from list
async function removeInstitution(event)  
{
    const institutionId = this.$refs.InstitutionRef

    // try to delete institution
    const deleted = await projectInstitutionsStore.removeInstitution(projectId, institutionId)

    if( !deleted ) {
        // alert if fails to delete
        alert('Failed to delete Institution')
    }
}

// User should be able to look at a dropdown or a list of all current institutions attached to this project

    // Should update on the spot 


</script>

<template>
    <LoadingIndicator :isLoaded="isLoaded">
        <form @submit.prevent="removeInstitution">
            <div class="TBD">
                <label for="Institution">Select an Institution to Remove</label>
                <select id="Institution" ref="InstitutionRef">
                    <option v-for="(institution, index) in ProjectInstitutionsStore.insitutions" :key="index" :value="institution"> {{ institution }}</option>
                </select>
            </div>              
        </form>
    </LoadingIndicator>
</template>