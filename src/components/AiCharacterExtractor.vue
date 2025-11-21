<template>
  <div class="ai-character-extractor">
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
    
    <div v-if="uploadStatus || uploadError" class="status-message">
      <div v-if="uploadError" class="error-message">
        <strong>Error:</strong> {{ uploadError }}
      </div>
      <div v-else class="success-message">
        <strong>Success!</strong> {{ uploadStatus }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiService } from '@/services/apiService.js'
import { Character, CharacterState } from '@/lib/matrix-parser/MatrixObject.ts'

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
  }
})

// Emits
const emit = defineEmits(['charactersExtracted', 'extractionError'])

// State
const pdfFile = ref(null)
const isProcessingPdf = ref(false)
const uploadStatus = ref('')
const uploadError = ref('')
const fileInputRef = ref(null)

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
  uploadStatus.value = 'Processing PDF... This may take a moment.'
  uploadError.value = ''

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
      try {
        const errorData = await response.json()
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
        // If JSON parsing fails, try text
        const errorText = await response.text()
        if (errorText) errorMsg += `: ${errorText}`
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
    const extractedCharacters = []
    for (let i = 0; i < characterStates.length; i++) {
      const charData = characterStates[i]
      
      // Create character with proper constructor parameters
      const character = new Character(i, charData.character)
      character.type = 0 // discrete
      
      // Add states using the proper constructor (just pass the name string)
      character.states = charData.states.map((stateName) => 
        new CharacterState(stateName)
      )
      
      extractedCharacters.push(character)
    }

    uploadStatus.value = `Successfully extracted ${characterStates.length} character(s) from PDF!`
    uploadError.value = ''
    
    // Emit success event with extracted characters
    emit('charactersExtracted', extractedCharacters)
    
    // Clear the file input and status after a short delay
    setTimeout(() => {
      uploadStatus.value = ''
      pdfFile.value = null
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
    }, 3000)

  } catch (error) {
    console.error('PDF upload error:', error)
    uploadError.value = error instanceof Error ? error.message : 'Unknown error occurred'
    uploadStatus.value = ''
    emit('extractionError', error)
  } finally {
    isProcessingPdf.value = false
  }
}
</script>

<style scoped>
.ai-character-extractor {
  padding: 40px;
  text-align: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

@media (min-width: 768px) {
  .upload-controls {
    flex-direction: row;
    justify-content: center;
  }
}
</style>

