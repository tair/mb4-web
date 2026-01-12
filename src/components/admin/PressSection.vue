<script setup>
import { ref } from 'vue'
import { useHomePageAdminStore } from '@/stores/HomePageAdminStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'
import { apiService } from '@/services/apiService.js'

const store = useHomePageAdminStore()
const { showSuccess, showError } = useNotifications()

const isEditing = ref(false)
const editingPressId = ref(null)
const formData = ref({
  title: '',
  author: '',
  publication: '',
  link: '',
  featured: false,
})
const imageFile = ref(null)
const imagePreview = ref(null)

function resetForm() {
  formData.value = {
    title: '',
    author: '',
    publication: '',
    link: '',
    featured: false,
  }
  imageFile.value = null
  imagePreview.value = null
  isEditing.value = false
  editingPressId.value = null
}

function editPress(press) {
  isEditing.value = true
  editingPressId.value = press.press_id
  formData.value = {
    title: press.title,
    author: press.author || '',
    publication: press.publication || '',
    link: press.link || '',
    featured: press.featured || false,
  }
  imagePreview.value = press.thumbnailUrl
    ? apiService.buildUrl(press.thumbnailUrl)
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
  if (!formData.value.title) {
    showError('Title is required')
    return
  }

  try {
    const data = new FormData()
    data.append('title', formData.value.title)
    if (formData.value.author) {
      data.append('author', formData.value.author)
    }
    if (formData.value.publication) {
      data.append('publication', formData.value.publication)
    }
    if (formData.value.link) {
      data.append('link', formData.value.link)
    }
    data.append('featured', formData.value.featured)
    if (imageFile.value) {
      data.append('image', imageFile.value)
    }

    if (isEditing.value && editingPressId.value) {
      await store.updatePress(editingPressId.value, data)
      showSuccess('Press item updated successfully')
    } else {
      await store.createPress(data)
      showSuccess('Press item created successfully')
    }
    resetForm()
  } catch (error) {
    showError(error.message || 'Failed to save press item')
  }
}

async function handleDelete(press) {
  if (!confirm(`Are you sure you want to delete "${press.title}"?`)) {
    return
  }

  try {
    await store.deletePress(press.press_id)
    showSuccess('Press item deleted successfully')
  } catch (error) {
    showError(error.message || 'Failed to delete press item')
  }
}

function getImageUrl(press) {
  if (press.thumbnailUrl) {
    return apiService.buildUrl(press.thumbnailUrl)
  }
  return '/images/image_not_found.png'
}
</script>

<template>
  <div class="press-section">
    <!-- Form -->
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="card-title mb-0 text-white">
          <i class="fa fa-plus me-2"></i>
          {{ isEditing ? 'Edit Press Item' : 'Add New Press Item' }}
        </h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="row">
            <div class="col-md-4">
              <div class="mb-3">
                <label class="form-label">
                  <strong>Image</strong>
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
                  placeholder="Press item title"
                  required
                />
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">
                      <strong>Author</strong>
                    </label>
                    <input
                      v-model="formData.author"
                      type="text"
                      class="form-control"
                      placeholder="Author name"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">
                      <strong>Publication</strong>
                    </label>
                    <input
                      v-model="formData.publication"
                      type="text"
                      class="form-control"
                      placeholder="Publication name"
                    />
                  </div>
                </div>
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
              </div>

              <div class="mb-3">
                <div class="form-check">
                  <input
                    v-model="formData.featured"
                    type="checkbox"
                    class="form-check-input"
                    id="featuredCheck"
                  />
                  <label class="form-check-label" for="featuredCheck">
                    <strong>Featured</strong> - Display on homepage
                  </label>
                </div>
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
                {{ isEditing ? 'Update Press Item' : 'Add Press Item' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Press List -->
    <div class="card">
      <div class="card-header">
        <h5 class="card-title mb-0 text-white">
          <i class="fa fa-list me-2"></i>
          Press Items ({{ store.press.length }})
        </h5>
      </div>
      <div class="card-body">
        <div v-if="store.press.length === 0" class="text-center text-muted py-4">
          <i class="fa fa-newspaper fa-3x mb-3"></i>
          <p>No press items have been added yet.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th style="width: 80px">Image</th>
                <th>Title</th>
                <th>Author</th>
                <th>Publication</th>
                <th>Featured</th>
                <th style="width: 120px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="press in store.press" :key="press.press_id">
                <td>
                  <img
                    :src="getImageUrl(press)"
                    :alt="press.title"
                    class="img-thumbnail"
                    style="width: 60px; height: 60px; object-fit: cover"
                    @error="$event.target.src = '/images/image_not_found.png'"
                  />
                </td>
                <td>
                  <strong>{{ press.title }}</strong>
                  <br />
                  <a
                    v-if="press.link"
                    :href="press.link"
                    target="_blank"
                    class="small"
                  >
                    <i class="fa fa-external-link-alt me-1"></i>View
                  </a>
                </td>
                <td>
                  <span v-if="press.author">{{ press.author }}</span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <span v-if="press.publication">{{ press.publication }}</span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <span v-if="press.featured" class="badge bg-success">
                    Yes
                  </span>
                  <span v-else class="badge bg-secondary">No</span>
                </td>
                <td>
                  <button
                    class="btn btn-sm btn-outline-primary me-1"
                    title="Edit"
                    @click="editPress(press)"
                  >
                    <i class="fa fa-edit"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    title="Delete"
                    @click="handleDelete(press)"
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

.img-thumbnail {
  border-radius: 4px;
}
</style>

