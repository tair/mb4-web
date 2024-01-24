<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useMediaCitationsStore } from '@/stores/MediaCitationsStore'
import { schema } from '@/views/project/specimens/citations/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id
const mediaId = route.params.mediaId
const citationId = route.params.citationId

const bibliographiesStore = useBibliographiesStore()
const mediaCitationsStore = useMediaCitationsStore()
const projectUsersStore = useProjectUsersStore()

const citation = computed(() => mediaCitationsStore.getCitationById(citationId))

const isLoaded = computed(
  () =>
    mediaCitationsStore.isLoaded &&
    bibliographiesStore.isLoaded &&
    projectUsersStore.isLoaded
)

onMounted(() => {
  if (!mediaCitationsStore.isLoaded) {
    mediaCitationsStore.fetchCitations(projectId, mediaId)
  }
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})

async function edit(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await mediaCitationsStore.edit(
    projectId,
    mediaId,
    citationId,
    json
  )
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to update citation')
  }
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      <b> Editing Citation for M{{ mediaId }} </b>
    </header>
    <form @submit.prevent="edit">
      <div v-for="(definition, index) in schema" :key="index" class="mb-3">
        <label for="index" class="form-label">{{ definition.label }}</label>
        <component
          :key="index"
          :is="definition.view"
          :name="index"
          :value="citation[index]"
          v-bind="definition.args"
        >
        </component>
      </div>
      <div class="btn-form-group">
        <button class="btn btn-primary" type="button" @click="$router.go(-1)">
          Cancel
        </button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  </LoadingIndicator>
</template>
