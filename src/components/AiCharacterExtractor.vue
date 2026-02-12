<template>
  <div class="ai-character-extractor">
    <!-- Upload Section -->
    <div v-if="!showReview" class="upload-section">
      <h3 class="extractor-title">AI Character Extractor</h3>
      <p class="extractor-description">
        Upload a PDF document containing character descriptions and let AI extract them automatically.
      </p>
      
      <div class="upload-controls">
        <input
          type="file"
          accept=".pdf"
          ref="fileInputRef"
          id="pdf-character-upload"
          class="file-input"
          @change="handlePdfFileSelect"
        />
        <button
          type="button"
          class="btn btn-primary extract-button"
          :disabled="!pdfFile || isProcessingPdf"
          @click="extractCharactersFromPdf"
        >
          <span v-if="isProcessingPdf">
            <span class="spinner"></span> Processing...
          </span>
          <span v-else>Extract Characters from PDF</span>
        </button>
      </div>
      
      <div v-if="uploadError" class="status-message">
        <div class="error-message">
          <strong>Error:</strong> {{ uploadError }}
        </div>
      </div>
    </div>

    <!-- Review Section -->
    <div v-else class="review-section">
      <div class="review-header">
        <h3 class="review-title">
          <span class="success-icon">✓</span>
          Review Extracted Characters
        </h3>
        <p class="review-description">
          Successfully extracted {{ extractedCharacters.length }} character(s). 
          Select the characters you want to add to the matrix.
        </p>

        <!-- Duplicate Warning -->
        <div v-if="duplicateCount > 0" class="duplicate-warning">
          <strong>{{ duplicateCount }} duplicate(s) detected</strong> — characters with the same name already exist in the matrix and have been deselected. You can still select them if needed.
        </div>
        
        <!-- Selection Info -->
        <div class="selection-info">
          <span class="selection-count">
            {{ selectedCount }} of {{ extractedCharacters.length }} character(s) selected
          </span>
        </div>
      </div>

      <div class="characters-preview">
        <table class="matrix-review-table">
          <thead>
            <tr>
              <th class="checkbox-column">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate.prop="isSomeSelected"
                  @change="toggleSelectAll"
                  title="Select/Deselect All"
                />
              </th>
              <th>#</th>
              <th>Name</th>
              <th>States</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(character, index) in extractedCharacters" 
              :key="index"
              :class="{ 'selected': selectedCharacters[index], 'duplicate-row': duplicateFlags[index] }"
            >
              <td class="checkbox-column">
                <input
                  type="checkbox"
                  v-model="selectedCharacters[index]"
                />
              </td>
              <td>{{ index + 1 }}</td>
              <td>
                {{ character.name }}
                <span v-if="duplicateFlags[index]" class="duplicate-badge">duplicate</span>
              </td>
              <td>
                <ol v-if="character.states">
                  <li v-for="(state, stateIndex) in character.states" :key="stateIndex">
                    {{ state.name }}
                  </li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="review-actions">
        <button
          type="button"
          class="btn btn-secondary cancel-button"
          @click="handleCancel"
        >
          <span class="cancel-icon">←</span> Go Back
        </button>
        <button
          type="button"
          class="btn btn-secondary retry-button"
          @click="handleRetry"
        >
          <span class="retry-icon">↻</span> Retry Extraction
        </button>
        <button
          type="button"
          class="btn btn-success add-button"
          :disabled="selectedCount === 0"
          @click="handleAddToMatrix"
        >
          <span class="add-icon">+</span> Add Selected ({{ selectedCount }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { apiService } from '@/services/apiService.js'
import { Character, CharacterState, CharacterType } from '@/lib/matrix-parser/MatrixObject.ts'

// Props
const props = defineProps({
  totalCharacters: {
    type: Number,
    default: 1000
  },
  pageRange: {
    type: String,
    default: 'all'
  },
  zeroIndexed: {
    type: Boolean,
    default: false
  },
  existingCharacters: {
    type: Map,
    default: () => new Map()
  }
})

// Emits
const emit = defineEmits(['charactersExtracted', 'extractionError'])

// State
const pdfFile = ref(null)
const isProcessingPdf = ref(false)
const uploadError = ref('')
const fileInputRef = ref(null)
const showReview = ref(false)
const extractedCharacters = ref([])
const selectedCharacters = ref([])

// Handle PDF file selection
function handlePdfFileSelect(event) {
  const file = event.target.files[0]
  if (file && file.type === 'application/pdf') {
    pdfFile.value = file
    uploadError.value = ''
  } else {
    pdfFile.value = null
    uploadError.value = 'Please select a valid PDF file'
  }
}

// Extract characters from PDF
async function extractCharactersFromPdf() {
  if (!pdfFile.value) {
    uploadError.value = 'Please select a PDF file first'
    return
  }

  isProcessingPdf.value = true
  uploadError.value = ''
  showReview.value = false

  try {
    const formData = new FormData()
    formData.append('pdf_file', pdfFile.value)
    formData.append('total_characters', String(props.totalCharacters))
    formData.append('page_range', props.pageRange)
    formData.append('zero_indexed', String(props.zeroIndexed))

    const response = await apiService.post('/curator/process-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (!response.ok) {
      let errorMsg = `Server returned ${response.status}`
      // Read the body once as text
      const bodyText = await response.text()
      try {
        // Attempt to parse as JSON
        const errorData = JSON.parse(bodyText)
        // Handle FastAPI validation errors
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMsg = errorData.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join(', ')
          } else if (typeof errorData.detail === 'string') {
            errorMsg = errorData.detail
          } else {
            errorMsg = JSON.stringify(errorData.detail)
          }
        } else if (errorData.error) {
          errorMsg = errorData.error
        }
      } catch (e) {
        // If JSON parsing fails, treat bodyText as plain text
        if (bodyText) errorMsg += `: ${bodyText}`
      }
      throw new Error(errorMsg)
    }

    const result = await response.json()

    if (!result.success) {
      const errorMsg = result.error || result.message || 'PDF processing failed'
      throw new Error(errorMsg)
    }

    // Process the extracted characters
    const characterStates = result.character_states || []
    
    if (characterStates.length === 0) {
      throw new Error('No characters were extracted from the PDF')
    }

    // Transform character data into Character objects
    const characters = []
    for (let i = 0; i < characterStates.length; i++) {
      const charData = characterStates[i]
      
      // Create character with proper constructor parameters
      const character = new Character(i, charData.character)
      character.type = CharacterType.DISCRETE
      
      // Add states using the proper constructor (just pass the name string)
      // Guard against missing or non-array states
      const states = Array.isArray(charData.states) ? charData.states : []
      character.states = states.map((stateName) => 
        new CharacterState(stateName)
      )
      
      characters.push(character)
    }

    // Store extracted characters and show review screen
    extractedCharacters.value = characters
    // Initialize selection: auto-deselect duplicates
    selectedCharacters.value = characters.map(c => !isDuplicate(c))
    showReview.value = true
    uploadError.value = ''

  } catch (error) {
    console.error('PDF upload error:', error)
    uploadError.value = error instanceof Error ? error.message : 'Unknown error occurred'
    emit('extractionError', error)
  } finally {
    isProcessingPdf.value = false
  }
}

// Check if an extracted character is a duplicate of an existing one
function isDuplicate(character) {
  if (!props.existingCharacters || props.existingCharacters.size === 0) return false
  const name = character.name.trim().toLowerCase()
  for (const existing of props.existingCharacters.values()) {
    if (existing.name && existing.name.trim().toLowerCase() === name) return true
  }
  return false
}

// Computed: mark which extracted characters are duplicates
const duplicateFlags = computed(() => {
  return extractedCharacters.value.map(c => isDuplicate(c))
})

const duplicateCount = computed(() => {
  return duplicateFlags.value.filter(Boolean).length
})

// Computed properties for selection state
const selectedCount = computed(() => {
  return selectedCharacters.value.filter(Boolean).length
})

const isAllSelected = computed(() => {
  return extractedCharacters.value.length > 0 && 
         selectedCount.value === extractedCharacters.value.length
})

const isSomeSelected = computed(() => {
  return selectedCount.value > 0 && selectedCount.value < extractedCharacters.value.length
})

// Toggle select all
function toggleSelectAll() {
  const newValue = !isAllSelected.value
  selectedCharacters.value = new Array(extractedCharacters.value.length).fill(newValue)
}

// Handle adding selected characters to matrix
function handleAddToMatrix() {
  // Filter only selected characters
  const selectedChars = extractedCharacters.value.filter((_, index) => selectedCharacters.value[index])
  
  if (selectedChars.length === 0) {
    return
  }
  
  emit('charactersExtracted', selectedChars)
  
  // Reset component state
  showReview.value = false
  extractedCharacters.value = []
  selectedCharacters.value = []
  pdfFile.value = null
  uploadError.value = ''
  
  // Clear file input
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Handle retry extraction
function handleRetry() {
  showReview.value = false
  extractedCharacters.value = []
  selectedCharacters.value = []
  uploadError.value = ''
  // Keep the file selected for retry
}

// Handle cancel (go back without adding)
function handleCancel() {
  showReview.value = false
  extractedCharacters.value = []
  selectedCharacters.value = []
  uploadError.value = ''
  // Keep the file selected
}
</script>

<style scoped>
.ai-character-extractor {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.upload-section {
  padding: 40px;
  text-align: center;
}

.review-section {
  padding: 30px;
}

.extractor-title {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 24px;
  font-weight: 600;
}

.extractor-description {
  color: #5a6c7d;
  margin-bottom: 30px;
  font-size: 14px;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.upload-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
}

.file-input {
  padding: 10px;
  border: 2px dashed #3498db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 250px;
}

.file-input:hover {
  border-color: #2980b9;
  background: #f8f9fa;
}

.extract-button {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
  min-width: 200px;
}

.extract-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status-message {
  margin-top: 20px;
  min-height: 30px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}

.error-message {
  color: #e74c3c;
  background: #fadbd8;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  padding: 12px;
}

.success-message {
  color: #27ae60;
  background: #d5f4e6;
  border: 1px solid #27ae60;
  border-radius: 6px;
  padding: 12px;
}

/* Review Section Styles */
.review-header {
  text-align: center;
  margin-bottom: 30px;
}

.review-title {
  color: #2c3e50;
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.success-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #27ae60;
  color: white;
  border-radius: 50%;
  font-size: 20px;
}

.review-description {
  color: #5a6c7d;
  font-size: 14px;
  line-height: 1.6;
}

.characters-preview {
  max-height: 600px;
  overflow-y: auto;
  margin-bottom: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Table Styles matching CreateView */
.matrix-review-table {
  width: 100%;
  background-color: #fff;
  border: 1px solid #ccc;
  border-collapse: collapse;
  table-layout: auto;
}

.matrix-review-table th {
  background-color: #f8f9fa;
  border: 1px solid #ccc;
  font-size: 14px;
  font-weight: 600;
  padding: 10px;
  vertical-align: middle;
  text-align: left;
  color: #2c3e50;
}

.matrix-review-table th.checkbox-column {
  width: 50px;
  text-align: center;
}

.matrix-review-table td {
  padding: 8px 10px;
  border: 1px solid #ccc;
  text-align: left;
  vertical-align: top;
  font-size: 14px;
}

.matrix-review-table td.checkbox-column {
  text-align: center;
  vertical-align: middle;
}

.matrix-review-table td.checkbox-column input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3498db;
}

.matrix-review-table th input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3498db;
}

.matrix-review-table tr:nth-child(odd) {
  background-color: #f8f9fa;
}

.matrix-review-table tr.selected {
  background-color: #e3f2fd !important;
}

.matrix-review-table tr:hover {
  background-color: #f0f0f0;
}

.matrix-review-table tr.selected:hover {
  background-color: #d1e7fd !important;
}

.matrix-review-table tr.duplicate-row {
  opacity: 0.6;
}

.duplicate-badge {
  display: inline-block;
  background: #e67e22;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 10px;
  margin-left: 6px;
  vertical-align: middle;
}

.duplicate-warning {
  margin-top: 12px;
  padding: 10px 16px;
  background: #fef3cd;
  border: 1px solid #f0c36d;
  border-radius: 6px;
  color: #856404;
  font-size: 13px;
}

.matrix-review-table td ol {
  counter-reset: item -1;
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.matrix-review-table td li {
  display: block;
  padding: 2px 0;
}

.matrix-review-table td li::before {
  content: '(' counter(item) ') ';
  counter-increment: item;
  font-weight: 500;
  color: #666;
}

/* Selection Info */
.selection-info {
  margin-top: 15px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  display: inline-block;
}

.selection-count {
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.review-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 2px solid rgba(255, 255, 255, 0.5);
}

.cancel-button,
.retry-button,
.add-button {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;
  justify-content: center;
}

.cancel-button {
  background: #e74c3c;
  color: white;
  border: none;
}

.cancel-button:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.retry-button {
  background: #95a5a6;
  color: white;
  border: none;
}

.retry-button:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.add-button {
  background: #27ae60;
  color: white;
  border: none;
}

.add-button:hover:not(:disabled) {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.add-button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.6;
}

.cancel-icon,
.retry-icon,
.add-icon {
  font-size: 18px;
  font-weight: bold;
}

@media (min-width: 768px) {
  .upload-controls {
    flex-direction: row;
    justify-content: center;
  }
}
</style>

