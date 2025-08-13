<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import SelectInput from '@/components/project/SelectInput.vue'

defineProps({
  name: {
    type: String,
  },
  value: {
    type: Number,
  },
})

const emit = defineEmits(['viewCreated'])

const route = useRoute()
const projectId = route.params.id

const mediaViewsStore = useMediaViewsStore()
const showCreateForm = ref(false)
const newViewName = ref('')
const isCreating = ref(false)
const createError = ref('')

const options = computed(() => {
  const views = { '- NONE - ': '' }
  for (const mediaView of mediaViewsStore.mediaViews) {
    views[mediaView.name] = mediaView.view_id
  }
  return views
})

async function createNewView() {
  if (!newViewName.value.trim()) {
    createError.value = 'View name is required'
    return
  }

  isCreating.value = true
  createError.value = ''

  try {
    // Handle comma-separated view names like the original
    const viewNames = newViewName.value
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name)

    if (viewNames.length === 0) {
      createError.value = 'Please enter at least one view name'
      return
    }

    // Use the comma-separated string as the name - the backend handles splitting
    const result = await mediaViewsStore.create(projectId, {
      name: newViewName.value.trim()
    })

    if (result.success) {
      newViewName.value = ''
      showCreateForm.value = false
      emit('viewCreated')
      // The new view(s) should now appear in the select options
    } else {
      createError.value = result.error || 'Failed to create view'
    }
  } catch (error) {
    createError.value = 'An error occurred while creating the view'
  } finally {
    isCreating.value = false
  }
}

function cancelCreate() {
  showCreateForm.value = false
  newViewName.value = ''
  createError.value = ''
}
</script>

<template>
  <div>
    <SelectInput :name="name" :value="value" :options="options" />
    
    <div class="mt-2">
      <button
        v-if="!showCreateForm"
        type="button"
        class="btn btn-sm btn-outline-secondary"
        @click="showCreateForm = true"
      >
        <i class="fa-solid fa-plus"></i> Create New View
      </button>
      
      <div v-else class="border p-3 rounded mt-2">
        <h6>Create New View</h6>
        
        <div class="mb-2">
          <label class="form-label">
            View Name
            <span class="multiple-values-hint">
              (Multiple values can be entered, separated by commas)
            </span>
          </label>
          <input
            v-model="newViewName"
            type="text"
            class="form-control"
            placeholder="Enter view names separated by commas"
            @keyup.enter="createNewView"
          />
        </div>
        
        <div v-if="createError" class="alert alert-danger py-2 mb-2">
          {{ createError }}
        </div>
        
        <div class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-sm btn-primary"
            @click="createNewView"
            :disabled="isCreating"
          >
            <i v-if="isCreating" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-check"></i>
            {{ isCreating ? 'Creating...' : 'Create' }}
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="cancelCreate"
            :disabled="isCreating"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.multiple-values-hint {
  font-size: 0.8em;
  color: #666;
  font-style: italic;
}
</style>
