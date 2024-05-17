<script setup>
// import
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useProjectDuplicationStore } from '@/stores/ProjectDuplicationStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useUserStore } from '@/stores/UserStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

// compute loading screen
const route = useRoute()
const projectId = route.params.id
const message = ref([null])
const errorMessage = null
const ProjectDuplicationStore = useProjectDuplicationStore()
const ProjectUsersStore = useProjectUsersStore()
const UserStore = useUserStore()
const isLoaded = computed(
    () =>
        ProjectDuplicationStore.isLoaded &&
        ProjectUsersStore.isLoaded
)

// onmounted
onMounted(() => {
    if(!ProjectDuplicationStore.isLoaded){
        // insert somethiong here
        ProjectDuplicationStore.checkForConditions
    }

    if(!ProjectUsersStore.isLoaded){
        ProjectUsersStore.fetchUsers(projectId)
    }
})

// functions
async function makeRequest() {
    if(message.length == 0) {
        // reason why cannot be empty
        errorMessage = 'There were errors in your form: Why the user would like to duplicate the project must be at least 1 characters'
    }
    else if(ProjectDuplicationStore.onetimeMedia.length > 0) {
        // print message explaining what it means
        errorMessage = "There are media licensed for onetime use in this project. " + 
                       "This license means that the copyright holder has released the media for use in one MorphoBank project only at present. " +
                       "To honor the copyright holder's wishes MorphoBank only allows the media in question to exist in one project."

        // check if requestie is not a member of the project and display dif message
        UserStore.fetchCurrentUser()
        if(!ProjectUsersStore.users.includes(UserStore.userForm)){            
            // DO NOT SHOW DROPDOWN IF THIS CASE HAPPENS////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            errorMessage = "As a result, this media can not be copied to the new project during project duplication."
        }
        else {
            // if published this media cannot be duplicated 
            if(ProjectDuplicationStore.isPublished){
                errorMessage = "Because this project has already been published, the onetime use media can not be copied to the duplicated project."

            } else {

                // else
                errorMessage ="During project duplication, the media must be moved to the new project or kept in the original project."
                
                // media can only be present in one of the two projects so make them choose
            }    
            
            // list the onetime use media
            for(const media in ProjectDuplicationStore.onetimeMedia){
                // different routes depending on the last if statement
                if(!ProjectDuplicationStore.isPublished) {
                    // something 
                } else {
                    // if not published handle what do with this media
                }

                
            }

                
        }
            
            
    }  
    else {
        // push back to overview 
        ProjectDuplicationStore.sendRequest(projectId, message)
        router.push({ path: `/myprojects/${projectId}/overview` })
    } 
    
}


</script>

<template>
    <LoadingIndicator :isLoaded="isLoaded">
        <h1 v-if="errorMessage != null">{{ errorMessage }}</h1>

        <header>
            Project: P{{ projectId }} Test
        </header>

        <RouterLink :to="`/myProjects/${projectId}/overview`">
            <button class="action-bar">
                Back to Project Overview
            </button>
        </RouterLink>

        <p> 
            Please use the following form to submit a request to duplicate P{{projectId}}. 
            After submission, a MorphoBank administrator will contact you with further information.
        </p>

        <form>
            <label>Enter your remarks here:</label>
            <input type="text" v-model="message">
            <input type="submit" @click="makeRequest">
        </form>

        <div class="list-group-item-name" v-if="ProjectDuplicationStore.onetimeMedia.length > 0">
             
        </div>

        

    </LoadingIndicator>
</template>

<style scoped></style>
