<template>
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li class="breadcrumb-item">
        <RouterLink to="/myprojects">My Projects</RouterLink>
      </li>
      <li class="breadcrumb-item">
        <RouterLink :to="`/myprojects/${projectId}/overview`">
          P{{ projectId }}
        </RouterLink>
      </li>
      <li class="breadcrumb-item">
        <RouterLink :to="{ name: 'MyProjectEditView', params: { id: projectId } }">
          Edit Project
        </RouterLink>
      </li>
    </ol>
  </nav>
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="isLoadingProject"
    :errorMessage="error || ''"
    basePath="myprojects"
  >
    <FormLayout title="EDIT PROJECT">
      <form @submit.prevent="handleSubmit" class="list-form">
      <!-- Basic Project Information -->
      <div class="form-group">
        <label class="form-label">
          Project Name
          <span class="required">Required</span>
        </label>
        <textarea
          v-model="formData.name"
          type="text"
          class="form-control"
          required
        />
      </div>

      <!-- Exemplar Media Upload -->
      <div class="form-group">
        <label class="form-label">
          Exemplar Media
          <Tooltip :content="getExemplarMediaTooltip()"></Tooltip>
        </label>

        <div class="exemplar-upload">
          <input
            type="file"
            @change="handleExemplarMediaUpload"
            accept="image/*"
            class="form-control"
          />
          <button
            v-if="formData.exemplar_media"
            type="button"
            @click="clearExemplarMedia"
            class="btn-link"
          >
            Clear
          </button>
        </div>

        <div v-if="formData.exemplar_media" class="media-result">
          <div class="media-result-caption">
            Selected file: {{ formData.exemplar_media.name }}
          </div>
        </div>
        <div v-else-if="existingExemplarMedia" class="media-result">
          <div class="media-result-caption">
            Current exemplar media (ID: {{ formData.exemplar_media_id }})
          </div>
        </div>
        <div v-else class="media-placeholder">
          <img src="/images/img_placeholder.jpg" alt="No media selected" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">
          Is your research project supported by the U.S. National Science
          Foundation?
          <span class="required">Required</span>
          <Tooltip :content="getNSFFundedTooltip()"></Tooltip>
        </label>
        <select v-model="formData.nsf_funded" class="form-control" required>
          <option value="">Select...</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      </div>

      <!-- Reviewer Access Section -->
      <h2 class="section-heading">
        SHARE MY DATA DURING REVIEW
        <Tooltip :content="getReviewerAccessTooltip()"></Tooltip>
      </h2>
      <div class="section-dividing-line"></div>

      <div class="form-group">
        <label class="form-label">
          Allow Reviewer Login
          <Tooltip :content="getAllowReviewerLoginTooltip()"></Tooltip>
        </label>
        <div class="form-check">
          <input
            type="checkbox"
            v-model="formData.allow_reviewer_login"
            class="form-check-input"
          />
          <span class="form-check-label"> Enable reviewer access </span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">
          Reviewer Login Password
          <span class="required" v-if="formData.allow_reviewer_login"
            >Required</span
          >
        </label>
        <div class="password-input-container">
          <input
            v-model="formData.reviewer_login_password"
            :type="showPassword ? 'text' : 'password'"
            class="form-control"
            :required="formData.allow_reviewer_login"
            :disabled="!formData.allow_reviewer_login"
          />
          <button
            type="button"
            class="password-toggle-btn"
            @click="togglePasswordVisibility"
            :disabled="!formData.allow_reviewer_login"
          >
            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
        </div>
      </div>

      <!-- Journal Publication Information -->
      <h2 class="section-heading">JOURNAL PUBLICATION INFORMATION</h2>
      <div class="section-dividing-line"></div>

      <p class="info-text">
        MorphoBank publicly displays data associated with peer-reviewed
        scientific research. The fields below must be completed for an
        investigator to release data ("publish") on MorphoBank. You are not
        required to complete these fields if your project is in preparation or
        in review and behind password protection.
      </p>

      <div class="form-group">
        <label class="form-label">
          Status of peer-reviewed publication?
          <span class="required">Required</span>
        </label>
        <p class="field-description">
          You must have a paper in press or published in a peer-reviewed journal
          to publish your project on MorphoBank.
        </p>
        <select
          v-model="formData.publication_status"
          class="form-control"
          required
        >
          <option value="0">Published</option>
          <option value="1">In press</option>
          <option value="2" selected>Article in prep or in review</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">
          Journal Title
          <span
            class="required"
            v-if="
              formData.publication_status === '0' ||
              formData.publication_status === '1'
            "
            >Required</span
          >
          <Tooltip :content="getJournalTitleTooltip()"></Tooltip>
        </label>
        <p class="field-description">
          Select a journal title from the list, or choose Add a new journal if
          the title is not available
        </p>
        <div
          v-if="!showNewJournal"
          class="searchable-dropdown"
          ref="journalDropdownRef"
        >
          <div
            class="dropdown-input"
            @click="showJournalDropdown = !showJournalDropdown"
          >
            <input
              type="text"
              class="form-control"
              v-model="journalSearch"
              :placeholder="
                formData.journal_title || 'Search and select a journal...'
              "
              @click.stop="
                () => {
                  showJournalDropdown = true
                  journalSearch = '' // Clear search when opening dropdown
                }
              "
              @input="handleJournalSearch"
              @keydown.down.prevent="navigateJournalDropdown(1)"
              @keydown.up.prevent="navigateJournalDropdown(-1)"
              @keydown.enter.prevent="selectJournalFromKeyboard"
              @keydown.esc="showJournalDropdown = false"
            />
            <span class="dropdown-arrow">▼</span>
          </div>
          <div v-if="showJournalDropdown" class="dropdown-options">
            <div v-if="isLoadingJournals" class="dropdown-option loading">
              <span
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Loading journals...
            </div>
            <template v-else>
              <div
                v-for="(journal, index) in filteredJournals"
                :key="journal"
                class="dropdown-option"
                :class="{
                  selected: selectedJournalIndex === index,
                  'is-selected': journal === formData.journal_title,
                }"
                @click="selectJournal(journal)"
                @mouseover="selectedJournalIndex = index"
              >
                {{ journal }}
              </div>
              <div
                v-if="filteredJournals.length === 0"
                class="dropdown-option no-results"
              >
                No journals found
              </div>
            </template>
          </div>
        </div>

        <div v-else class="manual-journal-input">
          <input
            v-model="formData.journal_title_other"
            type="text"
            class="form-control"
            placeholder="Enter new journal title"
          />
        </div>

        <div class="journal-mode-switch">
          <button type="button" @click="toggleJournalMode" class="btn-link">
            {{
              showNewJournal
                ? 'Switch to journal selection'
                : 'Or add new journal'
            }}
          </button>
        </div>

        <!-- Journal Cover Display -->
        <div v-if="!showNewJournal" class="journal-cover-container">
          <div v-if="journalCoverPath" class="journal-cover-wrapper">
            <img
              :src="journalCoverPath"
              alt="Journal Cover"
              class="journal-cover"
            />
          </div>
          <div
            v-else-if="formData.journal_title"
            class="journal-cover-placeholder"
          >
            Logo not yet available for this journal
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">
          Abstract
          <span
            class="required"
            v-if="
              formData.publication_status === '0' ||
              formData.publication_status === '1'
            "
            >Required</span
          >
        </label>
        <textarea
          v-model="formData.description"
          class="form-control"
          rows="6"
          :required="
            formData.publication_status === '0' ||
            formData.publication_status === '1'
          "
          placeholder="Enter the abstract of your article"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">
          Article authors separated by commas (example: H.-D. Sues, E. Frey, D.
          M. Martill, D. M. Scott)
          <span
            class="required"
            v-if="
              formData.publication_status === '0' ||
              formData.publication_status === '1'
            "
            >Required</span
          >
        </label>
        <textarea
          v-model="formData.article_authors"
          class="form-control"
          rows="3"
          :required="
            formData.publication_status === '0' ||
            formData.publication_status === '1'
          "
          placeholder="Enter article authors separated by commas"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">
          Article Title
          <span
            class="required"
            v-if="
              formData.publication_status === '0' ||
              formData.publication_status === '1'
            "
            >Required</span
          >
        </label>
        <textarea
          v-model="formData.article_title"
          class="form-control"
          rows="3"
          :required="
            formData.publication_status === '0' ||
            formData.publication_status === '1'
          "
          placeholder="Enter the full title of your article"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">
          Journal url (link to published article)
          <span class="required" v-if="formData.publication_status === '0'"
            >Required</span
          >
        </label>
        <input
          v-model="formData.journal_url"
          type="url"
          class="form-control"
          :required="formData.publication_status === '0'"
        />
      </div>

      <div class="form-group">
        <label class="form-label">
          Journal Volume
          <span class="required" v-if="formData.publication_status === '0'"
            >Required</span
          >
        </label>
        <input
          v-model="formData.journal_volume"
          type="text"
          class="form-control"
          :required="formData.publication_status === '0'"
        />
      </div>

      <div class="form-group">
        <label class="form-label"> Journal Number </label>
        <input
          v-model="formData.journal_number"
          type="text"
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label class="form-label">
          Journal Year
          <span
            class="required"
            v-if="
              formData.publication_status === '0' ||
              formData.publication_status === '1'
            "
            >Required</span
          >
        </label>
        <input
          v-model="formData.journal_year"
          type="number"
          class="form-control"
          :required="
            formData.publication_status === '0' ||
            formData.publication_status === '1'
          "
        />
      </div>

      <div class="form-group">
        <label class="form-label">
          Article pagination (example: 5-15)
          <span class="required" v-if="formData.publication_status === '0'"
            >Required</span
          >
        </label>
        <input
          v-model="formData.article_pp"
          type="text"
          class="form-control"
          :required="formData.publication_status === '0'"
        />
      </div>

      <div class="form-group">
        <label class="form-label">
          Journal cover image
          <Tooltip :content="getJournalCoverTooltip()"></Tooltip>
        </label>
        <div class="journal-cover-upload">
          <input
            type="file"
            @change="handleJournalCoverUpload"
            accept="image/*"
            class="form-control"
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">
          Article DOI
          <Tooltip :content="TOOLTIP_ARTICLE_DOI"></Tooltip>
        </label>
        <p class="field-description">
          This information will be used to automatically create a bibliographic
          reference. Changes made here will update the reference.
        </p>
        <div class="doi-input">
          <input
            v-model="formData.article_doi"
            type="text"
            class="form-control"
            placeholder="10.xxxx/xxxxx"
          />
          <button
            type="button"
            @click="retrieveDOI"
            class="btn-link"
            title="Retrieve article information using DOI"
          >
            Retrieve
          </button>
        </div>
      </div>

      <div class="form-buttons">
        <button
          type="button"
          @click="cancel"
          class="btn btn-outline-primary"
          :disabled="isLoading"
        >
          Cancel
        </button>
        <button
          type="submit"
          :class="projectUpdated ? 'btn btn-success' : 'btn btn-primary'"
          :disabled="isLoading"
        >
          <span
            v-if="isLoading && !projectUpdated"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          <span v-if="projectUpdated" class="me-2">✓</span>
          {{ isLoading ? getLoadingText() : 'Update' }}
        </button>
      </div>
      </form>
    </FormLayout>
  </ProjectContainerComp>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useProjectOverviewStore } from '@/stores/ProjectOverviewStore'
import { useUserStore } from '@/stores/UserStore'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import axios from 'axios'
import {
  getNSFFundedTooltip,
  getExemplarMediaTooltip,
  getReviewerAccessTooltip,
  getAllowReviewerLoginTooltip,
  getDiskSpaceUsageTooltip,
  getJournalTitleTooltip,
  getJournalCoverTooltip,
  TOOLTIP_ARTICLE_DOI,
} from '@/utils/util.js'

import Tooltip from '@/components/main/Tooltip.vue'
import FormLayout from '@/components/main/FormLayout.vue'
import '@/assets/css/form.css'

const router = useRouter()
const route = useRoute()
const projectId = route.params.id
const projectsStore = useProjectsStore()
const projectOverviewStore = useProjectOverviewStore()
const userStore = useUserStore()

const formData = reactive({
  name: '',
  nsf_funded: '',
  allow_reviewer_login: false,
  reviewer_login_password: '',
  journal_title: '',
  journal_title_other: '',
  article_authors: '',
  article_title: '',
  article_doi: '',
  journal_year: '',
  journal_volume: '',
  journal_number: '',
  journal_url: '',
  article_pp: '',
  description: '',
  disk_space_usage: 5368709120, // Default 5GB in bytes
  publication_status: '2', // Default to "Article in prep or in review"
  journal_cover: null, // Journal cover file
  exemplar_media: null, // Exemplar media file
  exemplar_media_id: null, // Existing exemplar media ID
})

const journalSearch = ref('')
const showNewJournal = ref(false)
const journals = ref([])
const journalCoverPath = ref(null)
const isLoading = ref(false)
const isLoadingProject = ref(true)
const error = ref(null)
const showJournalDropdown = ref(false)
const journalCoverFile = ref(null)
const journalDropdownRef = ref(null)
const selectedJournalIndex = ref(-1)
const isLoadingJournals = ref(false)
const showPassword = ref(false)
const existingExemplarMedia = ref(false)

// Computed property for filtered journals based on search
const filteredJournals = computed(() => {
  if (!journalSearch.value) return journals.value

  const searchTerm = journalSearch.value.toLowerCase()
  return journals.value.filter((journal) =>
    journal.toLowerCase().includes(searchTerm)
  )
})

onMounted(async () => {
  await Promise.all([loadJournals(), loadProjectData()])
  // Add click outside event listener
  document.addEventListener('click', handleJournalClickOutside)
})

// Clean up event listener
onUnmounted(() => {
  document.removeEventListener('click', handleJournalClickOutside)
})

async function loadProjectData() {
  try {
    isLoadingProject.value = true

    // Fetch project overview data which includes most fields we need
    await projectOverviewStore.fetchProject(projectId)
    const overview = projectOverviewStore.overview

    if (!overview) {
      throw new Error('Project not found')
    }

    // Map the overview data to our form fields
    formData.name = overview.name || ''
    formData.description = overview.description || ''
    formData.nsf_funded =
      overview.nsf_funded !== null ? String(overview.nsf_funded) : ''
    formData.journal_title = overview.journal_title || ''
    formData.journal_url = overview.journal_url || ''
    formData.journal_volume = overview.journal_volume || ''
    formData.journal_number = overview.journal_number || ''
    formData.journal_year = overview.journal_year || ''
    formData.article_authors = overview.article_authors || ''
    formData.article_title = overview.article_title || ''
    formData.article_pp = overview.article_pp || ''
    formData.article_doi = overview.article_doi || ''
    formData.exemplar_media_id = overview.exemplar_media_id || null
    formData.disk_space_usage = overview.disk_usage_limit || 5368709120

    // Set flags for existing media
    existingExemplarMedia.value = !!overview.exemplar_media_id

    // Determine publication status based on available data
    if (
      overview.journal_url &&
      overview.journal_volume &&
      overview.article_pp
    ) {
      formData.publication_status = '0' // Published
    } else if (overview.journal_title && overview.journal_year) {
      formData.publication_status = '1' // In press
    } else {
      formData.publication_status = '2' // In prep or review
    }

    // Handle journal title - check if it exists in the journals list
    if (formData.journal_title) {
      const journalExists = journals.value.some(
        (journal) =>
          journal.toLowerCase() === formData.journal_title.toLowerCase()
      )

      if (!journalExists) {
        showNewJournal.value = true
        formData.journal_title_other = formData.journal_title
        formData.journal_title = ''
      } else {
        loadJournalCover(formData.journal_title)
      }
    }

    // Note: reviewer settings are not exposed in overview, so we'll keep defaults
    // Users can still update them if needed
  } catch (err) {
    console.error('Error loading project data:', err)
    error.value = 'Failed to load project data'
  } finally {
    isLoadingProject.value = false
  }
}

// Keyboard navigation for journal dropdown
function navigateJournalDropdown(direction) {
  if (!showJournalDropdown.value || filteredJournals.value.length === 0) return

  const newIndex = selectedJournalIndex.value + direction
  if (newIndex >= 0 && newIndex < filteredJournals.value.length) {
    selectedJournalIndex.value = newIndex
  }
}

function selectJournalFromKeyboard() {
  if (
    selectedJournalIndex.value >= 0 &&
    selectedJournalIndex.value < filteredJournals.value.length
  ) {
    selectJournal(filteredJournals.value[selectedJournalIndex.value])
  }
}

async function loadJournals() {
  try {
    isLoadingJournals.value = true
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/projects/journals`
    )
    journals.value = response.data
  } catch (error) {
    console.error('Error loading journals:', error)
  } finally {
    isLoadingJournals.value = false
  }
}

function handleExemplarMediaUpload(event) {
  const file = event.target.files[0]
  if (file) {
    formData.exemplar_media = file
    existingExemplarMedia.value = false
  }
}

function clearExemplarMedia() {
  formData.exemplar_media = null
  existingExemplarMedia.value = false
  formData.exemplar_media_id = null
}

function toggleJournalMode() {
  showNewJournal.value = !showNewJournal.value
  if (showNewJournal.value) {
    // Clear selection mode data
    formData.journal_title = ''
    journalSearch.value = ''
    showJournalDropdown.value = false
    selectedJournalIndex.value = -1
  } else {
    // Clear manual input data
    formData.journal_title_other = ''
  }
  // Reset journal cover
  journalCoverPath.value = null
}

// Load journal cover when journal is selected
const loadJournalCover = async (journalTitle) => {
  if (!journalTitle || showNewJournal.value) {
    journalCoverPath.value = null
    return
  }

  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/projects/journal-cover`,
      {
        params: { journalTitle },
      }
    )

    // Set the journal cover path directly without verification
    if (response.data.coverPath) {
      journalCoverPath.value = response.data.coverPath
    } else {
      journalCoverPath.value = null
    }
  } catch (err) {
    console.error('Error loading journal cover:', err)
    journalCoverPath.value = null
  }
}

// Update handleJournalChange to handle both modes
function handleJournalChange() {
  const journalTitle = showNewJournal.value
    ? formData.journal_title_other
    : formData.journal_title
  if (journalTitle && !showNewJournal.value) {
    loadJournalCover(journalTitle)
  } else {
    journalCoverPath.value = null
  }
}

// Watch for changes in both journal title fields
watch(() => formData.journal_title, handleJournalChange)
watch(() => formData.journal_title_other, handleJournalChange)
watch(
  () => showNewJournal.value,
  (newValue) => {
    if (newValue) {
      journalCoverPath.value = null
    } else if (formData.journal_title) {
      loadJournalCover(formData.journal_title)
    }
  }
)

function selectJournal(journal) {
  formData.journal_title = journal
  journalSearch.value = journal
  showJournalDropdown.value = false
  selectedJournalIndex.value = -1
  handleJournalChange()
}

function clearSelectedJournal() {
  formData.journal_title = ''
  journalCoverPath.value = null
}

function handleJournalBlur() {
  // Delay hiding the dropdown to allow for click events
  setTimeout(() => {
    showJournalDropdown.value = false
  }, 200)
}

async function retrieveDOI() {
  if (!formData.article_doi) return

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/projects/doi`,
      {
        article_doi: formData.article_doi,
        newProject: false, // Since this is EditView, we're editing an existing project
      }
    )

    if (response.data.status === 'ok') {
      const fields = response.data.fields

      // Handle each field from the response
      for (const [field, value] of Object.entries(fields)) {
        if (!value) continue

        if (field === 'journal_title') {
          // Check if journal exists in the dropdown
          const journalExists = journals.value.some(
            (journal) => journal.toLowerCase() === value.toLowerCase()
          )

          if (journalExists) {
            formData.journal_title = value
            showNewJournal.value = false
          } else {
            // Switch to manual journal input mode
            showNewJournal.value = true
            formData.journal_title_other = value
          }
        } else {
          // Set other fields directly
          formData[field] = value
        }
      }
    } else {
      alert(response.data.errors.join('\n'))
    }
  } catch (error) {
    console.error('Error retrieving DOI:', error)
    alert('Failed to retrieve DOI information. Please try again.')
  }
}

function handleJournalCoverUpload(event) {
  const file = event.target.files[0]
  if (file) {
    formData.journal_cover = file
  }
}

async function handleSubmit() {
  isLoading.value = true
  error.value = null

  try {
    // Validate form
    if (!validateForm()) {
      isLoading.value = false
      return
    }

    // Create JSON object for project update
    const projectData = {}

    // Add all form fields to JSON
    for (const [key, value] of Object.entries(formData)) {
      if (key === 'journal_cover' || key === 'exemplar_media') {
        // Skip file uploads - will be passed separately
        continue
      } else if (key === 'allow_reviewer_login') {
        // Ensure allow_reviewer_login is sent as 0 or 1
        projectData[key] = value === true || value === '1' ? '1' : '0'
      } else {
        // Convert all values to strings to ensure proper transmission
        const stringValue =
          value !== null && value !== undefined ? String(value) : ''
        projectData[key] = stringValue
      }
    }

    // Update project with optional journal cover and exemplar media
    const success = await updateProject(
      projectData,
      formData.journal_cover,
      formData.exemplar_media
    )

    if (!success) {
      throw new Error('Failed to update project')
    }

    // Show success state briefly before redirecting
    projectUpdated.value = true
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Force full page refresh to bypass any cached 404 responses
    window.location.href = `/myprojects/${projectId}/overview`
  } catch (err) {
    console.error('Error in handleSubmit:', err)
    error.value =
      err.response?.data?.message ||
      'An error occurred while updating the project'
  } finally {
    isLoading.value = false
  }
}

async function updateProject(
  projectData,
  journalCoverFile = null,
  exemplarMediaFile = null
) {
  try {
    let requestData
    let headers = {}

    if (journalCoverFile || exemplarMediaFile) {
      // Use FormData for file upload
      const formData = new FormData()

      // Add all project data as JSON string
      formData.append('projectData', JSON.stringify(projectData))

      // Add journal cover file if provided
      if (journalCoverFile) {
        formData.append('journal_cover', journalCoverFile)
      }

      // Add exemplar media file if provided
      if (exemplarMediaFile) {
        formData.append('exemplar_media', exemplarMediaFile)
      }

      requestData = formData
      // Don't set Content-Type header - let browser set it with boundary
    } else {
      // Use JSON for project data only
      requestData = { project: projectData }
      headers = {
        'Content-Type': 'application/json',
      }
    }

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/projects/${projectId}/edit`,
      requestData,
      { headers }
    )

    // Refresh the projects cache
    if (response.status === 200) {
      await projectsStore.fetchProjects(true) // Force refresh
    }

    return response.status === 200
  } catch (error) {
    console.error('Error updating project:', error.response || error)
    throw error
  }
}

function validateForm() {
  // Basic validation
  if (!formData.name || formData.nsf_funded === '') {
    alert('Please fill in all required fields')
    return false
  }

  // Reviewer password validation
  if (
    formData.allow_reviewer_login &&
    (!formData.reviewer_login_password ||
      formData.reviewer_login_password.trim() === '')
  ) {
    alert(
      'Please enter a reviewer login password when reviewer access is enabled'
    )
    return false
  }

  // Journal validation based on publication status
  if (
    formData.publication_status === '0' ||
    formData.publication_status === '1'
  ) {
    if (formData.journal_title === '' && formData.journal_title_other === '') {
      alert('Please enter journal title information')
      return false
    }

    // Required fields for both Published and In press
    const commonRequiredFields = [
      'description',
      'article_authors',
      'article_title',
      'journal_year',
    ]

    for (const field of commonRequiredFields) {
      // Handle both string and number values
      if (
        formData[field] === undefined ||
        formData[field] === null ||
        (typeof formData[field] === 'string' &&
          formData[field].trim() === '') ||
        (typeof formData[field] === 'number' && isNaN(formData[field]))
      ) {
        alert(`Please fill in ${field.replace(/_/g, ' ')}`)
        return false
      }
    }

    // Additional required fields for Published status
    if (formData.publication_status === '0') {
      const publishedRequiredFields = [
        'journal_url',
        'journal_volume',
        'journal_number',
        'article_pp',
      ]

      for (const field of publishedRequiredFields) {
        // Handle both string and number values
        if (
          formData[field] === undefined ||
          formData[field] === null ||
          (typeof formData[field] === 'string' &&
            formData[field].trim() === '') ||
          (typeof formData[field] === 'number' && isNaN(formData[field]))
        ) {
          alert(`Please fill in ${field.replace(/_/g, ' ')}`)
          return false
        }
      }
    }
  }

  // Author format validation
  if (formData.article_authors && formData.article_authors.includes(' and ')) {
    alert('Article authors must be separated by commas, not "and"')
    return false
  }

  // DOI format validation
  if (formData.article_doi && !formData.article_doi.match(/^10\..*\/\S+$/)) {
    alert(
      'Invalid DOI format. Please enter the DOI as provided by the publisher.'
    )
    return false
  }

  return true
}

function cancel() {
  router.push(`/myprojects/${projectId}/overview`)
}

// Add click outside handler for journal dropdown
const handleJournalClickOutside = (event) => {
  if (
    journalDropdownRef.value &&
    !journalDropdownRef.value.contains(event.target)
  ) {
    showJournalDropdown.value = false
  }
}

// Update the handleJournalSearch function
function handleJournalSearch() {
  showJournalDropdown.value = true
  selectedJournalIndex.value = -1
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

const projectUpdated = ref(false)

function getLoadingText() {
  if (projectUpdated.value) {
    return 'Project updated successfully!'
  }

  const hasJournalCover = formData.journal_cover
  const hasExemplarMedia = formData.exemplar_media

  if (hasJournalCover && hasExemplarMedia) {
    return 'Uploading images and updating project...'
  } else if (hasJournalCover) {
    return 'Uploading journal cover and updating project...'
  } else if (hasExemplarMedia) {
    return 'Uploading exemplar media and updating project...'
  } else {
    return 'Updating project...'
  }
}
</script>

<style scoped>
/* Keep only unique styles specific to this component */
.media-selection {
  display: flex;
  align-items: center;
  gap: 10px;
}

.media-result {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.media-result-img img {
  max-width: 150px;
  max-height: 150px;
  object-fit: cover;
}

.media-placeholder img {
  max-width: 150px;
  max-height: 150px;
  object-fit: cover;
  opacity: 0.5;
}

.doi-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

.info-text {
  color: #666;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.journal-cover-container {
  margin-top: 15px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.journal-cover-wrapper {
  text-align: center;
}

.journal-cover {
  max-width: 200px;
  max-height: 100px;
  object-fit: contain;
  border: 1px solid #ddd;
  padding: 5px;
  background-color: white;
}

.journal-cover-placeholder {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 10px;
}

.journal-selection {
  position: relative;
  margin-bottom: 10px;
}

.searchable-dropdown {
  position: relative;
  margin-bottom: 10px;
}

.dropdown-input {
  position: relative;
  display: flex;
  align-items: center;
}

.dropdown-arrow {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: #666;
}

.dropdown-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.dropdown-option {
  padding: 8px 12px;
  cursor: pointer;
}

.dropdown-option:hover,
.dropdown-option.selected {
  background-color: #f5f5f5;
}

.dropdown-option.loading {
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.dropdown-option.no-results {
  color: #666;
  text-align: center;
  padding: 12px;
}

.spinner-border {
  width: 1rem;
  height: 1rem;
  border-width: 0.15em;
}

.selected-journal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 10px;
}

.selected-journal-text {
  font-weight: 500;
}

.journal-cover-upload {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.dropdown-option.is-selected {
  background-color: #e3f2fd;
  font-weight: 500;
}

.dropdown-option.is-selected:hover {
  background-color: #bbdefb;
}

.journal-mode-switch {
  margin: 10px 0;
  text-align: right;
}

.manual-journal-input {
  margin-bottom: 10px;
}

.btn-link {
  color: var(--mb-orange);
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.btn-link:hover {
  text-decoration: underline;
  color: var(--mb-orange-dark);
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-toggle-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.password-toggle-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.password-toggle-btn:hover:not(:disabled) {
  color: var(--mb-orange);
}

.exemplar-upload {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #f9f9f9;
  display: flex;
  align-items: center;
  gap: 10px;
}

.exemplar-upload .form-control {
  flex: 1;
}

.exemplar-upload .form-label {
  margin-bottom: 5px;
  font-size: 0.9em;
  color: #666;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.15em;
}
</style>
