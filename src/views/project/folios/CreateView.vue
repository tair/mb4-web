<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useFoliosStore } from '@/stores/FoliosStore'
import { schema } from '@/views/project/folios/schema.js'

const route = useRoute()
const projectId = parseInt(route.params.id)

const foliosStore = useFoliosStore()

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
  isSubmitting.value = true
  
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  
  // Validate name before submission
  if (!validateName(json.name)) {
    isSubmitting.value = false
    return
  }

  const success = await foliosStore.create(projectId, json)
  isSubmitting.value = false
  
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to create folio')
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
      >
        Cancel
      </button>
      <button 
        class="btn btn-primary" 
        type="submit"
        :disabled="isSubmitting"
      >
        <span v-if="isSubmitting">Creating...</span>
        <span v-else>Create</span>
      </button>
    </div>
  </form>
</template>
