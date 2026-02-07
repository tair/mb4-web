<script setup>
import { ref } from 'vue'
import { useHomePageAdminStore } from '@/stores/HomePageAdminStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'

const store = useHomePageAdminStore()
const { showSuccess, showError } = useNotifications()

const isEditing = ref(false)
const editingAnnouncementId = ref(null)
const formData = ref({
  title: '',
  description: '',
  link: '',
  startDate: '',
  endDate: '',
})

function resetForm() {
  formData.value = {
    title: '',
    description: '',
    link: '',
    startDate: '',
    endDate: '',
  }
  isEditing.value = false
  editingAnnouncementId.value = null
}

function formatDateForInput(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

function formatDateForDisplay(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function editAnnouncement(announcement) {
  isEditing.value = true
  editingAnnouncementId.value = announcement.announcement_id
  formData.value = {
    title: announcement.title || '',
    description: announcement.description,
    link: announcement.link || '',
    startDate: formatDateForInput(announcement.startDate),
    endDate: formatDateForInput(announcement.endDate),
  }
}

async function handleSubmit() {
  if (!formData.value.description) {
    showError('Description is required')
    return
  }

  if (!formData.value.startDate || !formData.value.endDate) {
    showError('Start date and end date are required')
    return
  }

  const startDate = new Date(formData.value.startDate)
  const endDate = new Date(formData.value.endDate)

  if (endDate <= startDate) {
    showError('End date must be after start date')
    return
  }

  try {
    const payload = {
      title: formData.value.title,
      description: formData.value.description,
      link: formData.value.link,
      startDate: formData.value.startDate,
      endDate: formData.value.endDate,
    }

    if (isEditing.value && editingAnnouncementId.value) {
      await store.updateAnnouncement(editingAnnouncementId.value, payload)
      showSuccess('Announcement updated successfully')
    } else {
      await store.createAnnouncement(payload)
      showSuccess('Announcement created successfully')
    }
    resetForm()
  } catch (error) {
    showError(error.message || 'Failed to save announcement')
  }
}

async function handleDelete(announcement) {
  const msg = announcement.title
    ? `Are you sure you want to delete "${announcement.title}"?`
    : 'Are you sure you want to delete this announcement?'

  if (!confirm(msg)) {
    return
  }

  try {
    await store.deleteAnnouncement(announcement.announcement_id)
    showSuccess('Announcement deleted successfully')
  } catch (error) {
    showError(error.message || 'Failed to delete announcement')
  }
}
</script>

<template>
  <div class="announcements-section">
    <!-- Form -->
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="card-title mb-0 text-white">
          <i class="fa fa-plus me-2"></i>
          {{ isEditing ? 'Edit Announcement' : 'Add New Announcement' }}
        </h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">
                  <strong>Title</strong>
                </label>
                <input
                  v-model="formData.title"
                  type="text"
                  class="form-control"
                  placeholder="Optional title"
                />
                <small class="text-muted">
                  Optional. Displayed in bold above the announcement.
                </small>
              </div>
            </div>
            <div class="col-md-6">
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
                  Optional. "More Information" link.
                </small>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">
              <strong>Announcement Text</strong>
              <span class="text-danger">*</span>
            </label>
            <textarea
              v-model="formData.description"
              class="form-control"
              rows="4"
              placeholder="Enter the announcement text..."
              required
            ></textarea>
          </div>

          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">
                  <strong>Start Date</strong>
                  <span class="text-danger">*</span>
                </label>
                <input
                  v-model="formData.startDate"
                  type="date"
                  class="form-control"
                  required
                />
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label class="form-label">
                  <strong>End Date</strong>
                  <span class="text-danger">*</span>
                </label>
                <input
                  v-model="formData.endDate"
                  type="date"
                  class="form-control"
                  required
                />
              </div>
            </div>
          </div>

          <div class="alert alert-secondary small">
            <i class="fa fa-info-circle me-2"></i>
            Announcements are only displayed on the homepage between the start
            and end dates.
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
                {{ isEditing ? 'Update Announcement' : 'Add Announcement' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Announcements List -->
    <div class="card">
      <div class="card-header">
        <h5 class="card-title mb-0 text-white">
          <i class="fa fa-list me-2"></i>
          Scheduled Announcements ({{ store.announcements.length }})
        </h5>
      </div>
      <div class="card-body">
        <div
          v-if="store.announcements.length === 0"
          class="text-center text-muted py-4"
        >
          <i class="fa fa-bullhorn fa-3x mb-3"></i>
          <p>No announcements have been scheduled.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Status</th>
                <th>Title</th>
                <th>Description</th>
                <th>Date Range</th>
                <th style="width: 120px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="announcement in store.announcements"
                :key="announcement.announcement_id"
              >
                <td>
                  <span
                    v-if="announcement.isActive"
                    class="badge bg-success"
                  >
                    Active
                  </span>
                  <span v-else class="badge bg-secondary">Scheduled</span>
                </td>
                <td>
                  <strong v-if="announcement.title">{{
                    announcement.title
                  }}</strong>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <span class="description-text">
                    {{
                      announcement.description.length > 100
                        ? announcement.description.substring(0, 100) + '...'
                        : announcement.description
                    }}
                  </span>
                </td>
                <td>
                  <small>
                    {{ formatDateForDisplay(announcement.startDate) }} -
                    {{ formatDateForDisplay(announcement.endDate) }}
                  </small>
                </td>
                <td>
                  <button
                    class="btn btn-sm btn-outline-primary me-1"
                    title="Edit"
                    @click="editAnnouncement(announcement)"
                  >
                    <i class="fa fa-edit"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    title="Delete"
                    @click="handleDelete(announcement)"
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
</style>

