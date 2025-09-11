<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useFoliosStore } from '@/stores/FoliosStore'
import { useNotifications } from '@/composables/useNotifications'
import { NavigationPatterns, navigateBack } from '@/utils/navigationUtils.js'
import { schema } from '@/views/project/folios/schema.js'

const route = useRoute()
const projectId = parseInt(route.params.id)

const foliosStore = useFoliosStore()
const { showError, showSuccess } = useNotifications()

// Form validation state
const nameError = ref('')
const isSubmitting = ref(false)

function validateName(name) {
  if (!name || name.trim().length === 0) {
    nameError.value = 'Folio name is required'
    return false
  }
  nameError.value = ''
  return true
}

function handleNameInput(event) {
  const name = event.target.value
  validateName(name)
}

async function create(event) {
  if (isSubmitting.value) return // Prevent double submission
  
  isSubmitting.value = true
  
  try {
    const formData = new FormData(event.currentTarget)
    const json = Object.fromEntries(formData)
    
    // Validate name before submission
    if (!validateName(json.name)) {
      return
    }

    const success = await foliosStore.create(projectId, json)
    
    if (success) {
      showSuccess('Folio created successfully!')
      await navigateBack(`/myprojects/${projectId}/folios`)
    } else {
      showError('Failed to create folio')
    }
  } catch (error) {
    console.error('Error creating folio:', error)
    showError('Failed to create folio')
  } finally {
    isSubmitting.value = false
  }
}
</script>
<template>
  <header>
    <b>Create new folio</b>
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
          @input="index === 'name' ? handleNameInput : undefined"
        >
        </component>
        <!-- Show validation error for name field -->
        <div v-if="index === 'name' && nameError" class="text-danger mt-1">
          {{ nameError }}
        </div>
      </div>
    </template>
    <div class="btn-form-group">
      <button
        class="btn btn-outline-primary"
        type="button"
        @click="$router.go(-1)"
        :disabled="isSubmitting"
      >
        Cancel
      </button>
      <button 
        class="btn btn-primary" 
        type="submit"
        :disabled="isSubmitting"
      >
        <span v-if="isSubmitting">
          <i class="fa fa-spinner fa-spin me-2"></i>
          Creating...
        </span>
        <span v-else>Create</span>
      </button>
    </div>
  </form>
</template>
