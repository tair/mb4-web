<script setup>
import router from '@/router'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useNotifications } from '@/composables/useNotifications'
import { apiService } from '@/services/apiService.js'

const route = useRoute()
const projectId = route.params.id
const partitionId = route.params.partitionId
const isLoaded = ref(false)

const projectsStore = useProjectsStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()
const project = ref(null)

let partition = null
let taxa = ref([])
let characters = ref([])
let onetimeMedia = ref([])
let media = ref([])
let labels = ref([])
let documents = ref(0)
let bibliographicReferences = ref(0)
let views = ref([])
let specimens = ref([])

onMounted(async () => {
  if (!projectsStore.isLoaded) {
    await projectsStore.fetchProjects()
  }
  project.value = projectsStore.getProjectById(projectId)

  const response = await apiService.get(`/projects/${projectId}/publish/partition/${partitionId}`)
  const responseData = await response.json()
  partition = responseData.partition
  taxa.value = responseData.taxaCount
  characters.value = responseData.characterCount
  onetimeMedia.value = responseData.onetimeMedia
  media.value = responseData.mediaCount
  labels.value = responseData.labelCount
  documents.value = responseData.documentCount
  bibliographicReferences.value = responseData.bibliographicReferenceCount
  views.value = responseData.viewCount
  specimens.value = responseData.specimenCount

  isLoaded.value = true
})

async function publishPartition(event) {
  const formData = new FormData(event.target)
  const formObject = Object.fromEntries(formData.entries())

  const onetimeAction = formObject.onetimeAction || 1

  if (!taxa.value || !characters.value) {
    showWarning(
      'You cannot publish this partition because it is empty. Please add characters and taxa and try again.',
      'Empty Partition'
    )
    return
  }

  const url = apiService.buildUrl(`/projects/${projectId}/publish/partition/${partitionId}`)
  const response = await apiService.post(url, { onetimeAction })

  if (response.ok) {
    showInfo('Publishing Partition', 'Publishing')
    router.push({ path: `/myprojects/${projectId}/overview` })
  } else {
    showError('Could not publish Partition', 'Publish Failed')
  }
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="action-buttons-top">
      <RouterLink :to="`/myprojects/${projectId}/publish/partition`">
        <button type="button" class="btn btn-outline-primary">Go Back</button>
      </RouterLink>
    </div>

    <h1>Partition: {{ partition.name }}</h1>
    <p>
      This partition contains {{ characters }} characters, {{ taxa }} taxa,
      {{ media }} media of which {{ onetimeMedia.length }} are released for
      onetime use, {{ labels }} media labels, {{ specimens }} specimens,
      {{ views }} views, {{ documents }} documents that are linked to media
      explaining copyright and {{ bibliographicReferences }} bibliographic
      references To edit these, go to the Matrix Editor and make changes
    </p>
    <p>
      When you publish this partition, a new project will be created with the
      characters and taxa listed above. Any matrices, media, copyright documents
      and bibliographic citations associated with the characters and taxa will
      be copied into the new project. The new project will be left in an
      unpublished state to allow you time to review prior to publication.
    </p>
    <p>
      Note that the new project you create here will be separate from P{{
        projectId
      }}
      ({{ project.name }}) and create only the subset of information described
      above. Changes made to the newly created project will not affect P{{
        projectId
      }}
      or vice versa.
    </p>
    <p>
      Note that publishing a partition may consume significant server resources,
      particularly storage. Please be considerate and only publish when you need
      to.
    </p>

    <div>
      <form @submit.prevent="publishPartition">
        <div v-if="onetimeMedia.length">
          <p>
            This partition contains {{ onetimeMedia.length }} media released for
            onetime use. Due to this license, these media may not be usable in a
            derivative project. You must either change the media reuse license,
            or choose to keep the media in the current project, the new parition
            based project or both (bypassing one-time use).
          </p>
          <ul class="media-list">
            <li v-for="media in onetimeMedia" :key="media">
              <RouterLink :to="`/myprojects/${projectId}/media/${media}`">
                M{{ media }}
              </RouterLink>
            </li>
          </ul>
          <p>How would you like to handle onetime use media?</p>
          <div class="radio-options">
            <div class="form-check">
              <input
                type="radio"
                class="form-check-input"
                name="onetimeAction"
                id="onetimeAction1"
                value="1"
                :checked="true"
              />
              <label class="form-check-label" for="onetimeAction1">
                Keep onetime use media in existing project.
              </label>
            </div>
            <div class="form-check">
              <input
                type="radio"
                class="form-check-input"
                name="onetimeAction"
                id="onetimeAction100"
                value="100"
              />
              <label class="form-check-label" for="onetimeAction100">
                Move onetime use media to new project.
              </label>
            </div>
            <div class="form-check">
              <input
                type="radio"
                class="form-check-input"
                name="onetimeAction"
                id="onetimeActionBoth"
                value="1"
              />
              <label class="form-check-label" for="onetimeActionBoth">
                Use one-time use media in both existing project and new partition
                based project.
              </label>
            </div>
          </div>
        </div>
        <div class="btn-form-group">
          <RouterLink :to="`/myprojects/${projectId}/overview`">
            <button type="button" class="btn btn-outline-primary">Cancel</button>
          </RouterLink>
          <button type="submit" class="btn btn-primary">Publish</button>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
.action-buttons-top {
  margin-bottom: 20px;
}

.action-buttons-top .btn {
  margin-bottom: 10px;
}

.media-list {
  list-style: none;
  padding: 0;
  margin: 15px 0;
}

.media-list li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.media-list li:last-child {
  border-bottom: none;
}

.media-list a {
  color: #007bff;
  text-decoration: none;
}

.media-list a:hover {
  text-decoration: underline;
}

.radio-options {
  margin: 20px 0;
}

.form-check {
  margin-bottom: 12px;
  padding-left: 25px;
}

.form-check-input {
  margin-top: 0.25rem;
  margin-left: -25px;
  cursor: pointer;
}

.form-check-label {
  cursor: pointer;
  margin-left: 5px;
  display: inline-block;
}

.btn-form-group {
  display: flex;
  gap: 10px;
  margin-top: 30px;
  margin-bottom: 20px;
}

.btn-form-group .btn {
  min-width: 100px;
}
</style>
