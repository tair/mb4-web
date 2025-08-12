<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import router from '@/router'
import { schema } from '@/views/project/bibliographies/schema.js'
import {
  convertAuthors,
  validateBibliographyForm,
} from '@/views/project/bibliographies/utils.js'

const route = useRoute()
const projectId = route.params.id

const bibliographiesStore = useBibliographiesStore()
const errors = ref({})

// Filter out read-only system fields (owner, timestamps) that shouldn't appear on create forms
const createSchema = computed(() => {
  const filtered = {}
  for (const [key, definition] of Object.entries(schema)) {
    if (!definition.readOnlySystemField) {
      filtered[key] = definition
    }
  }
  return filtered
})

async function createReference(event) {
  const formData = new FormData(event.currentTarget)

  // Validate the form using the utility function
  const validation = validateBibliographyForm(formData)
  if (!validation.isValid) {
    errors.value = validation.errors
    return
  }

  // Clear any previous errors
  errors.value = {}

  const authorFields = ['authors', 'secondary_authors', 'editors']
  const authors = Object.fromEntries(
    authorFields.map((field) => [field, convertAuthors(formData, field)])
  )
  const json = { ...Object.fromEntries(formData), ...authors }
  const success = await bibliographiesStore.create(projectId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to create bibliography')
  }
}
</script>
<template>
  <header>
    <b>Create new bibliography </b>
  </header>
  <form @submit.prevent="createReference">
    <div v-for="(definition, index) in createSchema" :key="index" class="mb-3">
      <label for="index" class="form-label">
        {{ definition.label }}
        <span v-if="definition.required" class="required">Required</span>
      </label>
      <component
        :key="index"
        :is="definition.view"
        :name="index"
        :class="{ 'is-invalid': errors[index] }"
        v-bind="definition.args"
      >
      </component>
      <div v-if="errors[index]" class="invalid-feedback">
        {{ errors[index] }}
      </div>
    </div>
    <div class="btn-form-group">
      <button
        class="btn btn-outline-primary"
        type="button"
        @click="$router.go(-1)"
      >
        Cancel
      </button>
      <button class="btn btn-primary" type="submit">Create</button>
    </div>
  </form>
</template>
<style scoped>
@import '@/views/project/styles.css';

.required {
  color: #dc3545;
  font-weight: 500;
  margin-left: 4px;
}

.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #dc3545;
}
</style>
