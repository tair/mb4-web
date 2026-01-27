<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePublicMediaStore } from '@/stores/PublicMediaStore.js'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
import MediaCardComp from '@/components/project/MediaCardComp.vue'
import CustomModal from '@/components/project/CustomModal.vue'
import { apiService } from '@/services/apiService.js'

const route = useRoute()

const mediaStore = usePublicMediaStore()
const projectStore = usePublicProjectDetailsStore()
const projectId = route.params.id
const mediaId = route.params.mediaId
const thumbnailView = ref(true)
const orderByOptions = mediaStore.getOrderByOptions
let orderBySelection = ref(mediaStore.getDefaultOrderBy)
let searchStr = ref(route.query.search || null)

// Track selection state using a reactive object keyed by media_id
const selectedMedia = reactive({})

// Math CAPTCHA state for bulk download
const showBulkDownloadModal = ref(false)
const mathQuestion = ref('')
const mathAnswer = ref(null)
const userMathAnswer = ref('')
const isCaptchaVerified = ref(false)

// Tooltip constants
const downloadSelectedTooltip = 'Download original files for all selected media items.'

// Timeout ID for debouncing CAPTCHA regeneration
let captchaTimeoutId = null

onMounted(async () => {
  await mediaStore.fetchMediaFiles(projectId)
  // need to get project title
  await projectStore.fetchProject(projectId)
  
  // If there's a search query parameter, perform the search
  if (searchStr.value) {
    searchByStr()
  }
})

let selectedPage = ref(mediaStore.currentPage)
let selectedPageSize = ref(mediaStore.itemsPerPage)

function searchByStr() {
  mediaStore.filterMediaFiles(searchStr.value)
  mediaStore.recalculatePageInfo()
  mediaStore.fetchByPage()
}

function onResetSearch() {
  searchStr.value = ''
  searchByStr()
}

watch(orderBySelection, (currentValue, oldValue) => {
  mediaStore.sortByOption(currentValue)
  mediaStore.fetchByPage()
})

watch(selectedPage, (currentValue, oldValue) => {
  mediaStore.currentPage = currentValue
  mediaStore.fetchByPage()
})

watch(selectedPageSize, (currentValue, oldValue) => {
  mediaStore.itemsPerPage = currentValue
  mediaStore.currentPage = 1
  mediaStore.recalculatePageInfo()
  mediaStore.fetchByPage()
})

// Selection computed properties for batch operations
const allSelected = computed({
  get: function () {
    return (
      mediaStore.mediaList &&
      mediaStore.mediaList.length > 0 &&
      mediaStore.mediaList.every((b) => selectedMedia[b.media_id])
    )
  },
  set: function (value) {
    if (mediaStore.mediaList) {
      mediaStore.mediaList.forEach((b) => {
        selectedMedia[b.media_id] = value
      })
    }
  },
})

const someSelected = computed(() =>
  mediaStore.mediaList && mediaStore.mediaList.some((b) => selectedMedia[b.media_id])
)

const selectedCount = computed(() => {
  if (!mediaStore.mediaList) return 0
  return mediaStore.mediaList.filter((m) => selectedMedia[m.media_id]).length
})

// Math CAPTCHA functions
const generateMathQuestion = () => {
  let num1 = Math.floor(Math.random() * 10) + 1
  let num2 = Math.floor(Math.random() * 10) + 1
  const operators = ['+', '-', '×']
  const operator = operators[Math.floor(Math.random() * operators.length)]
  
  let answer
  switch (operator) {
    case '+':
      answer = num1 + num2
      break
    case '-':
      // Ensure positive result
      if (num1 < num2) {
        [num1, num2] = [num2, num1]
      }
      answer = num1 - num2
      break
    case '×':
      // Use smaller numbers for multiplication
      const smallNum1 = Math.floor(Math.random() * 5) + 1
      const smallNum2 = Math.floor(Math.random() * 5) + 1
      mathQuestion.value = `${smallNum1} × ${smallNum2} = ?`
      mathAnswer.value = smallNum1 * smallNum2
      userMathAnswer.value = ''
      isCaptchaVerified.value = false
      return
  }
  
  mathQuestion.value = `${num1} ${operator} ${num2} = ?`
  mathAnswer.value = answer
  userMathAnswer.value = ''
  isCaptchaVerified.value = false
}

const verifyMathAnswer = () => {
  const userAnswer = parseInt(userMathAnswer.value)
  isCaptchaVerified.value = userAnswer === mathAnswer.value
  
  // Clear any existing timeout to prevent multiple regenerations
  if (captchaTimeoutId !== null) {
    clearTimeout(captchaTimeoutId)
    captchaTimeoutId = null
  }
  
  if (!isCaptchaVerified.value && userMathAnswer.value !== '') {
    // Give user feedback but don't immediately regenerate
    captchaTimeoutId = setTimeout(() => {
      captchaTimeoutId = null
      if (!isCaptchaVerified.value && userMathAnswer.value !== '') {
        generateMathQuestion()
      }
    }, 1500)
  }
}

const resetCaptcha = () => {
  generateMathQuestion()
}

// Open bulk download modal
function openBulkDownloadModal() {
  if (!someSelected.value) return
  generateMathQuestion()
  showBulkDownloadModal.value = true
}

// Close bulk download modal
function closeBulkDownloadModal() {
  showBulkDownloadModal.value = false
  userMathAnswer.value = ''
  isCaptchaVerified.value = false
}

// Confirm bulk download after CAPTCHA verification
function confirmBulkDownload() {
  if (!isCaptchaVerified.value) {
    alert("Please complete the security verification before downloading.")
    return
  }
  
  downloadSelected()
  closeBulkDownloadModal()
}

function downloadSelected() {
  const selectedMediaFiles = mediaStore.mediaList
    .filter((m) => selectedMedia[m.media_id])
  
  if (selectedMediaFiles.length === 0) {
    return
  }
  
  // Download each selected media file individually using the existing serve endpoint
  // This approach uses the already established pattern for media serving from S3
  selectedMediaFiles.forEach((mediaFile, index) => {
    // Add a small delay between downloads to avoid overwhelming the browser
    setTimeout(() => {
      const downloadUrl = apiService.buildUrl(`/public/media/${projectId}/serve/${mediaFile.media_id}/original`)
      // Create a temporary link element to trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      // Extract extension from media file data or default to jpg
      // The backend will set Content-Disposition header, but we set download attribute for consistency
      const extension = getMediaExtension(mediaFile) || 'jpg'
      link.download = `M${mediaFile.media_id}.${extension}`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, index * 100) // 100ms delay between each download
  })
}

/**
 * Extract file extension from media file object
 * @param {Object} mediaFile - Media file object
 * @returns {string|null} File extension without dot, or null if not found
 */
function getMediaExtension(mediaFile) {
  if (!mediaFile) return null
  
  // Try to get extension from original filename
  if (mediaFile.original_filename) {
    const match = mediaFile.original_filename.match(/\.([a-z0-9]+)$/i)
    if (match) return match[1].toLowerCase()
  }
  
  // Try to get extension from media object
  if (mediaFile.media && mediaFile.media.original) {
    const original = mediaFile.media.original
    // Check S3 key
    if (original.s3_key || original.S3_KEY) {
      const s3Key = original.s3_key || original.S3_KEY
      const match = s3Key.match(/\.([a-z0-9]+)$/i)
      if (match) return match[1].toLowerCase()
    }
    // Check filename
    if (original.FILENAME) {
      const match = original.FILENAME.match(/\.([a-z0-9]+)$/i)
      if (match) return match[1].toLowerCase()
    }
  }
  
  // Try ORIGINAL_FILENAME in media object
  if (mediaFile.media && mediaFile.media.ORIGINAL_FILENAME) {
    const match = mediaFile.media.ORIGINAL_FILENAME.match(/\.([a-z0-9]+)$/i)
    if (match) return match[1].toLowerCase()
  }
  
  return null
}
</script>

<template>
  <ProjectLoaderComp
    :isLoading="mediaStore.isLoading"
    :errorMessage="mediaStore.media_files ? null : 'No media data available.'"
    basePath="project"
  >
    <p>
      This project has
      {{ mediaStore.full_media_files.length }} media files. Displaying
      {{ mediaStore.media_files.length }} media files.
    </p>

    <div class="row mb-3">
      <div class="col-5">
        <div class="mb-2">
          <label for="filter" class="me-2">Search for:</label>
          <input id="filter" v-model="searchStr" />
          <div class="mt-2">
            <button @click="searchByStr()" class="btn btn-sm btn-primary me-2">
              Submit
            </button>
            <button @click="onResetSearch()" class="btn btn-sm btn-primary btn-white">
              Clear
            </button>
          </div>
        </div>
        <div>
          <label for="order-by" class="me-2">Order by:</label>
          <select id="order-by" v-model="orderBySelection">
            <option
              v-for="(label, value) in orderByOptions"
              :key="value"
              :value="value"
            >
              {{ label }}
            </option>
          </select>
        </div>
      </div>
      <div class="d-flex col-7 justify-content-end">
        <div class="me-5">
          Showing page
          <select v-model="selectedPage">
            <option
              :selected="idx == 1"
              v-for="(idx, type) in mediaStore.totalPages"
              :value="idx"
            >
              {{ idx }}
            </option>
          </select>
          of {{ mediaStore.totalPages }} pages.
        </div>

        <div>
          Items per page:
          <select v-model="selectedPageSize">
            <option
              :selected="idx == 10"
              v-for="(idx, type) in [3, 5, 10, 25, 50, 100]"
              :value="idx"
            >
              {{ idx }}
            </option>
          </select>
        </div>
        <div class="ms-1">
          <button
            @click="thumbnailView = true"
            :style="{ backgroundColor: thumbnailView ? '#e0e0e0' : '#fff' }"
            title="thumbnail-view"
          >
            <i class="fa-solid fa-border-all"></i>
          </button>
        </div>
        <div class="ms-1">
          <button
            @click="thumbnailView = false"
            :style="{ backgroundColor: thumbnailView ? '#fff' : '#e0e0e0' }"
            title="mosaic-view"
          >
            <i class="fa-solid fa-table-cells"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Selection Bar for batch operations -->
    <div class="selection-bar mb-3">
      <label class="item" title="Select all">
        <input
          type="checkbox"
          class="form-check-input"
          v-model="allSelected"
          :indeterminate.prop="someSelected && !allSelected"
          aria-label="Select all items"
          title="Select all"
        />
        <span class="ms-1">{{
          someSelected
            ? `${selectedCount} selected`
            : 'Select All'
        }}</span>
      </label>
      <span
        class="item"
        :class="{ disabled: !someSelected }"
        @click="someSelected ? openBulkDownloadModal() : null"
        :title="downloadSelectedTooltip"
      >
        <i class="fa-solid fa-download"></i>
        <span class="ms-1">Download</span>
      </span>
    </div>

    <!-- Media List Content -->
    <div
      :class="[
        thumbnailView
          ? 'row row-cols-auto g-4 py-5'
          : 'row row-cols-auto g-2 py-3',
        'justify-content-start',
      ]"
    >
      <div
        class="col d-flex align-items-stretch"
        v-for="(media_file, n) in mediaStore.mediaList"
        :key="n"
      >
        <div class="media-card-wrapper position-relative">
          <router-link 
            :to="{ name: 'ProjectMediaDetailView', params: { id: projectId, mediaId: media_file.media_id } }" 
            class="nav-link"
          >
            <!-- Checkbox for selection -->
            <input
              class="form-check-input media-checkbox"
              type="checkbox"
              v-model="selectedMedia[media_file.media_id]"
              @click.stop=""
            />
            <MediaCardComp
              :key="media_file.media_id"
              :media_file="media_file"
              :full_view="thumbnailView"
              :project_id="projectId"
            ></MediaCardComp>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Bulk Download CAPTCHA Modal -->
    <CustomModal
      :isVisible="showBulkDownloadModal"
      @close="closeBulkDownloadModal"
    >
      <div>
        <h2>Copyright Warning</h2>
        <p>
          You are downloading {{ selectedCount }} media files from MorphoBank. If you plan to
          reuse these items you must check the copyright reuse policy in
          place for each item.<br />
          Please acknowledge that you have read and understood the
          copyright warning before proceeding with the download.
        </p>
        
        <!-- Math CAPTCHA Component -->
        <div class="math-captcha-container mb-3">
          <div class="math-captcha-header">
            <h5>Security Verification</h5>
            <small class="text-muted">Please solve this simple math problem to continue:</small>
          </div>
          
          <div class="math-captcha-question">
            <div class="d-flex align-items-center gap-2">
              <span class="math-problem fs-5 fw-bold">{{ mathQuestion }}</span>
              <input
                type="number"
                v-model="userMathAnswer"
                @input="verifyMathAnswer"
                class="form-control math-input"
                :class="{ 
                  'is-valid': isCaptchaVerified, 
                  'is-invalid': userMathAnswer !== '' && !isCaptchaVerified 
                }"
                placeholder="?"
                style="width: 80px;"
              />
              <button 
                type="button" 
                class="btn btn-sm btn-outline-secondary"
                @click="resetCaptcha"
                title="Get a new question"
              >
                <i class="fa fa-refresh"></i>
              </button>
            </div>
            <div v-if="isCaptchaVerified" class="text-success mt-1">
              <i class="fa fa-check-circle"></i> Verified!
            </div>
          </div>
        </div>
        
        <button
          class="btn btn-primary"
          :disabled="!isCaptchaVerified"
          :class="{ 'btn-success': isCaptchaVerified }"
          @click="confirmBulkDownload"
        >
          {{ isCaptchaVerified ? 'I Acknowledge and Download' : 'Complete Security Check First' }}
        </button>
      </div>
    </CustomModal>
  </ProjectLoaderComp>
</template>

<style scoped>
/* Button styles */
.btn-white {
  background-color: white;
  border: 1px solid #dee2e6;
  color: #212529;
}

.btn-white:hover {
  background-color: #f8f9fa;
  border-color: #adb5bd;
}

/* Selection bar styling */
.selection-bar {
  display: flex;
  gap: 5px;
  margin: 8px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
  border: 1px solid #dee2e6;
}

.selection-bar .item {
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  padding: 5px 10px;
}

.selection-bar .item:hover {
  background-color: #e9ecef;
}

.selection-bar .item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.selection-bar .item.disabled:hover {
  background-color: transparent;
}

/* Position checkbox over card */
.media-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  margin: 0;
}

.media-card-wrapper {
  position: relative;
}

.nav-link {
  position: relative;
  display: block;
  text-decoration: none;
}

.nav-link:hover {
  text-decoration: none;
}

/* Math CAPTCHA styling */
.math-captcha-container {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 15px;
}

.math-captcha-header {
  margin-bottom: 10px;
}

.math-captcha-header h5 {
  margin-bottom: 4px;
}

.math-problem {
  font-family: monospace;
}

.math-input {
  text-align: center;
  font-weight: bold;
}
</style>
