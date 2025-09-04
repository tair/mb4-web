<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useNotifications } from '@/composables/useNotifications'
import BibliographyItem from '@/components/project/BibliographyItem.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import router from '@/router'
import { schema } from '@/views/project/bibliographies/schema.js'
import {
  convertAuthors,
  validateBibliographyForm,
} from '@/views/project/bibliographies/utils.js'

const route = useRoute()
const projectId = parseInt(route.params.id)
const referenceId = parseInt(route.params.referenceId)

const bibliographiesStore = useBibliographiesStore()
const projectUsersStore = useProjectUsersStore()
const { showError, showSuccess } = useNotifications()
const reference = computed(() =>
  bibliographiesStore.getReferenceById(referenceId)
)

const isLoaded = computed(
  () => bibliographiesStore.isLoaded && projectUsersStore.isLoaded
)

const errors = ref({})
const isSaving = ref(false)

onMounted(() => {
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})

async function editReference(event) {
  if (isSaving.value) return // Prevent double submission
  
  const formData = new FormData(event.currentTarget)

  // Validate the form using the utility function
  const validation = validateBibliographyForm(formData)
  if (!validation.isValid) {
    errors.value = validation.errors
    return
  }

  // Clear any previous errors
  errors.value = {}
  isSaving.value = true

  try {
    const authorFields = ['authors', 'secondary_authors', 'editors']
    const authors = Object.fromEntries(
      authorFields.map((field) => [field, convertAuthors(formData, field)])
    )
    const json = { ...Object.fromEntries(formData), ...authors }
    const success = await bibliographiesStore.edit(projectId, referenceId, json)
    
    if (success) {
      showSuccess('Bibliography updated successfully!')
      router.go(-1)
    } else {
      showError('Failed to update bibliography')
    }
  } catch (error) {
    console.error('Error updating bibliography:', error)
    showError('Failed to update bibliography. Please try again.')
  } finally {
    isSaving.value = false
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
        <label for="index" class="form-label">
          {{ definition.label }}
          <span v-if="definition.required" class="required">Required</span>
        </label>
        <component
          :key="index"
          :is="definition.view"
          :name="index"
          :value="reference[index]"
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
          :disabled="isSaving"
        >
          Cancel
        </button>
        <button 
          class="btn btn-primary" 
          type="submit"
          :disabled="isSaving"
        >
          <span v-if="isSaving">
            <i class="fa fa-spinner fa-spin me-2"></i>
            Saving...
          </span>
          <span v-else>Save</span>
        </button>
      </div>
    </form>
  </LoadingIndicator>
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
