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
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore';

// set const values
const route = useRoute()
const projectId = route.params.projectId
const ProjectInstitutionsStore = useProjectInstitutionStore()
const isLoaded = computed{ 
    () =>
    ProjectInstitutionsStore.isLoaded
}

// fetch institutions once mounted
onMounted( () => {
    if(!ProjectInstitutionsStore.isLoaded)
    {
        ProjectInstitutionsStore.fetchInstitutions()
    }
})

async function assignInstitution() {
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

</script>

<template>
    <div class="div1"></div>
    <div class="div2"></div>
    <div class="div3"></div>
    <div class="div4"></div>
    <div class="div5"></div>
</template>
