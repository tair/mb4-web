<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import BibliographyItem from '@/components/project/BibliographyItem.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import router from '@/router'
import { schema } from '@/views/project/bibliographies/schema.js'
import { convertAuthors } from '@/views/project/bibliographies/utils.js'

const route = useRoute()
const projectId = parseInt(route.params.id)
const referenceId = parseInt(route.params.referenceId)

const bibliographiesStore = useBibliographiesStore()
const projectUsersStore = useProjectUsersStore()
const reference = computed(() =>
  bibliographiesStore.getReferenceById(referenceId)
)

const isLoaded = computed(() => 
  bibliographiesStore.isLoaded && projectUsersStore.isLoaded
)

onMounted(() => {
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})

async function editReference(event) {
  const formData = new FormData(event.currentTarget)
  const authorFields = ['authors', 'secondary_authors', 'editors']
  const authors = Object.fromEntries(
    authorFields.map((field) => [field, convertAuthors(formData, field)])
  )
  const json = { ...Object.fromEntries(formData), ...authors }
  const success = await bibliographiesStore.edit(projectId, referenceId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to update bibliography')
  }
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      <b>Editing: </b>
      <BibliographyItem :bibliography="reference" />
    </header>
    <form @submit.prevent="editReference">
      <div v-for="(definition, index) in schema" :key="index" class="mb-3">
        <label for="index" class="form-label">{{ definition.label }}</label>
        <component
          :key="index"
          :is="definition.view"
          :name="index"
          :value="reference[index]"
          v-bind="definition.args"
        >
        </component>
      </div>
      <div class="btn-form-group">
        <button
          class="btn btn-outline-primary"
          type="button"
          @click="$router.go(-1)"
        >
          Cancel
        </button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
