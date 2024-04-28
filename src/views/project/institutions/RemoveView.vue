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
const isLoaded = computed{
    () => 
        projectInstitutionsStore.isLoaded
}

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
    // try to delete institution
    const deleted = await projectInstitutionsStore.removeInstitution(projectId, institutionId)

    if( !deleted ) {
        // alert if fails to delete
        alert('Failed to delete Institution')
    }
}

</script>

<template>
    <div class=""></div>
    <div class=""></div>
    <div class=""></div>
    <div class=""></div>
</template>