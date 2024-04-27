<script setup>
// import vue and vue router
import {ref, computed, onMounted} from 'vue'
import {useRoute} from'vue-router'
import {router} from '@/router'

// import stores
import { useProjectsStore } from '@/stores/ProjectsStore'

// import others
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

// get consts
const route = useRoute
const projectId = route.params.id
const projectsStore = useProjectsStore()
const isLoaded = computed{
    () => 
        projectsStore.isLoaded
}

// get project institutions
onMounted(() => {
    if(!(projectsStore.isLoaded))
    {
        projectsStore.fetchProjectInstitutions()
    }
})

// remove said project instituion from list
async function removeInstitution(institutionHtml) 
{
    $(institutionHtml).parent().remove();
    formChanged = true;
    return false;
}

</script>