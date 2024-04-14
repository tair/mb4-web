<script>
var formChanged = false;
$(document).ready(function() 
{
  $( "#institutionPanel" ).dialog(
    {
      autoOpen: false,
      resizeable: false,
      width: 700,
      modal: true,
      buttons: { "\u00bb Add": function() 
                {
                  var institutionName = $('.modal_institution').val();
                  if (createInstitution(institutionName)) 
                  {
                    closeModal();
                  }
                },

                Cancel: function() {$(".modal_institution").val(""); closeModal();}
              }
    });

    $('.ui-icon-closethick').css({'top': '0px', 'left': '0px'});

    ('.institution_name').autocomplete(
    {
      source: function (request, response) 
      {
        $.ajax(
        {
          url: '/index.php/MyProjects/lookup/Institution/Get',
          data: { term: request.term, unique: 1 },
          dataType: 'json',
          success: response,
          error: function () 
          {
            response([]);
          }
        });
      },

      open: function(event, ui) 
      {
        var $this = $(this);
        $this.autocomplete('widget').outerWidth($this.outerWidth());
        $this.autocomplete('widget').css("text-align", "left");
      },

      minLength: 3,
      scroll: true,
      select: function(e, ui) 
      {
        var institutionName = ui.item.label;
        var institutionID = ui.item.id;
        createInstitution(institutionName, institutionID);
        clearInstitutionInput();
        closeModal();
        e.preventDefault();
      }

    });
});

function closeModal() 
{
  $( "#institutionPanel" ).dialog("close");
  $(".modal_institution").val("");
}

function clearInstitutionInput() 
{
  $(".institution_name").val("");
}

function doesInstitutionExist(institutionName) 
{
  var institutionExists = false;
  $("span[id='institution_text']").each(function() 
  {
    if (institutionName.trim() === $(this).text().trim()) 
    {
      institutionExists = true;
      return;
    }
  });
  return institutionExists;
}

</script>
<script setup>
// import vue functions
import { computed, ref, onMounted} from 'vue'
import { useRoute } from 'vue-router'

// import functions from stores
import { useProjectsStore } from '@stores/ProjectsStore'

// import other functions for the dom
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

// get route for the specific project 
const route = useRoute()
const projectId = route.params.id

// get the project store to extract insitutions
const projectsStore = useProjectsStore()

// Attempt to load in
const isLoaded = computed(
  () =>
    projectsStore.isLoaded
)

// once mounted get Projects
onMounted(() => {
  if(!projectsStore.isLoaded)
  {
    projectsStore.fetchProjects()    
  }
})

// get specific project info
let project  = projectsStore.getProjectById(projectId)

// might need a refresh here

</script>

<template>
  <h1>Project Institutions</h1>

    <h3 style=''>Please list all author institutions affiliated with your peer-reviewed paper</h3>
    <ul id='institutions_list' name='institutions_list' style=''>
    <input name="confirm" type="hidden" value='1'/>
    
  <div class="action-bar">
    <RouterLink :to="`/myProjects/${projectId}/institutions/assign`">
      <button type="button" class="btn btn-m btn-outline-primary">
        <span>Add Institutions</span>
      </button>
    </RouterLink>    
  </div>

  
</template>

<style scoped>
@import '@/views/project/styles.css';
</style>