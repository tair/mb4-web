<script setup>
/*
    Template layout
    =================================================================
    1. form
        - print a summary line
        - inform user
            -You can publish a subset of your project data by defining a partition in the matrix editor and then exporting that partition to a new MorphoBank project using the controls below.
            -*NOTE* The new partition will not be published live immediately upon creation. It will be listed among your unpublished projects and you will then need to follow the regular steps for publication.
            -The partition publishing process copies all of the taxa and characters in your partition along with any partition-associated matrix data, media, specimens, views, labels, character notes and cell notes. All bibliographic references and documents from the project, regardless of partition, will be copied as well, as will any media related to project bibliographic references. The result will be a new project separate and independent from this project containing only the partition-defined subset described above. Subsequent changes made in either this project or the published partition will not be reflected in the other.
            -Please use this tool only when you intend to publish something as server space is finite. 	
        - ask user for a partition to publish
        - make a submit button that calls a function to publish said partition
    2. header
        - print partition publishing
    3. partition result
        - check if success of submitting request
            - IF YES : your request to publish the {name} partition in P('projectId') has been submitted. You will receive an email notification at ('email') when duplication of the partition is completed.
        	- if no: Error copying partition: (error) // maybe keep
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

    
    Setup layout
    =================================================================
    1. form 
        - get information for each partition associated with this project 
    2. header
        - make it do the print
    3. partition result 
        - get partition info to print
        - get whether it was successful or not 
        - try to tell user what went wrong with the request
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
let partitions = ref([])
let onetimeMedia = null
let taxa = null
let character = null

onMounted(() => {
  getPartitions()
})

async function getPartitions() {
  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/publish/partition`
  const response = await axios.get(url)

  partitions.value = response.data
}

async function publishPartition() {
  const formData = new FormData(event.target)
  const formObject = Object.fromEntries(formData.entries())
}
</script>

<template>
  <p>
    You can publish a subset of your project data by defining a partition in the
    matrix editor and then exporting that partition to a new MorphoBank project
    using the controls below.
  </p>
  <p>
    *NOTE* The new partition will not be published live immediately upon
    creation. It will be listed among your unpublished projects and you will
    then need to follow the regular steps for publication.
  </p>
  <p>
    The partition publishing process copies all of the taxa and characters in
    your partition along with any partition-associated matrix data, media,
    specimens, views, labels, character notes and cell notes. All bibliographic
    references and documents from the project, regardless of partition, will be
    copied as well, as will any media related to project bibliographic
    references. The result will be a new project separate and independent from
    this project containing only the partition-defined subset described above.
    Subsequent changes made in either this project or the published partition
    will not be reflected in the other.
  </p>
  <p>
    Please use this tool only when you intend to publish something as server
    space is finite
  </p>

  <div v-if="partitions.length > 0">
    <form @submit.prevent="publishPartition">
      <p>Please select a partition to publish:</p>
      <ul class="list-group">
        <div class="list-group-item-content">
          <li
            v-for="partition in partitions"
            :key="partition.partition_id"
            class="list-group-item"
          >
            <input
              class="form-check-input"
              type="radio"
              name="selectedPartition"
              value="partition.partition_id"
            />
            <div class="list-group-item-name">
              {{ partition.name }}
            </div>
          </li>
        </div>
      </ul>
    </form>
  </div>
  <div v-else>
    <p>{{ partitions }}</p>
  </div>
</template>
