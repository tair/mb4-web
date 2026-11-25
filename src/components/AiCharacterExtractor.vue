<template>
  <div class="ai-character-extractor">
    <div class="upload-section">
      <h3 class="extractor-title">AI Character Extractor <span class="beta-badge">Beta</span></h3>
      <p class="extractor-description">
        Upload a PDF or Word document containing character descriptions and let AI extract them automatically.
      </p>
      
      <div class="upload-controls">
        <input
          type="file"
          accept=".pdf,.docx"
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
          <span v-else>Extract Characters</span>
        </button>
      </div>

      <p v-if="isProcessingPdf" class="progress-note">
        Reading your document ({{ formattedElapsed }}). Long character lists can take a few
        minutes; please keep this page open.
      </p>

      <div v-if="uploadError" class="status-message">
        <div class="error-message">
          <strong>Error:</strong> {{ uploadError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { apiService } from '@/services/apiService.js'
import { Character, CharacterState, CharacterType } from '@/lib/matrix-parser/MatrixObject.ts'
import { useNotifications } from '@/composables/useNotifications'

// Cap sent to the AI when the matrix's own character count is unknown.
const UNBOUNDED_CHARACTER_CAP = 1000

// Extraction runs as a background job on the server, because it can take longer
// than the proxies in front of the API keep one request open. The component
// starts the job, then polls for its result.
const POLL_INTERVAL_MS = 3000
const MAX_WAIT_MS = 10 * 60 * 1000
// Consecutive failed polls tolerated before giving up, so a brief network
// blip does not lose a job that is still running.
const MAX_POLL_FAILURES = 3

// Thrown when the component unmounts while a job is running.
class ExtractionCancelled extends Error {}

const props = defineProps({
  // The matrix's character count. 0 means unknown: the extracted names are then
  // accepted without a count check.
  totalCharacters: {
    type: Number,
    default: 0
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

const emit = defineEmits(['charactersExtracted', 'extractionError'])

const { showWarning } = useNotifications()

const pdfFile = ref(null)
const isProcessingPdf = ref(false)
const uploadError = ref('')
const fileInputRef = ref(null)
const elapsedSeconds = ref(0)
let unmounted = false

const formattedElapsed = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60)
  const seconds = String(elapsedSeconds.value % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

onBeforeUnmount(() => {
  unmounted = true
})

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Runs the extraction and returns the curator API's response body.
 */
async function requestExtraction(formData) {
  let jobId
  try {
    const response = await apiService.post('/curator/process-pdf/jobs', formData)
    jobId = (await response.json()).jobId
  } catch (error) {
    // An API without job endpoints, while it is being deployed: wait on the
    // request instead.
    if (error.code === 'NOT_FOUND') {
      const response = await apiService.post('/curator/process-pdf', formData)
      return parseJsonBody(response)
    }
    throw error
  }
  return pollForResult(jobId)
}

async function pollForResult(jobId) {
  const deadline = Date.now() + MAX_WAIT_MS
  let failedPolls = 0

  while (Date.now() < deadline) {
    await wait(POLL_INTERVAL_MS)
    if (unmounted) {
      throw new ExtractionCancelled()
    }

    let job
    try {
      const response = await apiService.get(`/curator/process-pdf/jobs/${jobId}`)
      job = await response.json()
      failedPolls = 0
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        throw new Error(
          'The document processing job was lost, possibly because the server restarted. Please try again.'
        )
      }
      failedPolls++
      if (failedPolls >= MAX_POLL_FAILURES) {
        throw error
      }
      continue
    }

    if (job.status === 'done') {
      return job.result
    }
    if (job.status === 'failed') {
      throw new Error(
        job.error?.message || job.error?.error || 'Document processing failed'
      )
    }
  }

  throw new Error(
    'Document processing is taking longer than expected. Please try again, or upload a shorter document.'
  )
}

async function parseJsonBody(response) {
  const bodyText = await response.text()
  try {
    return JSON.parse(bodyText)
  } catch {
    throw new Error(bodyText || 'Document processing failed')
  }
}

function handlePdfFileSelect(event) {
  const file = event.target.files[0]
  const validExtensions = ['.pdf', '.docx']
  const isValid = file && validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  if (isValid) {
    pdfFile.value = file
    uploadError.value = ''
  } else {
    pdfFile.value = null
    uploadError.value = 'Please select a valid PDF or Word (.docx) file'
  }
}

async function extractCharactersFromPdf() {
  if (!pdfFile.value) {
    uploadError.value = 'Please select a file first'
    return
  }

  isProcessingPdf.value = true
  uploadError.value = ''
  elapsedSeconds.value = 0
  const startedAt = Date.now()
  const elapsedTimer = setInterval(() => {
    elapsedSeconds.value = Math.floor((Date.now() - startedAt) / 1000)
  }, 1000)

  try {
    const formData = new FormData()
    formData.append('pdf_file', pdfFile.value)
    formData.append(
      'total_characters',
      String(props.totalCharacters > 0 ? props.totalCharacters : UNBOUNDED_CHARACTER_CAP)
    )
    formData.append('page_range', props.pageRange)
    formData.append('zero_indexed', String(props.zeroIndexed))

    const result = await requestExtraction(formData)

    if (!result.success) {
      const errorMsg =
        (typeof result.detail === 'string' ? result.detail : null) ||
        result.error ||
        result.message ||
        'Document processing failed'
      throw new Error(errorMsg)
    }

    const characterStates = result.character_states || []

    if (characterStates.length === 0) {
      throw new Error('No characters were extracted from the document')
    }

    // Check for continuous characters
    const continuousChars = characterStates.filter(
      (c) => c.type === 'continuous'
    )
    if (continuousChars.length > 0) {
      const msg =
        'This matrix contains both discrete and continuous characters. ' +
        'The AI parsing tool only supports discrete character matrices and would produce errors if allowed to continue. ' +
        'Please upload your matrix file and character information file to the Documents section of your project.'
      uploadError.value = msg
      emit('extractionError', new Error(msg))
      isProcessingPdf.value = false
      return
    }

    const characters = []
    let skippedCount = 0
    for (let i = 0; i < characterStates.length; i++) {
      const charData = characterStates[i]
      const name = charData?.character
      if (name == null || String(name).trim() === '') {
        skippedCount++
        continue
      }
      const character = new Character(characters.length, String(name).trim())
      character.type = CharacterType.DISCRETE
      const states = Array.isArray(charData.states) ? charData.states : []
      character.states = states.map((stateName) => new CharacterState(stateName))
      characters.push(character)
    }

    if (characters.length === 0) {
      throw new Error('No valid characters were extracted. All entries had missing or empty character names.')
    }

    // The extracted names become the matrix's columns one for one, so a differing
    // count leaves columns unnamed or unscored (MB4-466).
    if (props.totalCharacters > 0 && characters.length !== props.totalCharacters) {
      throw new Error(
        `Your document contains ${characters.length} character name${characters.length === 1 ? '' : 's'} ` +
          `but the matrix has ${props.totalCharacters} character${props.totalCharacters === 1 ? '' : 's'}. ` +
          'These must match. Please correct the document or the matrix file and upload again.'
      )
    }

    if (skippedCount > 0) {
      showWarning(
        'Warning',
        `${skippedCount} entr${skippedCount === 1 ? 'y' : 'ies'} with missing or empty character name${skippedCount === 1 ? ' was' : ' were'} skipped.`
      )
    }

    emit('charactersExtracted', characters)

    // Reset for potential re-use
    pdfFile.value = null
    uploadError.value = ''
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }

  } catch (error) {
    if (error instanceof ExtractionCancelled) {
      return
    }
    console.error('PDF upload error:', error)
    uploadError.value = error instanceof Error ? error.message : 'Unknown error occurred'
    emit('extractionError', error)
  } finally {
    clearInterval(elapsedTimer)
    isProcessingPdf.value = false
  }
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

.extractor-title {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 24px;
  font-weight: 600;
}

.beta-badge {
  display: inline-block;
  background: #e67e22;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  vertical-align: middle;
  margin-left: 8px;
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

.progress-note {
  color: #5a6c7d;
  font-size: 14px;
  margin: 0;
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

@media (min-width: 768px) {
  .upload-controls {
    flex-direction: row;
    justify-content: center;
  }
}
</style>

