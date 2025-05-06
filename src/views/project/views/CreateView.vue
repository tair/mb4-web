<script setup>
import { useRoute } from 'vue-router'
import router from '@/router'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { schema } from '@/views/project/views/schema.js'
import Alert from '@/components/main/Alert.vue'
import { reactive } from 'vue'

const route = useRoute()
const projectId = route.params.id

const mediaViewsStore = useMediaViewsStore()
const error = reactive({
  create: null,
})

async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)

  // Get the view names and split by comma
  const viewNames = json.name
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name)

  if (viewNames.length === 0) {
    error.create = 'Please enter at least one view name'
    return
  }

  const result = await mediaViewsStore.create(projectId, json)
  if (result.success) {
    router.go(-1)
  } else {
    error.create = result.error || 'Failed to create media view'
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
            (Multiple values can be entered, separated by commas)
          </span>
        </label>
        <component
          :key="index"
          :is="definition.view"
          :name="index"
          v-bind="definition.args"
        >
        </component>
        <Alert :message="error" messageName="create" alertType="danger"></Alert>
      </div>
    </template>
    <div class="btn-form-group">
      <button
        class="btn btn-primary btn-white"
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
