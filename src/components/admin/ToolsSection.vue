<script setup>
import { ref, computed } from 'vue'
import { useHomePageAdminStore } from '@/stores/HomePageAdminStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'
import { apiService } from '@/services/apiService.js'

const store = useHomePageAdminStore()
const { showSuccess, showError } = useNotifications()

const isEditing = ref(false)
const editingToolId = ref(null)
const formData = ref({
  title: '',
  description: '',
  link: '',
})
const imageFile = ref(null)
const imagePreview = ref(null)

const titleCharCount = computed(() => formData.value.title.length)
const titleCharRemaining = computed(() => 30 - titleCharCount.value)

function resetForm() {
  formData.value = {
    title: '',
    description: '',
    link: '',
  }
  imageFile.value = null
  imagePreview.value = null
  isEditing.value = false
  editingToolId.value = null
}

function editTool(tool) {
  isEditing.value = true
  editingToolId.value = tool.tool_id
  formData.value = {
    title: tool.title,
    description: tool.description,
    link: tool.link || '',
  }
  imagePreview.value = tool.thumbnailUrl
    ? apiService.buildUrl(tool.thumbnailUrl)
    : null
}

function handleImageChange(event) {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

async function handleSubmit() {
  if (!formData.value.title || !formData.value.description) {
    showError('Title and description are required')
    return
  }

  if (formData.value.title.length > 30) {
    showError('Title must not exceed 30 characters')
    return
  }

  try {
    const data = new FormData()
    data.append('title', formData.value.title)
    data.append('description', formData.value.description)
    if (formData.value.link) {
      data.append('link', formData.value.link)
    }
    if (imageFile.value) {
      data.append('image', imageFile.value)
    }

    if (isEditing.value && editingToolId.value) {
      await store.updateTool(editingToolId.value, data)
      showSuccess('Tool updated successfully')
    } else {
      if (!imageFile.value) {
        showError('Image is required for new tools')
        return
      }
      await store.createTool(data)
      showSuccess('Tool created successfully')
    }
    resetForm()
  } catch (error) {
    showError(error.message || 'Failed to save tool')
  }
}

async function handleDelete(tool) {
  if (!confirm(`Are you sure you want to delete "${tool.title}"?`)) {
    return
  }

  try {
    await store.deleteTool(tool.tool_id)
    showSuccess('Tool deleted successfully')
  } catch (error) {
    showError(error.message || 'Failed to delete tool')
  }
}

function getImageUrl(tool) {
  if (tool.thumbnailUrl) {
    return apiService.buildUrl(tool.thumbnailUrl)
  }
  return '/images/image_not_found.png'
}
</script>

<template>
  <div class="tools-section">
    <!-- Form -->
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="card-title mb-0 text-white">
          <i class="fa fa-plus me-2"></i>
          {{ isEditing ? 'Edit Tool' : 'Add New Tool' }}
        </h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="row">
            <div class="col-md-4">
              <div class="mb-3">
                <label class="form-label">
                  <strong>Image</strong>
                  <span v-if="!isEditing" class="text-danger">*</span>
                </label>
                <input
                  type="file"
                  class="form-control"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  @change="handleImageChange"
                />
                <small class="text-muted">
                  JPEG, PNG, GIF, WebP. Recommended: 400x400px
                </small>
                <div v-if="imagePreview" class="mt-2">
                  <img
                    :src="imagePreview"
                    alt="Preview"
                    class="img-thumbnail"
                    style="max-width: 120px; max-height: 120px"
                  />
                </div>
              </div>
            </div>

            <div class="col-md-8">
              <div class="mb-3">
                <label class="form-label">
                  <strong>Title</strong>
                  <span class="text-danger">*</span>
                </label>
                <input
                  v-model="formData.title"
                  type="text"
                  class="form-control"
                  maxlength="30"
                  placeholder="Brief title"
                  required
                />
                <small
                  class="text-muted"
                  :class="{ 'text-danger': titleCharRemaining < 0 }"
                >
                  {{ titleCharRemaining }} characters remaining (max 30)
                </small>
              </div>

              <div class="mb-3">
                <label class="form-label">
                  <strong>Description</strong>
                  <span class="text-danger">*</span>
                </label>
                <textarea
                  v-model="formData.description"
                  class="form-control"
                  rows="3"
                  placeholder="Description of the tool"
                  required
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label">
                  <strong>Link</strong>
                </label>
                <input
                  v-model="formData.link"
                  type="url"
                  class="form-control"
                  placeholder="https://..."
                />
                <small class="text-muted">
                  Optional. URL to more information.
                </small>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2">
            <button
              v-if="isEditing"
              type="button"
              class="btn btn-secondary"
              @click="resetForm"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="store.isSaving"
            >
              <span v-if="store.isSaving">
                <span
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Saving...
              </span>
              <span v-else>
                {{ isEditing ? 'Update Tool' : 'Add Tool' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tools List -->
    <div class="card">
      <div class="card-header">
        <h5 class="card-title mb-0 text-white">
          <i class="fa fa-list me-2"></i>
          Existing Tools ({{ store.tools.length }})
        </h5>
      </div>
      <div class="card-body">
        <div v-if="store.tools.length === 0" class="text-center text-muted py-4">
          <i class="fa fa-wrench fa-3x mb-3"></i>
          <p>No tools have been added yet.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th style="width: 80px">Image</th>
                <th>Title</th>
                <th>Description</th>
                <th>Link</th>
                <th style="width: 120px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tool in store.tools" :key="tool.tool_id">
                <td>
                  <img
                    :src="getImageUrl(tool)"
                    :alt="tool.title"
                    class="img-thumbnail"
                    style="width: 60px; height: 60px; object-fit: cover"
                    @error="$event.target.src = '/images/image_not_found.png'"
                  />
                </td>
                <td>
                  <strong>{{ tool.title }}</strong>
                </td>
                <td>
                  <span class="description-text">
                    {{
                      tool.description.length > 100
                        ? tool.description.substring(0, 100) + '...'
                        : tool.description
                    }}
                  </span>
                </td>
                <td>
                  <a
                    v-if="tool.link"
                    :href="tool.link"
                    target="_blank"
                    class="text-truncate d-inline-block"
                    style="max-width: 150px"
                  >
                    {{ tool.link }}
                  </a>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <button
                    class="btn btn-sm btn-outline-primary me-1"
                    title="Edit"
                    @click="editTool(tool)"
                  >
                    <i class="fa fa-edit"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    title="Delete"
                    @click="handleDelete(tool)"
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.description-text {
  font-size: 0.875rem;
  color: #666;
}

.img-thumbnail {
  border-radius: 4px;
}
</style>

