<script setup>
/*
    4. Summary (dear lord...)
        - print partition name
        - display partition contents
            - just all the nums of what was retrieved
        - display to the user that if they wish to edit any of this then they must do so in the matrix editor
        - if onetime media is present
            - inform the user: This partition contains {vn_num_one_time_use_media} media released for onetime use. Due to this license, these media may not be usable in a derivative project. You must either change the media reuse license, or choose to keep the media in the current project, the new parition based project or both (bypassing one-time use).  
                - Click here to see a list of all onetime use media.
                - display three options 
                    - Keep one-time use media in existing project
                    - Move one-time use media to new partition based project
                    - Use one-time use media in both existing project and new partition based project
        - print the help texts
            - When you publish this partition, a new project will be created with the characters and taxa listed above. Any matrices, media, copyright documents and bibliographic
			  citations associated with the characters and taxa will be copied into the new project. The new project will be left in an unpublished state to allow you time to review
			  prior to publication.
            - Note that the new project you create here will be separate from P<?php print $t_project->getPrimaryKey(); ?> (<?php print $t_project->get('name'); ?>) and create
			  only the subset of information described above. Changes made to the newly created project will not affect P<?php print $t_project->getPrimaryKey(); ?> or vice versa.
            - Note that publishing a partition may consume significant server resources, particularly storage. Please be considerate and only publish
			  when you need to.
        - print if partition is empty: You cannot publish this partition because it is empty</strong>. Please add characters and taxa and try again.
        - else show a button that allows publishment

    4. Summary (dear lord...)
        - get taxa and characters from the partition 
        - get num of matricies and get media specimens and views 
        - get num of media, onetime media, specimens, and views
            - make it possible to get links to each onetimeMedia when requested
            - make it possible to retrieve the decision with what has to be done for the onetimeMedia
        - get num of documents, labels, and bib references
        - create new taxa?
        - check if the partition is empty 
*/
import axios from 'axios'
import router from '@/router'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = route.params.id
const partitionId = route.params.partitionId

let onetimeMedia = null
let taxa = null
let character = null

onMounted(() => {})

async function publishPartition(event) {
  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/publish/partition`
  const response = await axios.post(url, { partitionId })

  if (response.status == 200) {
    // whatever logic goes here
  } else {
    // display to the user what exactly went wrong
  }
}
</script>
<template>
  <h1>its alive !</h1>
</template>
