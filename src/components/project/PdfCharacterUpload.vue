<script setup>
import { ref } from 'vue'
import { useNotifications } from '@/composables/useNotifications'
import axios from 'axios'

const { showError, showSuccess } = useNotifications()

const props = defineProps({
  hasCharacters: {
    type: Boolean,
    default: false
  }
})

const pdfFile = ref(null)
const totalCharacters = ref(0)
const isProcessing = ref(false)
const fileInputRef = ref(null)
const extractedData = ref(null)

const emit = defineEmits(['pdfProcessed', 'resetCharacters'])

function handleFileChange(event) {
  const files = event.target?.files
  if (files && files.length > 0) {
    pdfFile.value = files[0]
  }
}

async function processPdf() {
  if (!pdfFile.value) {
    showError('Please select a PDF file')
    return
  }

  if (!totalCharacters.value || totalCharacters.value <= 0) {
    showError('Please enter a valid number of total characters')
    return
  }

  isProcessing.value = true

  try {
    const formData = new FormData()
    formData.append('pdf_file', pdfFile.value)
    formData.append('total_characters', totalCharacters.value.toString())

    const response = await axios.post(
      'http://localhost:8001/api/process-pdf',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    console.log('PDF Processing Response:', response.data)
    
    // Store the extracted data
    extractedData.value = response.data
    
    showSuccess(`Successfully extracted ${response.data.metadata.successful_extractions} characters`)
    
    // Emit event to parent component with the response data
    emit('pdfProcessed', response.data)
  } catch (error) {
    console.error('Error processing PDF:', error)
    
    // Check if it's a quota exhaustion error (429)
    if (error.response?.status === 429) {
      showError(
        'API quota exceeded. Please wait a few minutes before trying again, or check your API billing details.'
      )
    } else {
      showError(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to process PDF. Please try again.'
      )
    }
  } finally {
    isProcessing.value = false
  }
}

function resetForm() {
  pdfFile.value = null
  totalCharacters.value = 0
  extractedData.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function resetCharacters() {
  const confirmed = confirm(
    'Are you sure you want to remove all extracted characters? This will clear the character data from your matrix.'
  )
  
  if (confirmed) {
    // Emit event to parent to clear the characters from the matrix
    emit('resetCharacters')
    // Reset the form
    resetForm()
    showSuccess('All extracted characters have been removed')
  }
}

// Expose resetForm method to parent component
defineExpose({
  resetForm
})
</script>

<template>
  <div class="pdf-upload-container">
    <div v-if="!hasCharacters" class="alert alert-info mb-3">
      <i class="fa-solid fa-info-circle me-2"></i>
      No matrices found in the uploaded file. You can upload a PDF document to extract character states automatically.
    </div>

    <div class="card">
      <div class="card-header">
        <h6 class="mb-0">
          <i class="fa-solid fa-file-pdf me-2"></i>
          Upload PDF for Character Extraction
        </h6>
      </div>
      <div class="card-body">
        <form @submit.prevent="processPdf">
          <div class="form-group mb-3">
            <label for="pdf-file" class="form-label">
              Select PDF File
              <span class="text-danger">*</span>
            </label>
            <input
              type="file"
              id="pdf-file"
              name="pdf-file"
              ref="fileInputRef"
              accept=".pdf"
              class="form-control"
              @change="handleFileChange"
              :disabled="isProcessing"
            />
            <small class="form-text text-muted">
              Upload a PDF document containing character descriptions
            </small>
          </div>

          <div class="form-group mb-3">
            <label for="total-characters" class="form-label">
              Total Number of Characters
              <span class="text-danger">*</span>
            </label>
            <input
              type="number"
              id="total-characters"
              name="total-characters"
              v-model.number="totalCharacters"
              class="form-control"
              min="1"
              placeholder="Enter total number of characters"
              :disabled="isProcessing"
            />
            <small class="form-text text-muted">
              Specify how many characters to extract from the PDF
            </small>
          </div>

          <div class="d-flex gap-2">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isProcessing || !pdfFile"
            >
              <span
                v-if="isProcessing"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {{ isProcessing ? 'Processing...' : 'Process PDF' }}
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="resetForm"
              :disabled="isProcessing"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Extracted Characters Display -->
    <div v-if="extractedData && extractedData.character_states" class="card mt-3">
      <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
        <h6 class="mb-0">
          <i class="fa-solid fa-check-circle me-2"></i>
          Extracted Characters ({{ extractedData.metadata.successful_extractions }})
        </h6>
        <button
          type="button"
          class="btn btn-outline-light btn-sm"
          @click="resetCharacters"
          title="Remove all extracted characters and start over"
        >
          <i class="fa-solid fa-rotate-left me-1"></i>
          Reset
        </button>
      </div>
      <div class="card-body">
        <div class="extraction-metadata mb-3">
          <small class="text-muted">
            <strong>File:</strong> {{ extractedData.metadata.filename }} | 
            <strong>Processing time:</strong> {{ extractedData.metadata.processing_time_seconds.toFixed(2) }}s
          </small>
        </div>
        
        <table class="table table-bordered">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Character Name</th>
              <th>States</th>
              <th style="width: 80px;">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="char in extractedData.character_states" :key="char.character_index">
              <td class="text-center">{{ char.character_index }}</td>
              <td><strong>{{ char.character }}</strong></td>
              <td>
                <ol class="state-list mb-0">
                  <li v-for="(state, index) in char.states" :key="index">
                    {{ state }}
                  </li>
                </ol>
              </td>
              <td class="text-center">
                <span class="badge bg-success">{{ char.score }}/10</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="extractedData.failed_indexes && extractedData.failed_indexes.length > 0" class="alert alert-warning mb-0">
          <i class="fa-solid fa-exclamation-triangle me-2"></i>
          <strong>Failed extractions:</strong> Characters at indexes {{ extractedData.failed_indexes.join(', ') }} could not be extracted.
        </div>

        <div class="alert alert-info mb-0 mt-3">
          <i class="fa-solid fa-info-circle me-2"></i>
          These characters will be automatically added to your matrix when you click "Next".
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdf-upload-container {
  margin: 20px 0;
}

.card {
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 0.75rem 1rem;
  color: #000;
}

.card-body {
  padding: 1rem;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.text-danger {
  color: #dc3545;
}

.text-muted {
  color: #6c757d;
}

.gap-2 {
  gap: 0.5rem;
}

.state-list {
  counter-reset: item -1;
  margin: 0;
  padding-left: 1.5rem;
}

.state-list li {
  display: block;
  margin-bottom: 0.25rem;
}

.state-list li::before {
  content: '(' counter(item) ') ';
  counter-increment: item;
  margin-left: -1.2em;
  font-weight: bold;
}

.extraction-metadata {
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 0.25rem;
}

/* Reset button styling */
.btn-outline-light {
  border-color: rgba(255, 255, 255, 0.6);
  color: white;
}

.btn-outline-light:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: white;
  color: white;
}
</style>

