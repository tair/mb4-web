<script setup>
import axios from 'axios'
import router from '@/router'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import Alert from '@/components/main/Alert.vue'

const route = useRoute()
const projectId = route.params.id
let onetimeMedia = ref([])
let isPublished = ref(false)
let userAccess = ref(false)
let isLoaded = ref(false)

// Validation messages
const validationMessages = ref({
  error: '',
})

onMounted(async () => {
  try {
    const url = `${
      import.meta.env.VITE_API_URL
    }/projects/${projectId}/duplication/request`
    const response = await axios.get(url)

    onetimeMedia.value = response.data.oneTimeMedia
    isPublished.value = response.data.projectPublished
    userAccess.value = response.data.hasAccess
  } catch (error) {
    console.error('Failed to load duplication request data:', error)
    validationMessages.value.error = 'Failed to load project data. Please try again.'
  } finally {
    isLoaded.value = true
  }
})

async function makeRequest(event) {
  // Clear previous error messages
  validationMessages.value.error = ''
  
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
    validationMessages.value.error = 
      'There were errors in your form: Please include the reason for the request'
    return
  }

  try {
    const url = `${
      import.meta.env.VITE_API_URL
    }/projects/${projectId}/duplication/request`

    await axios.post(url, { projectId, remarks, onetimeAction })
    router.push({ path: `/myprojects/${projectId}/overview` })
  } catch (error) {
    console.error('Failed to submit duplication request:', error)
    validationMessages.value.error = 'Failed to submit request. Please try again.'
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0">Project Duplication Request</h2>
      <span class="badge bg-secondary">Project P{{ projectId }}</span>
    </div>

    <RouterLink
      :to="`/myprojects/${projectId}/overview`"
      class="mb-3 d-inline-block"
    >
      <i class="fa fa-arrow-left"></i>
      Back to Project Overview
    </RouterLink>

    <p class="mb-4">
      Please use the following form to submit a request to duplicate P{{
        projectId
      }}. After submission, a MorphoBank administrator will contact you with
      further information.
    </p>

    <form @submit.prevent="makeRequest">
      <div class="row setup-content">
        <!-- Onetime Media Section -->
        <div v-if="onetimeMedia.length > 0" class="form-group">
          <div class="alert alert-info">
            <h5 class="alert-heading">Onetime Media Notice</h5>
            <p class="mb-3">
              There are {{ onetimeMedia.length }} media licensed for onetime use in
              this project. This license means that the copyright holder has released
              the media for use in one MorphoBank project only at present. To honor
              the copyright holder's wishes MorphoBank only allows the media in
              question to exist in one project.
            </p>
            
            <div v-if="!userAccess">
              <p class="mb-0">
                As a result, this media can not be copied to the new project during
                project duplication.
              </p>
            </div>
            
            <div v-else>
              <div v-if="isPublished">
                <p class="mb-0">
                  Because this project has already been published, the onetime use
                  media can not be copied to the duplicated project.
                </p>
              </div>
              
              <div v-else>
                <p class="mb-2">
                  During project duplication, the media must be moved to the new
                  project or kept in the original project.
                </p>
                
                <h6>Media Files with Onetime License:</h6>
                <ul class="list-group mb-3">
                  <li v-for="media in onetimeMedia" :key="media.media_id" class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Media File {{ media.media_id }}</span>
                    <RouterLink
                      :to="`/myprojects/${projectId}/media/${media.media_id}`"
                      class="btn btn-outline-primary btn-sm"
                    >
                      View Media
                    </RouterLink>
                  </li>
                </ul>
                
                <h6>How would you like to handle onetime use media?</h6>
                <div class="form-check mb-2">
                  <input
                    type="radio"
                    class="form-check-input"
                    name="onetimeAction"
                    value="100"
                    id="moveMedia"
                  />
                  <label class="form-check-label" for="moveMedia">
                    Move onetime use media to new project
                  </label>
                </div>
                <div class="form-check">
                  <input
                    type="radio"
                    class="form-check-input"
                    name="onetimeAction"
                    value="1"
                    id="keepMedia"
                    checked
                  />
                  <label class="form-check-label" for="keepMedia">
                    Keep onetime use media in existing project
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Remarks Section -->
        <div class="form-group">
          <label for="remarks" class="form-label">
            Reason for Request <span class="text-danger">*</span>
          </label>
          <textarea
            id="remarks"
            name="remarks"
            class="form-control"
            rows="4"
            placeholder="Please provide a detailed reason for your duplication request..."
            required
          ></textarea>
          <div class="form-text">
            Please include the purpose of the duplication and any specific requirements.
          </div>
        </div>

        <!-- Alert for validation messages -->
        <Alert
          :message="validationMessages"
          messageName="error"
          alertType="danger"
        />

        <!-- Submit buttons -->
        <div class="btn-form-group">
          <RouterLink :to="`/myprojects/${projectId}/overview`">
            <button class="btn btn-outline-primary" type="button">
              Cancel
            </button>
          </RouterLink>
          <button class="btn btn-primary" type="submit">
            Submit Request
          </button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>

<style scoped>
@import '@/views/project/styles.css';
</style>
