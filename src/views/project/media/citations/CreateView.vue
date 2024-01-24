<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useMediaCitationsStore } from '@/stores/MediaCitationsStore'
import { schema } from '@/views/project/specimens/citations/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id
const mediaId = route.params.mediaId

const bibliographiesStore = useBibliographiesStore()
const mediaCitationsStore = useMediaCitationsStore()

const isLoaded = computed(
  () => mediaCitationsStore.isLoaded && bibliographiesStore.isLoaded
)

onMounted(() => {
  if (!mediaCitationsStore.isLoaded) {
    mediaCitationsStore.fetchCitations(projectId, mediaId)
  }
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
})

async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await mediaCitationsStore.create(projectId, mediaId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to create citations')
  }
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      <b> Create new citation for M {{ mediaId }} </b>
    </header>
    <form @submit.prevent="create">
      <template v-for="(definition, index) in schema" :key="index">
        <div v-if="!definition.existed" class="form-group">
          <label for="index" class="form-label">{{ definition.label }}</label>
          <component
            :key="index"
            :is="definition.view"
            :name="index"
            v-bind="definition.args"
          >
          </component>
        </div>
      </template>
      <div class="btn-form-group">
        <button class="btn btn-primary" type="button" @click="$router.go(-1)">
          Cancel
        </button>
        <button class="btn btn-primary" type="submit">Create</button>
      </div>
    </form>
  </LoadingIndicator>
</template>
