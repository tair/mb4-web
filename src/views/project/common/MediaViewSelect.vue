<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useNotifications } from '@/composables/useNotifications'
import SelectInput from '@/components/project/SelectInput.vue'

const props = defineProps({
  name: {
    type: String,
  },
  value: {
    type: Number,
  },
  disabled: {
    type: Boolean,
  },
})

const emit = defineEmits(['change'])

const route = useRoute()
const projectId = route.params.id

const mediaViewsStore = useMediaViewsStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()

// Inline creation state
const showCreateForm = ref(false)
const isCreating = ref(false)
const newViewName = ref('')

const currentValue = ref(props.value)

// Watch for prop changes
watch(() => props.value, (newValue) => {
  currentValue.value = newValue
})

// Watch for internal value changes and emit
watch(currentValue, (newValue) => {
  emit('change', newValue)
})

const options = computed(() => {
  const views = { '- NONE - ': '' }
  for (const mediaView of mediaViewsStore.mediaViews) {
    views[mediaView.name] = mediaView.view_id
  }
  return views
})

function handleSelectChange(event) {
  currentValue.value = event.target.value ? parseInt(event.target.value) : null
}

function toggleCreateForm() {
  showCreateForm.value = !showCreateForm.value
  if (!showCreateForm.value) {
    newViewName.value = ''
  }
}

async function createView() {
  if (!newViewName.value.trim()) {
    showWarning('Please enter a view name', 'View Name Required')
    return
  }

  isCreating.value = true
  
  try {
    const result = await mediaViewsStore.create(projectId, { name: newViewName.value.trim() })
    
    if (result.success) {
      // Find the newly created view and select it
      const newView = mediaViewsStore.mediaViews.find(view => view.name === newViewName.value.trim())
      if (newView) {
        currentValue.value = newView.view_id
      }
      
      showCreateForm.value = false
      newViewName.value = ''
    } else {
      showError(result.error || 'Failed to create media view', 'Creation Failed')
    }
  } catch (error) {
    console.error('Error creating media view:', error)
    showError('Failed to create media view', 'Creation Error')
  } finally {
    isCreating.value = false
  }
}

function cancelCreate() {
  showCreateForm.value = false
  newViewName.value = ''
}
</script>
<template>
  <div class="media-view-select-with-create">
    <!-- Main select input with add button -->
    <div class="d-flex align-items-center gap-2">
      <div class="flex-grow-1">
        <SelectInput 
          :name="name" 
          :value="currentValue" 
          :options="options" 
          :disabled="disabled"
          @change="handleSelectChange"
        />
      </div>
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm"
        @click="toggleCreateForm"
        :disabled="disabled"
      >
        <i class="fa-solid fa-plus"></i>
        {{ showCreateForm ? 'Cancel' : 'New' }}
      </button>
    </div>

    <!-- Inline create form -->
    <div v-if="showCreateForm" class="create-form mt-3 p-3 border rounded bg-light">
      <h6 class="mb-3">Create New View</h6>
      
      <div class="form-group mb-3">
        <label class="form-label">View Name <span class="text-danger">*</span></label>
        <input 
          type="text"
          class="form-control"
          v-model="newViewName"
          placeholder="Enter view name"
        />
        <small class="form-text text-muted">
          Multiple view names can be entered, separated by commas
        </small>
      </div>

      <div class="d-flex gap-2">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          @click="createView"
          :disabled="isCreating || !newViewName.trim()"
        >
          <i v-if="isCreating" class="fa-solid fa-spinner fa-spin me-1"></i>
          {{ isCreating ? 'Creating...' : 'Create View' }}
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          @click="cancelCreate"
          :disabled="isCreating"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-view-select-with-create {
  position: relative;
}

.create-form {
  border: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.text-danger {
  color: #dc3545 !important;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.form-text {
  font-size: 0.875em;
  color: #6c757d;
}
</style>
