<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import BibliographyItem from '@/components/project/BibliographyItem.vue'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import router from '@/router'
import { schema } from '@/views/project/bibliographies/schema.js'
import { convertAuthors } from '@/views/project/bibliographies/utils.js'

const route = useRoute()
const projectId = route.params.id
const referenceId = route.params.referenceId

const bibliographiesStore = useBibliographiesStore()
const reference = computed(() =>
  bibliographiesStore.getReferenceById(referenceId)
)

onMounted(() => {
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
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
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="!bibliographiesStore.isLoaded"
    :errorMessage="null"
    basePath="myprojects"
    itemName="bibliography"
  >
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
        <button class="btn btn-primary" type="button" @click="$router.go(-1)">
          Cancel
        </button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  </ProjectContainerComp>
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
