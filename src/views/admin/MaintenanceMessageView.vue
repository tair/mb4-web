<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { apiService } from '@/services/apiService.js'
import { useNotifications } from '@/composables/useNotifications.ts'

const { showSuccess, showError } = useNotifications()

const isLoaded = ref(false)
const isSaving = ref(false)

const settings = ref({
  enabled: false,
  message: '',
})

onMounted(async () => {
  try {
    const response = await apiService.get('/admin/maintenance')
    const data = await response.json()
    if (data.success) {
      settings.value = data.data
    }
  } catch (error) {
    console.error('Error loading maintenance settings:', error)
    showError('Failed to load maintenance settings')
  } finally {
    isLoaded.value = true
  }
})

async function saveSettings() {
  isSaving.value = true
  try {
    const response = await apiService.put('/admin/maintenance', {
      enabled: settings.value.enabled,
      message: settings.value.message,
    })
    const data = await response.json()
    if (data.success) {
      settings.value = {
        ...settings.value,
        ...data.data,
      }
      showSuccess('Maintenance settings saved successfully')
    } else {
      showError(data.message || 'Failed to save settings')
    }
  } catch (error) {
    console.error('Error saving maintenance settings:', error)
    showError('Failed to save maintenance settings')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-12">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item">
                <RouterLink to="/admin">Admin</RouterLink>
              </li>
              <li class="breadcrumb-item active" aria-current="page">
                Maintenance Message
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title mb-0 text-white">Maintenance Message Settings</h3>
            </div>
            <div class="card-body">
              <form @submit.prevent="saveSettings">
                <!-- Enable Maintenance Message -->
                <div class="mb-4">
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="enableMaintenance"
                      v-model="settings.enabled"
                    />
                    <label class="form-check-label" for="enableMaintenance">
                      <strong>Enable maintenance message</strong>
                    </label>
                  </div>
                  <small class="text-muted">
                    When enabled, the maintenance message will be displayed on the homepage.
                  </small>
                </div>

                <!-- Message Text -->
                <div class="mb-4">
                  <label for="maintenanceMessage" class="form-label">
                    <strong>Message Text</strong>
                  </label>
                  <textarea
                    class="form-control"
                    id="maintenanceMessage"
                    v-model="settings.message"
                    rows="5"
                    placeholder="Enter your maintenance message here, including the date and time..."
                  ></textarea>
                  <small class="text-muted">
                    Include the date, time, and any other relevant details in your message.
                  </small>
                </div>

                <!-- Example Message -->
                <div class="mb-4">
                  <label class="form-label text-muted">Example message:</label>
                  <div class="p-2 bg-light rounded">
                    <code>MorphoBank will be offline for scheduled maintenance on Friday, January 10, 2026 from 9AM to 12PM EST. We apologize for any inconvenience.</code>
                  </div>
                </div>

                <!-- Save Button -->
                <div class="d-flex justify-content-end">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="isSaving"
                  >
                    <span v-if="isSaving">
                      <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    </span>
                    <span v-else>Save Settings</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Preview Panel -->
        <div class="col-lg-4">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0 text-white">Preview</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <strong>Status:</strong>
                <span v-if="settings.enabled" class="badge bg-success ms-2">Enabled</span>
                <span v-else class="badge bg-secondary ms-2">Disabled</span>
              </div>

              <div v-if="settings.message" class="mt-4">
                <strong>Message Preview:</strong>
                <div class="maintenance-preview mt-2">
                  {{ settings.message }}
                </div>
              </div>
              <div v-else class="text-muted mt-4">
                <em>No message entered</em>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-title {
  color: #495057;
}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.form-switch .form-check-input {
  width: 3em;
  height: 1.5em;
}

.maintenance-preview {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #cc0000;
  line-height: 24px;
  background-color: #fff3f3;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ffcccc;
}

code {
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  color: #d63384;
}

.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin-bottom: 0;
}
</style>
