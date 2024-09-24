<script setup>
import axios from 'axios'
import router from '@/router'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = route.params.id
let onetimeMedia = ref([])
let isPublished = ref(false)
let userAccess = ref(false)

onMounted(async () => {
  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/duplication/request`
  const response = await axios.get(url)

  onetimeMedia.value = response.data.oneTimeMedia
  isPublished.value = response.data.projectPublished
  userAccess.value = response.data.hasAccess
})

async function makeRequest(event) {
  const formData = new FormData(event.target)
  const formObject = Object.fromEntries(formData.entries())

  const remarks = formObject.remarks
  const onetimeAction = formObject.onetimeAction ? formObject.onetimeAction : 1

  if (formObject.onetimeAction == undefined) {
    formObject.onetimeAction = 1
  }

  if (
    formObject.remarks == undefined ||
    formObject.remarks.trim().length == 0
  ) {
    alert(
      'There were errors in your form: Please include the reason for the request'
    )
  } else {
    const url = `${
      import.meta.env.VITE_API_URL
    }/projects/${projectId}/duplication/request`

    await axios.post(url, { projectId, remarks, onetimeAction })
    router.push({ path: `/myprojects/${projectId}/overview` })
  }
}
</script>

<template>
  <header>Project: P{{ projectId }}</header>

  <RouterLink :to="`/myProjects/${projectId}/overview`">
    <button class="action-bar">Back to Project Overview</button>
  </RouterLink>

  <p>
    Please use the following form to submit a request to duplicate P{{
      projectId
    }}. After submission, a MorphoBank administrator will contact you with
    further information.
  </p>

  <form @submit.prevent="makeRequest">
    <div v-if="onetimeMedia.length > 0">
      <p>
        There are {{ onetimeMedia.length }} media licensed for onetime use in
        this project. This license means that the copyright holder has released
        the media for use in one MorphoBank project only at present. To honor
        the copyright holder's wishes MorphoBank only allows the media in
        question to exist in one project.
      </p>
      <div v-if="!userAccess">
        <p>
          As a result, this media can not be copied to the new project during
          project duplication.
        </p>
      </div>
      <div v-else>
        <div v-if="isPublished.value">
          <p>
            Because this project has already been published, the onetime use
            media can not be copied to the duplicated project.
          </p>
        </div>
        <div v-else>
          <p>
            During project duplication, the media must be moved to the new
            project or kept in the original project.
          </p>
          <p>The following media have been licensed for onetime use:</p>
          <li v-for="media in onetimeMedia" class="list-group-item">
            <RouterLink
              :to="`/myprojects/${projectId}/media/${media.media_id}`"
            >
              <button type="button">Onetime Media File</button>
            </RouterLink>
          </li>
          <p>How would you like to handle onetime use media?</p>
          <div class="list-group-item-name">
            <label class="item">
              <input
                type="radio"
                class="form-check-input"
                name="onetimeAction"
                value="100"
              />
              Move onetime use media to new project
            </label>
          </div>
          <div class="list-group-item-name">
            <label class="item">
              <input
                type="radio"
                class="form-check-input"
                name="onetimeAction"
                value="1"
                :checked="true"
              />
              Keep onetime use media in existing project
            </label>
          </div>
        </div>
      </div>
    </div>

    <label>Enter your remarks here:</label>
    <input type="text" name="remarks" />
    <button type="submit">Submit</button>
  </form>
</template>

<style scoped>
@import '@/views/project/styles.css';
</style>
