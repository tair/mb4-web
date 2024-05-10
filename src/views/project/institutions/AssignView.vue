<script>
/*
$("#newInstitutionClick").on("click", function() {
          if ($('#institution_affiliated_checkbox').is(':checked')) {
            alert('New Institutions cannot be added since you have indicaed that you are not affiliated with an institution.');
            return false;
          }
          $("#institutionPanel").dialog("open");
          return false;
        });


function createInstitution(institutionName, institutionID)
{
    if (!institutionName || !institutionName.length || !institutionName.trim().length)
    {
        alert('Please enter a valid institution');
        return false;
    }

    institutionID = institutionID || false;
    var newInput = document.createElement("INPUT");
    if (doesInstitutionExist(institutionName)) 
    {
        alert('Institution \"' +  institutionName + '\" has already been added. Please add unique institutions');
        return false;
    }

    newInput.name = institutionID ? "institution_id[]": "new_institution[]";
    newInput.id = institutionID ? "existing_institution" : "new_institution";
    newInput.type = "hidden";
    newInput.value = institutionID ? institutionID : institutionName;

    var $newA = $(document.createElement("A"));

    $newA.attr('href', "#").html('&raquo;Remove').click(function()
    {
        removeInstitution(this);
        return false;
    });

    var $newLi = $(document.createElement("LI"));
    var $spanText = $('<span style="padding-right:5px" id="institution_text"></span>');
    $spanText.text(institutionName);
    $newLi.append($spanText, $newA, newInput);
    $('#institutions_list').append($newLi).slideDown(200);

    if ($('#noInstitutions').length) {
        $('#noInstitutions').remove();
    }
    return true;
}*/

// import stores and vue libraries
import {ref, computed, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
import { usePublicProjectsStore } from '@/stores/PublicProjectsStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

// set const values
const route = useRoute()
const projectId = route.params.projectId
const ProjectInstitutionsStore = useProjectInstitutionStore()
const PublicProjectStore = usePublicProjectsStore()
const isLoaded = computed( 
    () =>
    ProjectInstitutionsStore.isLoaded &&
    PublicProjectStore.isLoaded
)

// fetch institutions once mounted
onMounted( () => {
    if(!ProjectInstitutionsStore.isLoaded)
    {
        ProjectInstitutionsStore.fetchInstitutions()
    }
    if(!PublicProjectStore.isLoaded)
    {
        PublicProjectStore.fetchProjectInstitutions()
    }
})

async function assignInstitution() {
    // get ref value from user
    const institutionToAdd = this.$refs.InstitutionRef
    
    // attempt to add institution
    const success = await ProjectInstitutionsStore.addInstitution(projectId, institutionToAdd)

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

// user should be able to look at a dropdown of all existing institutions and select which to assign

    // what if their institution is not listed below?

    // Shouldn't be able to show or add an existant institution 

</script>

<template>
    <LoadingIndicator :isLoaded="isLoaded">
        <form @submit.prevent="assignInstitution">
            <div class="TBD">
                <label for="Institution">Select an Institution to Add</label>
                <select id="Institution" ref="InstitutionRef">
                    <option v-for="(institution, index) in PublicProjectsStore.insitutions" :key="index" :value="institution"> {{ institution }}</option>
                </select>
            </div>              
        </form>
    </LoadingIndicator>
</template>
