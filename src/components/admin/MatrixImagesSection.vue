<script setup>
import { ref } from 'vue'
import { useHomePageAdminStore } from '@/stores/HomePageAdminStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'
import { apiService } from '@/services/apiService.js'

const store = useHomePageAdminStore()
const { showSuccess, showError } = useNotifications()

const selectedProjectId = ref('')
const imageFile = ref(null)
const imagePreview = ref(null)

function resetForm() {
  selectedProjectId.value = ''
  imageFile.value = null
  imagePreview.value = null
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
  if (!selectedProjectId.value) {
    showError('Please select a project')
    return
  }

  if (!imageFile.value) {
    showError('Please select an image')
    return
  }

  try {
    const data = new FormData()
    data.append('projectId', selectedProjectId.value)
    data.append('image', imageFile.value)

    await store.createMatrixImage(data)
    showSuccess('Matrix image created successfully')
    resetForm()
  } catch (error) {
    showError(error.message || 'Failed to create matrix image')
  }
}

async function handleDelete(matrixImage) {
  const projectName = matrixImage.projectName || `Project ${matrixImage.project_id}`
  if (!confirm(`Are you sure you want to delete the matrix image for "${projectName}"?`)) {
    return
  }

  try {
    await store.deleteMatrixImage(matrixImage.image_id)
    showSuccess('Matrix image deleted successfully')
  } catch (error) {
    showError(error.message || 'Failed to delete matrix image')
  }
}

function getImageUrl(matrixImage) {
  if (matrixImage.thumbnailUrl) {
    return apiService.buildUrl(matrixImage.thumbnailUrl)
  }
  return '/images/image_not_found.png'
}

function getLargeImageUrl(matrixImage) {
  if (matrixImage.largeUrl) {
    return apiService.buildUrl(matrixImage.largeUrl)
  }
  return getImageUrl(matrixImage)
}
</script>

<template>
  <div class="matrix-images-section">
    <!-- Info -->
    <div class="alert alert-info mb-4">
      <i class="fa fa-info-circle me-2"></i>
      <strong>Matrix Images</strong> are large hero/banner images displayed at
      the top of the homepage. One image is randomly selected per page load.
      Recommended size: 535x225 pixels.
    </div>

    <!-- Form -->
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="card-title mb-0 text-white">
          <i class="fa fa-plus me-2"></i>
          Add New Matrix Image
        </h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">
                  <strong>Project</strong>
                  <span class="text-danger">*</span>
                </label>
                <select
                  v-model="selectedProjectId"
                  class="form-select"
                  required
                >
                  <option value="">Select a project...</option>
                  <option
                    v-for="project in store.publishedProjects"
                    :key="project.project_id"
                    :value="project.project_id"
                  >
                    P{{ project.project_id }}: {{ project.name.substring(0, 60) }}{{ project.name.length > 60 ? '...' : '' }}
                  </option>
                </select>
                <small class="text-muted">
                  Only published projects can be linked.
                </small>
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">
                  <strong>Image</strong>
                  <span class="text-danger">*</span>
                </label>
                <input
                  type="file"
                  class="form-control"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  @change="handleImageChange"
                  required
                />
                <small class="text-muted">
                  Ideal size: 535x225 pixels. JPEG, PNG, GIF, WebP.
                </small>
              </div>
            </div>
          </div>

          <div v-if="imagePreview" class="mb-3">
            <label class="form-label">Preview:</label>
            <div class="preview-container">
              <img :src="imagePreview" alt="Preview" class="img-fluid" />
            </div>
          </div>

          <div class="d-flex justify-content-end">
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
              <span v-else>Add Matrix Image</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Matrix Images Grid -->
    <div class="card">
      <div class="card-header">
        <h5 class="card-title mb-0 text-white">
          <i class="fa fa-images me-2"></i>
          Existing Matrix Images ({{ store.matrixImages.length }})
        </h5>
      </div>
      <div class="card-body">
        <div
          v-if="store.matrixImages.length === 0"
          class="text-center text-muted py-4"
        >
          <i class="fa fa-image fa-3x mb-3"></i>
          <p>No matrix images have been added yet.</p>
        </div>

        <div v-else class="row g-3">
          <div
            v-for="matrixImage in store.matrixImages"
            :key="matrixImage.image_id"
            class="col-md-4 col-lg-3"
          >
            <div class="card h-100 image-card">
              <a :href="getLargeImageUrl(matrixImage)" target="_blank">
                <img
                  :src="getImageUrl(matrixImage)"
                  :alt="matrixImage.projectName"
                  class="card-img-top"
                  @error="$event.target.src = '/images/image_not_found.png'"
                />
              </a>
              <div class="card-body p-2">
                <small class="text-muted d-block">
                  <strong>P{{ matrixImage.project_id }}</strong>
                </small>
                <small class="text-truncate d-block">
                  {{ matrixImage.projectName || 'Unknown Project' }}
                </small>
              </div>
              <div class="card-footer p-2 bg-transparent">
                <button
                  class="btn btn-sm btn-outline-danger w-100"
                  @click="handleDelete(matrixImage)"
                >
                  <i class="fa fa-trash me-1"></i> Delete
                </button>
              </div>
            </div>
          </div>
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

.preview-container {
  max-width: 535px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  overflow: hidden;
}

.preview-container img {
  display: block;
  width: 100%;
}

.image-card {
  transition: transform 0.2s ease;
}

.image-card:hover {
  transform: translateY(-2px);
}

.image-card .card-img-top {
  height: 100px;
  object-fit: cover;
}
</style>

