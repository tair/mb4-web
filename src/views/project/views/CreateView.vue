<script setup>
import { useRoute } from 'vue-router'
import router from '@/router'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useNotifications } from '@/composables/useNotifications'
import { schema } from '@/views/project/views/schema.js'

const route = useRoute()
const projectId = route.params.id

const mediaViewsStore = useMediaViewsStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()

async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)

  // Get the view names and split by semicolon
  const viewNames = json.name
    .split(';')
    .map((name) => name.trim())
    .filter((name) => name)

  if (viewNames.length === 0) {
    showWarning('Please enter at least one view name', 'View Name Required')
    return
  }

  // Send the split names as an array to create multiple views
  const dataToSend = {
    ...json,
    names: viewNames  // Use 'names' (plural) to send array of view names
  }
  delete dataToSend.name  // Remove the original unsplit name field

  const result = await mediaViewsStore.create(projectId, dataToSend)
  if (result.success) {
    const message = viewNames.length > 1 
      ? `${viewNames.length} media views created successfully` 
      : 'Media view created successfully'
    showSuccess(message, 'View Created')
    router.go(-1)
  } else {
    showError(result.error || 'Failed to create media view', 'Creation Failed')
  }
}
</script>
<template>
  <header>
    <b>Create new</b>
  </header>
  <form @submit.prevent="create">
    <template v-for="(definition, index) in schema" :key="index">
      <div v-if="!definition.existed" class="form-group">
        <label for="index" class="form-label">
          {{ definition.label }}
          <span v-if="definition.allowMultiple" class="multiple-values-hint">
            (Multiple values can be entered, separated by a semicolon)
          </span>
        </label>
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
.multiple-values-hint {
  font-size: 0.8em;
  color: #666;
  font-style: italic;
}

.alert {
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid transparent;
  border-radius: 4px;
}
</style>
