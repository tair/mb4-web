<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatricesStore } from '@/stores/MatricesStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useNotifications } from '@/composables/useNotifications'
import Tooltip from '@/components/main/Tooltip.vue'
import { getTaxonomicUnitOptions } from '@/utils/taxa'
import { apiService } from '@/services/apiService.js'
import { AccessControlService, EntityType } from '@/lib/access-control.js'

const route = useRoute()
const router = useRouter()
const matricesStore = useMatricesStore()
const taxaStore = useTaxaStore()
const authStore = useAuthStore()
const { showError, showSuccess } = useNotifications()

const projectId = route.params.id
const matrixId = route.params.matrixId

// Form data
const formData = ref({
  title: '',
  notes: '',
  published: 0,
  otu: 'genus',
  DISABLE_SCORING: false,
  ENABLE_CELL_MEDIA_AUTOMATION: false,
  ENABLE_STREAMING: false,
})

// Taxonomic unit options
const taxonomicUnits = getTaxonomicUnitOptions()

// Tooltip text constants
const TOOLTIP_DISABLE_SCORING =
  'Checking this box prevents all Project Members from changing matrix scores. It does allow continued editing of media, labels and notes. The function is only available to the Project Administrator or the Project Member who created the matrix.'

const TOOLTIP_ENABLE_CELL_MEDIA_AUTOMATION =
  'Checking this box allows you to use a tool that automatically places media in cells (a huge time saver!). To use it, first be sure that your Media all have Views. Then affiliate exemplar Media with your character states and upload to MorphoBank Media for all your rows (taxa). If you then activate the arrow (in the matrix editor) the tool will first check what media Views are affiliated with your character states. If the taxa in your rows below have the same Media Views in the database the tool will automatically put those Media into cells. It does not score or label. It will not overwrite media that are already there. You can use the tool more than once and it will keep updating.'

const TOOLTIP_ENABLE_STREAMING =
  'Enables real-time synchronization of matrix changes across multiple users. When enabled, changes made by other users will appear in your matrix editor in real-time without needing to refresh.'

const TOOLTIP_OPERATIONAL_TAXONOMIC_UNIT =
  'Sets the default Operational Taxonomic Unit (OTU) to use when importing a NEXUS or TNT file. The OTU is used to determine how to treat unary (one-word) taxa. For example, if the OTU is set to family, then all unary taxa in the uploaded NEXUS or TNT file will be treated as family names. Note that binomial and trinomials are always interpreted as genus/species and genus/species/subspecies respectively.'

const TOOLTIP_PUBLISHING_STATUS =
  'Determines whether the matrix is made public when the project is published.'

// State
const isLoading = ref(false)
const errors = ref({})
const matrix = ref(null)
const firstTaxonName = ref('')
const showDeleteModal = ref(false)
const deleteWithTaxaAndCharacters = ref(true)
const canDelete = ref(false)

// Access control state
const accessChecked = ref(false)
const accessResult = ref(null)
const canEditMatrix = ref(false)

// Computed

// Methods
function getCurrentUserId() {
  return authStore.user?.userId || null
}

async function loadData() {
  isLoading.value = true
  try {
    // Load matrix data if editing existing matrix
    if (matrixId) {
      const response = await apiService.get(`/projects/${projectId}/matrices/${matrixId}`)
      const responseData = await response.json()
      matrix.value = responseData

      // Parse other_options if it's a JSON string
      let otherOptions = {}
      if (matrix.value.other_options) {
        try {
          otherOptions =
            typeof matrix.value.other_options === 'string'
              ? JSON.parse(matrix.value.other_options)
              : matrix.value.other_options
        } catch (error) {
          console.error('Error parsing other_options JSON:', error)
          otherOptions = {}
        }
      }

      // Populate form with existing data
      formData.value = {
        title: matrix.value.title || '',
        notes: matrix.value.notes || '',
        published: matrix.value.published || 0,
        otu: matrix.value.otu || 'genus',
        DISABLE_SCORING: otherOptions.DISABLE_SCORING || false,
        ENABLE_CELL_MEDIA_AUTOMATION:
          otherOptions.ENABLE_CELL_MEDIA_AUTOMATION || false,
        ENABLE_STREAMING: otherOptions.ENABLE_STREAMING || false,
      }

      // Check if user has permission to delete this matrix (server-level rule)
      try {
        const permissionResponse = await apiService.get(
          apiService.buildUrl(`/projects/${projectId}/matrices/${matrixId}/can-delete`)
        )
        const permissionData = await permissionResponse.json()
        canDelete.value = permissionData.canDelete
      } catch (error) {
        console.error('Error checking delete permission:', error)
        canDelete.value = false
      }

      // Component-level access control for edit vs read-only
      await checkAccess()
    }

    // Load taxa to get first taxon name (alphabetically)
    if (!taxaStore.isLoaded) {
      await taxaStore.fetch(projectId)
    }
    if (taxaStore.taxa && taxaStore.taxa.length > 0) {
      firstTaxonName.value = taxaStore.taxa[0].name
    }
  } catch (error) {
    console.error('Error loading data:', error)
    showError('Failed to load data')
    errors.value.general = 'Failed to load data'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  // Prevent submit if not allowed
  if (!canEditMatrix.value) {
    showError('You do not have permission to edit matrix settings.')
    return
  }
  isLoading.value = true
  errors.value = {}

  try {
    // Prepare matrix options as JSON for other_options field
    const matrixOptions = {
      DISABLE_SCORING: formData.value.DISABLE_SCORING,
      ENABLE_CELL_MEDIA_AUTOMATION: formData.value.ENABLE_CELL_MEDIA_AUTOMATION,
      ENABLE_STREAMING: formData.value.ENABLE_STREAMING,
    }

    // Update matrix properties including other_options
    const matrixData = {
      title: formData.value.title,
      notes: formData.value.notes,
      published: formData.value.published,
      otu: formData.value.otu,
      other_options: JSON.stringify(matrixOptions),
    }

    await apiService.put(
      apiService.buildUrl(`/projects/${projectId}/matrices/${matrixId}`),
      matrixData
    )
    showSuccess('Matrix settings updated successfully!')
    console.log('Matrix updated successfully')

    matricesStore.invalidate()
    router.push(`/myprojects/${projectId}/matrices`)
  } catch (error) {
    console.error('Error updating matrix settings:', error)
    showError('Failed to update matrix settings. Please try again.')
  } finally {
    isLoading.value = false
  }
}

async function handleDelete() {
  if (!canEditMatrix.value) return
  if (!matrix.value) return
  showDeleteModal.value = true
}

async function confirmDelete() {
  isLoading.value = true
  showDeleteModal.value = false

  try {
    const deleteParams = deleteWithTaxaAndCharacters.value
      ? '?deleteTaxaAndCharacters=true'
      : ''

    await apiService.delete(
      apiService.buildUrl(`/projects/${projectId}/matrices/${matrixId}${deleteParams}`)
    )
    matricesStore.invalidate()
    
    // If we deleted taxa and characters, invalidate the taxa store to reflect deletions
    if (deleteWithTaxaAndCharacters.value) {
      taxaStore.invalidate()
    }
    
    router.push(`/myprojects/${projectId}/matrices`)
  } catch (error) {
    console.error('Error deleting matrix:', error)
    showError('Failed to delete matrix')
  } finally {
    isLoading.value = false
    deleteWithTaxaAndCharacters.value = false
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  deleteWithTaxaAndCharacters.value = false
}

function formatDate(dateString) {
  if (!dateString) return 'Not available'

  try {
    // Handle different possible date formats
    let date

    // If it's already a Date object
    if (dateString instanceof Date) {
      date = dateString
    }
    // If it's a Unix timestamp (number)
    else if (typeof dateString === 'number') {
      date = new Date(dateString * 1000) // Convert from seconds to milliseconds
    }
    // If it's a string that might be a Unix timestamp
    else if (typeof dateString === 'string' && /^\d+$/.test(dateString)) {
      const timestamp = parseInt(dateString)
      // Check if it's in seconds (10 digits) or milliseconds (13 digits)
      date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)
    }
    // Otherwise try to parse as a regular date string
    else {
      date = new Date(dateString)
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString)
      return 'Invalid date'
    }

    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
    }

    return date.toLocaleDateString('en-US', options).replace(',', ' at')
  } catch (error) {
    console.error(
      'Error formatting date:',
      error,
      'Original value:',
      dateString
    )
    return 'Date formatting error'
  }
}

onMounted(() => {
  loadData()
})

// Access control helpers
async function checkAccess() {
  if (!matrix.value) return
  // Ensure auth store is ready
  if (!authStore.user?.access) {
    authStore.fetchLocalStore()
  }

  try {
    const result = await AccessControlService.canEditEntity({
      entityType: EntityType.MATRIX,
      projectId: parseInt(projectId),
      entity: matrix.value,
    })
    accessResult.value = result
    canEditMatrix.value = !!result.canEdit
  } catch (e) {
    console.error('Error checking access:', e)
    accessResult.value = { canEdit: false, level: 'error' }
    canEditMatrix.value = false
  } finally {
    accessChecked.value = true
  }
}
</script>

<template>
  <div class="matrix-settings">
    <div v-if="isLoading" class="text-center py-4">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else>
      <!-- Matrix Title Header -->
      <div v-if="matrix" class="matrix-header mb-4">
        <h2 class="matrix-title">Matrix Settings</h2>
        <p class="matrix-subtitle">
          {{ matrix.title }} (<i>matrix {{ matrix.matrix_id }}</i
          >)
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="list-form">
      

        <!-- Matrix Settings -->
        <div class="form-group">
          <label class="form-label">
            Disable scoring
            <Tooltip :content="TOOLTIP_DISABLE_SCORING" />
          </label>
          <div class="form-check">
            <input
              type="checkbox"
              name="DISABLE_SCORING"
              value="1"
              v-model="formData.DISABLE_SCORING"
              class="form-check-input"
            />
            <span class="form-check-label"
              >Prevent all Project Members from changing matrix scores</span
            >
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            Enable Cell Media Automation
            <Tooltip :content="TOOLTIP_ENABLE_CELL_MEDIA_AUTOMATION" />
          </label>
          <div class="form-check">
            <input
              type="checkbox"
              name="ENABLE_CELL_MEDIA_AUTOMATION"
              value="1"
              v-model="formData.ENABLE_CELL_MEDIA_AUTOMATION"
              class="form-check-input"
            />
            <span class="form-check-label"
              >Enable automatic media placement in cells</span
            >
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            Enable Streaming
            <Tooltip :content="TOOLTIP_ENABLE_STREAMING" />
          </label>
          <div class="form-check">
            <input
              type="checkbox"
              name="ENABLE_STREAMING"
              value="1"
              v-model="formData.ENABLE_STREAMING"
              class="form-check-input"
            />
            <span class="form-check-label"
              >Enable real-time synchronization of matrix changes</span
            >
          </div>
        </div>

        <!-- Title Field -->
        <div class="form-group">
          <label class="form-label">
            Title
            <span class="required">Required</span>
          </label>
          <textarea
            name="title"
            rows="2"
            class="form-control"
            v-model="formData.title"
            :class="{ 'is-invalid': errors.title }"
            required
          ></textarea>
          <div v-if="errors.title" class="invalid-feedback">
            {{ errors.title }}
          </div>
        </div>

        <!-- Notes Field -->
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea
            name="notes"
            rows="6"
            class="form-control"
            v-model="formData.notes"
            :class="{ 'is-invalid': errors.notes }"
          ></textarea>
          <div v-if="errors.notes" class="invalid-feedback">
            {{ errors.notes }}
          </div>
        </div>

        <!-- Operational Taxonomic Unit Field -->
        <div class="form-group">
          <label class="form-label">
            Operational taxonomic unit
            <Tooltip :content="TOOLTIP_OPERATIONAL_TAXONOMIC_UNIT" />
          </label>
          <select
            name="otu"
            class="form-control"
            v-model="formData.otu"
            :class="{ 'is-invalid': errors.otu }"
          >
            <option
              v-for="unit in taxonomicUnits"
              :key="unit.value"
              :value="unit.value"
            >
              {{ unit.label }}
            </option>
          </select>
          <div v-if="errors.otu" class="invalid-feedback">{{ errors.otu }}</div>
        </div>

        <!-- Publishing Status -->
        <div class="form-group">
          <label class="form-label">
            Publishing status
            <Tooltip :content="TOOLTIP_PUBLISHING_STATUS" />
          </label>
          <select
            name="published"
            class="form-control"
            v-model="formData.published"
            :class="{ 'is-invalid': errors.published }"
          >
            <option value="0">Publish when project is published</option>
            <option value="1">Never publish to project</option>
          </select>
          <div v-if="errors.published" class="invalid-feedback">
            {{ errors.published }}
          </div>
        </div>

        <!-- Created/Modified dates -->
        <div v-if="matrix" class="form-group">
          <label class="form-label">Created on</label>
          <div class="form-text">{{ formatDate(matrix.created_on) }}</div>
        </div>

        <div v-if="matrix" class="form-group">
          <label class="form-label">Last modified on</label>
          <div class="form-text">{{ formatDate(matrix.last_modified_on) }}</div>
        </div>

        <!-- Form Buttons -->
        <div class="form-group">
          <button type="submit" class="btn btn-primary" :disabled="isLoading || !canEditMatrix">
            {{ isLoading ? 'Saving...' : 'Save' }}
          </button>
          <RouterLink
            :to="`/myprojects/${projectId}/matrices`"
            class="btn btn-outline-primary ms-2"
          >
            Cancel
          </RouterLink>
          <button
            v-if="canDelete && canEditMatrix"
            type="button"
            class="btn btn-danger ms-2"
            @click="handleDelete"
            :disabled="isLoading"
          >
            Delete Matrix
          </button>
        </div>

        <!-- Hidden fields -->
        <input type="hidden" name="matrix_id" :value="matrixId" />
        <input type="hidden" name="user_id" :value="getCurrentUserId()" />
        <input type="hidden" name="project_id" :value="projectId" />
      </form>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="modal fade show"
      style="display: block; background-color: rgba(0, 0, 0, 0.5)"
      tabindex="-1"
      role="dialog"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Delete Matrix</h5>
          </div>
          <div class="modal-body">
            <p>
              <strong>Really delete matrix: {{ matrix?.title }}?</strong>
            </p>
            <div class="form-check mt-3">
              <input
                type="checkbox"
                id="deleteWithTaxaAndCharacters"
                v-model="deleteWithTaxaAndCharacters"
                class="form-check-input"
              />
              <label for="deleteWithTaxaAndCharacters" class="form-check-label">
                <strong>Permanently delete*</strong> the taxa and characters in this matrix from your Project along with all the scores in the matrix.
                <br><br>
                <em>*Any of the taxa and characters used in other matrices in your project will not be deleted.</em>
                <br><br>
                If unchecked, only the scores will be deleted —all taxa and characters will remain in your project.
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="cancelDelete"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="confirmDelete"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Deleting...' : 'Delete Matrix' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/css/form.css';

.matrix-settings {
  max-width: 800px;
  padding: 20px;
}

.matrix-header {
  border-bottom: 3px solid var(--mb-orange);
  padding-bottom: 15px;
  margin-bottom: 25px;
}

.matrix-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 5px 0;
  word-wrap: break-word;
}

.matrix-subtitle {
  font-size: 1.1rem;
  color: #6c757d;
  margin: 0;
  font-weight: 400;
}

.form-text {
  color: #666;
  font-size: 14px;
  margin-top: 5px;
}

.alert-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}
</style>
