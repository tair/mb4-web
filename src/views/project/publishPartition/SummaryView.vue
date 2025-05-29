<script setup>
import axios from 'axios'
import router from '@/router'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { useProjectsStore } from '@/stores/ProjectsStore'

const route = useRoute()
const projectId = route.params.id
const partitionId = route.params.partitionId
const isLoaded = ref(false)

const projectsStore = useProjectsStore()
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

  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/publish/partition/${partitionId}`

  const response = await axios.get(url)

  partition = response.data.partition
  taxa.value = response.data.taxaCount
  characters.value = response.data.characterCount
  onetimeMedia.value = response.data.onetimeMedia
  media.value = response.data.mediaCount
  labels.value = response.data.labelCount
  documents.value = response.data.documentCount
  bibliographicReferences.value = response.data.bibliographicReferenceCount
  views.value = response.data.viewCount
  specimens.value = response.data.specimenCount

  isLoaded.value = true
})

async function publishPartition(event) {
  const formData = new FormData(event.target)
  const formObject = Object.fromEntries(formData.entries())

  const onetimeAction = formObject.onetimeAction || 1

  if (!taxa.value || !characters.value) {
    alert(
      'You cannot publish this partition because it is empty. Please add characters and taxa and try again.'
    )
    return
  }

  const url = `${
    import.meta.env.VITE_API_URL
  }/projects/${projectId}/publish/partition/${partitionId}`
  const response = await axios.post(url, { onetimeAction })

  if (response.status == 200) {
    alert('Publishing Partition')
    router.push({ path: `/myprojects/${projectId}/overview` })
  } else {
    alert('Could not publish Partition')
  }
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <RouterLink :to="`/myprojects/${projectId}/publish/partition`">
      <button type="button">Go Back</button>
    </RouterLink>

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
          <li v-for="media in onetimeMedia" class="list-group-item">
            <RouterLink :to="`/myprojects/${projectId}/media/${media}`">
              M{{ media }}
            </RouterLink>
          </li>
          <p>How would you like to handle onetime use media?</p>
          <div class="list-group-item-name">
            <label class="item">
              <input
                type="radio"
                class="form-check-input"
                name="onetimeAction"
                value="1"
                :checked="true"
              />
              Keep onetime use media in existing project.
            </label>
          </div>
          <div class="list-group-item-name">
            <label class="item">
              <input
                type="radio"
                class="form-check-input"
                name="onetimeAction"
                value="100"
              />
              Move onetime use media to new project.
            </label>
          </div>
          <div class="list-group-item-name">
            <label class="item">
              <input
                type="radio"
                class="form-check-input"
                name="onetimeAction"
                value="1"
              />
              Use one-time use media in both existing project and new partition
              based project.
            </label>
          </div>
        </div>
        <RouterLink :to="`/myprojects/${projectId}/overview`">
          <button type="button" class="btn btn-outline-primary">Cancel</button>
        </RouterLink>

        <button type="submit">Publish</button>
      </form>
    </div>
  </LoadingIndicator>
</template>
