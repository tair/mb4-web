<script setup>
import { useRoute } from 'vue-router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import router from '@/router'
import { schema } from '@/views/project/bibliographies/schema.js'
import { convertAuthors } from '@/views/project/bibliographies/utils.js'

const route = useRoute()
const projectId = route.params.id

const bibliographiesStore = useBibliographiesStore()

async function createReference(event) {
  const formData = new FormData(event.currentTarget)
  const authorFields = ['authors', 'secondary_authors', 'editors']
  const authors = Object.fromEntries(
    authorFields.map((field) => [field, convertAuthors(formData, field)])
  )
  const json = { ...Object.fromEntries(formData), ...authors }
  const success = await bibliographiesStore.create(projectId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to update bibliography')
  }
}
</script>
<template>
  <header>
    <b>Create new bibliography </b>
  </header>
  <form @submit.prevent="createReference">
    <div v-for="(definition, index) in schema" :key="index" class="mb-3">
      <label for="index" class="form-label">{{ definition.label }}</label>
      <component
        :key="index"
        :is="definition.view"
        :name="index"
        v-bind="definition.args"
      >
      </component>
    </div>
    <div class="btn-form-group">
      <button class="btn btn-outline-primary" type="button" @click="$router.go(-1)">
        Cancel
      </button>
      <button class="btn btn-primary" type="submit">Create</button>
    </div>
  </form>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
