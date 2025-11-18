<template>
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li class="breadcrumb-item">
        <RouterLink to="/projects">Published Projects</RouterLink>
      </li>
      <li class="breadcrumb-item">
        <RouterLink :to="`/project/${projectId}/overview`">
          P{{ projectId }}
        </RouterLink>
      </li>
      <li class="breadcrumb-item">
        <RouterLink :to="{ name: 'ProjectEditView', params: { id: projectId } }">
          Edit Project
        </RouterLink>
      </li>
    </ol>
  </nav>
  <ProjectLoaderComp
    :projectId="projectId"
    :isLoading="isLoadingProject"
    :errorMessage="error || null"
    basePath="project"
  >
    <FormLayout title="EDIT PROJECT">
      <form @submit.prevent="handleSubmit" class="list-form">
      <div v-if="showCacheWarning" class="cache-warning-banner">
        <i class="fa fa-info-circle me-2"></i>
        <span>Project updates may take a few minutes to reflect. Please refresh the page manually to see updates as old values may be cached by your browser.</span>
        <button 
          type="button" 
          class="cache-warning-close" 
          @click="showCacheWarning = false"
          aria-label="Dismiss warning"
        >
          <i class="fa fa-times"></i>
        </button>
      </div>
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

      <!-- Exemplar Media Selection -->
      <div class="form-group">
        <label class="form-label">
          Exemplar Media
          <Tooltip :content="getExemplarMediaTooltip()"></Tooltip>
        </label>

        <!-- Loading state -->
        <div v-if="isLoadingCuratedMedia" class="alert alert-secondary">
          <i class="fa fa-spinner fa-spin me-2"></i>
          Loading curated media...
        </div>

        <!-- If project has curated media -->
        <div v-else-if="curatedMedia.length > 0">
          <select 
            v-model="formData.exemplar_media_id" 
            class="form-control"
          >
            <option :value="null">No exemplar selected</option>
            <option 
              v-for="media in curatedMedia" 
              :key="media.media_id"
              :value="media.media_id"
            >
              Media #{{ media.media_id }}{{ getMediaDescription(media) }}
            </option>
          </select>
          
          <!-- Show preview of selected exemplar -->
          <div v-if="selectedExemplarMedia" class="media-preview mt-3 p-3" style="
            background: linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%);
            border: 2px solid #FFD700;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.2);
          ">
            <div class="d-flex align-items-start gap-2 mb-2">
              <span style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 10px;
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #000;
                font-size: 0.7rem;
                font-weight: 600;
                border-radius: 12px;
                box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
              ">
                <i class="fa fa-star" style="font-size: 0.75rem;"></i>
                <span style="letter-spacing: 0.3px;">PROJECT EXEMPLAR</span>
              </span>
              <span class="text-muted" style="font-size: 0.85rem;">Media #{{ selectedExemplarMedia.media_id }}</span>
            </div>
            <div class="text-center">
              <img 
                :src="getMediaThumbnailUrl(selectedExemplarMedia)" 
                alt="Exemplar preview"
                class="img-thumbnail"
                style="max-width: 300px; max-height: 300px; object-fit: contain; background: white;"
              />
            </div>
            <div class="mt-2 text-muted text-center">
              <small>
                <i class="fa fa-bone me-1"></i>{{ stripHtmlTags(selectedExemplarMedia.specimen_name) || `Specimen #${selectedExemplarMedia.specimen_id}` }}
                <i class="fa fa-eye ms-3 me-1"></i>{{ selectedExemplarMedia.view_name || getViewName(selectedExemplarMedia.view_id) }}
              </small>
            </div>
          </div>
        </div>

        <!-- If no curated media exists (only show after loading completes) -->
        <div v-else class="alert alert-info">
          <i class="fa fa-info-circle me-2"></i>
          No curated media available. 
          <RouterLink :to="`/myprojects/${projectId}/media/create`" class="alert-link">
            Upload and curate media first
          </RouterLink>
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

      <!-- Project Administrator Section -->
      <h2 class="section-heading">PROJECT ADMINISTRATOR</h2>
      <div class="section-dividing-line"></div>

      <div class="form-group">
        <label class="form-label">
          Change Project Admin <br>
          (Select a user from the list to promote them to Project Administrator)
        </label>
        <select v-model="selectedAdminUserId" class="form-control">
          <option v-for="opt in adminDropdownOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <div v-if="adminSelectionChanged" class="alert alert-danger" role="alert">
          You are about to change this project's administrator and will lose access to this form upon saving. Only project administrators can edit project information.
        </div>
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
          Reviewer Login Password (password not displayed for privacy)
          <span class="required" v-if="formData.allow_reviewer_login && !originalAllowReviewerLogin"
            >Required</span
          >
        </label>
        <div class="password-input-container">
          <input
            v-model="formData.reviewer_login_password"
            :type="showPassword ? 'text' : 'password'"
            class="form-control"
            :disabled="!formData.allow_reviewer_login"
            placeholder="Leave empty to keep existing password"
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
          Article DOI
          <Tooltip :content="TOOLTIP_ARTICLE_DOI"></Tooltip>
        </label>
        <p class="field-description">
          This information will be used to automatically create a bibliographic
          reference and populate fields below. Changes made here will update the reference.
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
          Journal cover image (if missing above)
          <Tooltip :content="getJournalCoverTooltip()"></Tooltip>
        </label>

        <!-- Display current uploaded journal cover -->
        <div v-if="currentJournalCoverUrl" class="current-journal-cover-container">
          <div class="current-journal-cover-wrapper">
            <img
              :src="currentJournalCoverUrl"
              alt="Current Journal Cover"
              class="current-journal-cover"
            />
            <div class="current-journal-cover-info">
              <div class="current-journal-cover-filename">
                Current: {{ currentJournalCover?.ORIGINAL_FILENAME || currentJournalCover?.filename }}
              </div>
              <button
                type="button"
                @click="clearCurrentJournalCover"
                class="btn-link remove-cover-btn"
              >
                Remove current cover
              </button>
            </div>
          </div>
        </div>

        <div class="journal-cover-upload">
          <input
            type="file"
            @change="handleJournalCoverUpload"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,image/tiff"
            class="form-control"
            :disabled="isJournalCoverUploadDisabled"
          />
          <small v-if="isJournalCoverUploadDisabled && !currentJournalCoverUrl" class="form-text text-muted">
            Journal cover already available from selected journal
          </small>
          <small v-if="currentJournalCoverUrl" class="form-text text-muted">
            Upload a new image to replace the current journal cover
          </small>
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
        <label class="form-label">
          Journal Number
          <span class="required" v-if="formData.publication_status === '0'"
            >Required</span
          >
        </label>
        <input
          v-model="formData.journal_number"
          type="text"
          class="form-control"
          :required="formData.publication_status === '0'"
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
          type="button"
          @click="showDeleteConfirmation"
          class="btn btn-outline-danger"
          :disabled="isLoading"
        >
          <i class="fas fa-trash-alt me-2"></i>
          Delete Project
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

      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteDialog"
        class="modal-overlay"
        @click="hideDeleteConfirmation"
      >
        <div class="modal-dialog" @click.stop>
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                Delete Project
              </h5>
            </div>
            <div class="modal-body">
              <p>
                Are you sure you want to delete this project?
              </p>
              <div class="alert alert-warning">
                <strong>Warning:</strong> This action cannot be undone. The project will be permanently deleted.
              </div>
              <p class="mb-0">
                <strong>Project:</strong> {{ formData.name }}
              </p>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="hideDeleteConfirmation"
                :disabled="isDeleting"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-danger"
                @click="deleteProject"
                :disabled="isDeleting"
              >
                <span
                  v-if="isDeleting"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                {{ isDeleting ? 'Deleting...' : 'Delete Project' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      </form>
    </FormLayout>
  </ProjectLoaderComp>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useProjectOverviewStore } from '@/stores/ProjectOverviewStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useUserStore } from '@/stores/UserStore'
import { useNotifications } from '@/composables/useNotifications'
import ProjectLoaderComp from '@/components/project/ProjectLoaderComp.vue'
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
import { apiService } from '@/services/apiService.js'

const router = useRouter()
const route = useRoute()
const projectId = route.params.id
const projectsStore = useProjectsStore()
const projectOverviewStore = useProjectOverviewStore()
const projectUsersStore = useProjectUsersStore()
const userStore = useUserStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()

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
  exemplar_media_id: null, // Existing exemplar media ID (selected from dropdown)
})

const journalSearch = ref('')
const showNewJournal = ref(false)
const journals = ref([])
const journalCoverPath = ref(null)
const currentJournalCover = ref(null) // Current uploaded journal cover data
const currentJournalCoverUrl = ref(null) // URL for current uploaded journal cover
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
const showDeleteDialog = ref(false)
const isDeleting = ref(false)
const originalAllowReviewerLogin = ref(false)
const selectedAdminUserId = ref(null)
const originalAdminUserId = ref(null)
const curatedMedia = ref([])
const mediaViews = ref([])
const isLoadingCuratedMedia = ref(false)
const showCacheWarning = ref(true)

// Computed property for filtered journals based on search
const filteredJournals = computed(() => {
  if (!journalSearch.value) return journals.value

  const searchTerm = journalSearch.value.toLowerCase()
  return journals.value.filter((journal) =>
    journal.toLowerCase().includes(searchTerm)
  )
})

// Computed property to determine if journal cover upload should be disabled
const isJournalCoverUploadDisabled = computed(() => {
  // Disable if we're in journal selection mode AND we have a valid journal cover from journal title
  // OR if we have a current uploaded journal cover
  return (!showNewJournal.value && !!journalCoverPath.value) || !!currentJournalCoverUrl.value
})

// Computed property for selected exemplar media
const selectedExemplarMedia = computed(() => {
  if (!formData.exemplar_media_id) return null
  return curatedMedia.value.find(m => m.media_id === formData.exemplar_media_id)
})

onMounted(async () => {
  // Load journals first, then load project data (which needs journals list to check if journal exists)
  await loadJournals()
  await Promise.all([loadProjectData(), loadProjectUsers(), fetchCuratedMedia(), fetchMediaViews()])
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

    // Load current journal cover if exists
    await loadCurrentJournalCover(overview.journal_cover)

    // Set reviewer login settings
    const reviewerLoginEnabled = overview.allow_reviewer_login === 1 || overview.allow_reviewer_login === true
    formData.allow_reviewer_login = reviewerLoginEnabled
    originalAllowReviewerLogin.value = reviewerLoginEnabled
    // Never populate the password field for security reasons - always leave empty
    formData.reviewer_login_password = ''

    // Map journal_in_press from database to publication_status in form
    // journal_in_press: 0 = Published, 1 = In press, 2 = Article in prep or in review
    formData.publication_status = overview.journal_in_press !== null && overview.journal_in_press !== undefined 
      ? String(overview.journal_in_press) 
      : '2' // Default to "Article in prep or in review"

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
        // Set journalSearch to show the current journal title in the input
        journalSearch.value = formData.journal_title
        loadJournalCover(formData.journal_title)
      }
    }


  } catch (err) {
    console.error('Error loading project data:', err)
    error.value = 'Failed to load project data'
  } finally {
    isLoadingProject.value = false
  }
}

async function loadProjectUsers() {
  try {
    if (!projectUsersStore.isLoaded) {
      await projectUsersStore.fetchUsers(projectId)
    }
    setOriginalAdminFromStore()
  } catch (e) {
    console.error('Error loading project users:', e)
  }
}

function setOriginalAdminFromStore() {
  const currentAdmin = projectUsersStore.users.find((u) => u.admin)
  if (currentAdmin) {
    originalAdminUserId.value = currentAdmin.user_id
    if (selectedAdminUserId.value == null) {
      selectedAdminUserId.value = currentAdmin.user_id
    }
  }
}

const adminDropdownOptions = computed(() => {
  const users = projectUsersStore.users || []
  if (!users.length) return []

  const admin = users.find((u) => u.admin)
  const others = users.filter((u) => !u.admin)
    .sort((a, b) => {
      const nameA = `${a.fname || ''} ${a.lname || ''}`.trim().toLowerCase()
      const nameB = `${b.fname || ''} ${b.lname || ''}`.trim().toLowerCase()
      return nameA.localeCompare(nameB)
    })

  const options = []
  if (admin) {
    const adminName = `${admin.fname || ''} ${admin.lname || ''}`.trim() || admin.email
    options.push({ value: admin.user_id, label: `${adminName} *Current Admin*` })
  }
  for (const u of others) {
    const name = `${u.fname || ''} ${u.lname || ''}`.trim() || u.email
    options.push({ value: u.user_id, label: `${name} (${u.email})` })
  }
  return options
})

const adminSelectionChanged = computed(() => {
  return (
    selectedAdminUserId.value != null &&
    originalAdminUserId.value != null &&
    selectedAdminUserId.value !== originalAdminUserId.value
  )
})

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
    const response = await apiService.get('/projects/journals')
    const responseData = await response.json()
    journals.value = responseData
  } catch (error) {
    console.error('Error loading journals:', error)
  } finally {
    isLoadingJournals.value = false
  }
}

async function fetchCuratedMedia() {
  isLoadingCuratedMedia.value = true
  try {
    const response = await apiService.get(`/projects/${projectId}/media`)
    if (response.ok) {
      const data = await response.json()
      // Filter to only show curated media (status 0) with specimen, view, and copyright info
      curatedMedia.value = data.media.filter(m => 
        m.cataloguing_status === 0 && 
        m.specimen_id && 
        m.view_id &&
        m.is_copyrighted !== null &&
        m.media_type === 'image'
      )
    }
  } catch (error) {
    console.error('Error fetching curated media:', error)
  } finally {
    isLoadingCuratedMedia.value = false
  }
}

async function fetchMediaViews() {
  try {
    const response = await apiService.get(`/projects/${projectId}/media/views`)
    if (response.ok) {
      const data = await response.json()
      mediaViews.value = data.media_views || []
    }
  } catch (error) {
    console.error('Error fetching media views:', error)
  }
}

function getMediaDescription(media) {
  if (!media) return ''
  const parts = []
  // Use specimen_name from API if available, otherwise fall back to specimen ID
  if (media.specimen_name) {
    parts.push(` - ${stripHtmlTags(media.specimen_name)}`)
  } else if (media.specimen_id) {
    parts.push(` - Specimen #${media.specimen_id}`)
  }
  // Use view_name from API if available, otherwise look it up or use ID
  if (media.view_name) {
    parts.push(` - ${media.view_name}`)
  } else if (media.view_id) {
    const viewName = getViewName(media.view_id)
    if (viewName) parts.push(` - ${viewName}`)
  }
  return parts.join('')
}

function getViewName(viewId) {
  if (!viewId) return 'Unknown'
  const view = mediaViews.value.find(v => v.view_id === viewId)
  return view ? view.name : `View #${viewId}`
}

function getMediaThumbnailUrl(media) {
  if (!media || !media.media_id) return '/images/img_placeholder.jpg'
  return apiService.buildUrl(`/public/media/${projectId}/serve/${media.media_id}/thumbnail`)
}

// Helper function to extract content from JATS paragraph tags or strip all HTML/XML tags
function stripHtmlTags(text) {
  if (!text || typeof text !== 'string') return text
  
  // First, try to extract content from jats:p tags
  const jatsMatch = text.match(/<jats:p[^>]*>(.*?)<\/jats:p>/s)
  if (jatsMatch) {
    // Extract content from jats:p tags and strip any remaining tags
    const jatsContent = jatsMatch[1]
      .replace(/<[^>]*>/g, '') // Remove any nested HTML/XML tags
      .replace(/&lt;/g, '<')   // Decode common HTML entities
      .replace(/&gt;/g, '>')   
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim() // Remove leading/trailing whitespace
    
    return jatsContent
  }
  
  // If no jats:p tags found, strip all HTML/XML tags (fallback for plain text abstracts)
  const stripped = text
    .replace(/<[^>]*>/g, '') // Remove all HTML/XML tags
    .replace(/&lt;/g, '<')   // Decode common HTML entities
    .replace(/&gt;/g, '>')   
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim() // Remove leading/trailing whitespace
  
  return stripped
}

// Helper function to validate file types and show errors for unsupported formats
function validateImageFile(file, fileType = 'image') {
  if (!file) return true
  
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.split('.').pop()
  
  // Check for HEIC files specifically
  if (fileExtension === 'heic' || fileExtension === 'heif') {
    showError(
      `HEIC/HEIF files are not supported. Please convert your ${fileType} to JPEG, PNG, or another supported format.`,
      'Unsupported File Format'
    )
    return false
  }
  
  // Check for other unsupported formats
  const supportedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif']
  if (!supportedExtensions.includes(fileExtension)) {
    showError(
      `${fileExtension.toUpperCase()} files are not supported. Please use JPEG, PNG, GIF, BMP, WebP, or TIFF format.`,
      'Unsupported File Format'
    )
    return false
  }
  
  return true
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

// Load current uploaded journal cover
const loadCurrentJournalCover = async (journalCoverData) => {
  currentJournalCover.value = null
  currentJournalCoverUrl.value = null

  if (!journalCoverData) {
    return
  }

  try {
    // Check if it's the new migrated format
    if (journalCoverData.filename && journalCoverData.migrated) {
      currentJournalCover.value = journalCoverData
      const s3Key = `media_files/journal_covers/uploads/${journalCoverData.filename}`
      currentJournalCoverUrl.value = apiService.buildUrl(`/s3/${s3Key}`)
    }
    // Handle old format if needed (though it should be migrated by now)
    else if (journalCoverData.media_id) {
      currentJournalCover.value = journalCoverData
      // For old format, we might need to construct a different URL
      // This is a fallback for any unmigrated covers
      console.warn('Found old format journal cover, should be migrated:', journalCoverData)
    }
  } catch (err) {
    console.error('Error loading current journal cover:', err)
  }
}

// Load journal cover when journal is selected
const loadJournalCover = async (journalTitle) => {
  if (!journalTitle || showNewJournal.value) {
    journalCoverPath.value = null
    return
  }

  try {
    const response = await apiService.get('/projects/journal-cover', {
      params: { journalTitle }
    })
    const responseData = await response.json()

    // Check if we have a path and verify the image actually exists
    if (responseData.coverPath && responseData.coverPath.trim() !== '') {
      const coverPath = responseData.coverPath.trim()
      
      // Extract filename from the old path (could be full URL or relative path)
      // e.g., "https://morphobank.org/themes/default/graphics/journalIcons/cladistics.jpg" -> "cladistics.jpg"
      const filename = coverPath.split('/').pop()
      
      // Build the new S3 URL
      const s3Key = `media_files/journal_covers/${filename}`
      const newCoverPath = apiService.buildUrl(`/s3/${s3Key}`)
      
      // Test if the image actually loads
      const imageExists = await testImageExists(newCoverPath)
      
      if (imageExists) {
        journalCoverPath.value = newCoverPath
      } else {
        journalCoverPath.value = null
      }
    } else {
      journalCoverPath.value = null
    }
  } catch (err) {
    console.error('Error loading journal cover:', err)
    journalCoverPath.value = null
  }
}

// Helper function to test if an image URL actually loads
const testImageExists = (url) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
    
    // Set a timeout to avoid hanging
    setTimeout(() => resolve(false), 5000)
  })
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
    const response = await apiService.post('/projects/doi', {
      article_doi: formData.article_doi,
      newProject: false, // Since this is EditView, we're editing an existing project
    })
    const responseData = await response.json()

    if (responseData.status === 'ok') {
      const fields = responseData.fields

      // Handle each field from the response
      for (const [field, value] of Object.entries(fields)) {
        if (field === 'journal_title') {
          if (!value) continue
          
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
        } else if (field === 'abstract') {
          // Map abstract field to description, strip HTML/XML tags, and always set
          formData.description = stripHtmlTags(value) || ''
        } else {
          if (!value) continue
          // Set other fields directly
          formData[field] = value
        }
      }
    } else {
      showError(responseData.errors.join('\n'), 'DOI Retrieval Error')
    }
  } catch (error) {
    console.error('Error retrieving DOI:', error)
    showError('Failed to retrieve DOI information. Please try again.', 'DOI Retrieval Failed')
  }
}

function handleJournalCoverUpload(event) {
  const file = event.target.files[0]
  if (file) {
    // Validate file format
    if (!validateImageFile(file, 'journal cover')) {
      // Clear the file input
      event.target.value = ''
      return
    }
    formData.journal_cover = file
  }
}

function clearCurrentJournalCover() {
  currentJournalCover.value = null
  currentJournalCoverUrl.value = null
  // Also clear any uploaded file
  formData.journal_cover = null
}

// Watch for changes in journal cover availability and clear uploaded file if disabled
watch(isJournalCoverUploadDisabled, (newValue) => {
  if (newValue && formData.journal_cover) {
    // Clear the uploaded journal cover file when field becomes disabled (existing cover found)
    formData.journal_cover = null
  }
})

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
      if (key === 'journal_cover') {
        // Skip file upload - will be passed separately
        continue
      } else if (key === 'reviewer_login_password') {
        // Only send password if user has entered one (don't send empty string)
        if (value && value.trim() !== '') {
          projectData[key] = value.trim()
        }
        // If empty, skip sending it entirely to preserve existing password
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

    // Determine journal cover action:
    // - If user uploaded a new file, send it
    // - If user removed current cover (currentJournalCover was cleared), send removal signal
    // - Otherwise, don't send anything (keep existing)
    let journalCoverToSend = null
    let removeJournalCover = false
    
    if (formData.journal_cover) {
      // User uploaded a new journal cover
      journalCoverToSend = formData.journal_cover
    } else if (currentJournalCover.value === null && projectOverviewStore.overview?.journal_cover) {
      // User had a journal cover but removed it
      removeJournalCover = true
    }
    
    // Update project - journal covers processed immediately (cataloguing_status: 0)
    const success = await updateProject(
      projectData,
      journalCoverToSend,
      null, // No longer uploading exemplar media files
      removeJournalCover
    )

    if (!success) {
      throw new Error('Failed to update project')
    }

    // If admin selection changed, transfer project administrator
    if (adminSelectionChanged.value) {
      await transferProjectAdministrator()
    }

    // Show success state briefly before redirecting
    projectUpdated.value = true

    // Redirect to published project overview after delay with cache busting
    setTimeout(() => {
      // Use window.location.href for full page reload to avoid cached data
      window.location.href = `/project/${projectId}/overview?t=${Date.now()}`
    }, 800)
  } catch (err) {
    console.error('Error in handleSubmit:', err)
    error.value =
      err.response?.data?.message ||
      'An error occurred while updating the project'
  } finally {
    isLoading.value = false
  }
}

async function transferProjectAdministrator() {
  try {
    const response = await apiService.put(
      apiService.buildUrl(`/projects/${projectId}/update`),
      { user_id: selectedAdminUserId.value }
    )
    if (response.status === 200) {
      // Refresh caches so overview reflects new owner immediately
      try { await projectsStore.fetchProjects(true) } catch {}
      try { projectOverviewStore.invalidate() } catch {}
      try { projectUsersStore.invalidate() } catch {}
      return true
    }
    return false
  } catch (error) {
    console.error('Error transferring project administrator:', error)
    showError(
      "Failed to transfer project administrator. No changes were made to the project's ownership.",
      'Administrator Transfer Failed'
    )
    throw error
  }
}

async function updateProject(
  projectData,
  journalCoverFile = null,
  exemplarMediaFile = null,
  removeJournalCover = false
) {
  try {
    let requestData
    let headers = {}

    if (journalCoverFile || exemplarMediaFile) {
      // Use FormData for file upload
      const formData = new FormData()

      // Add all project data as JSON string
      const dataToSend = { ...projectData, removeJournalCover }
      formData.append('projectData', JSON.stringify(dataToSend))

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
      requestData = { ...projectData, removeJournalCover }
      headers = {
        'Content-Type': 'application/json',
      }
    }

    const response = await apiService.post(
      apiService.buildUrl(`/projects/${projectId}/edit`),
      requestData,
      { headers }
    )

    // Refresh the projects cache and invalidate project overview cache
    if (response.status === 200) {
      await projectsStore.fetchProjects(true) // Force refresh
      projectOverviewStore.invalidate() // Invalidate cached overview data
      
      // Also trigger a fresh fetch if the overview was for this project
      if (projectOverviewStore.currentProjectId === projectId) {
        await projectOverviewStore.fetchProject(projectId)
      }
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
    showWarning('Please fill in all required fields', 'Validation Error')
    return false
  }

  // Reviewer password validation - only require password if:
  // 1. User is enabling reviewer login for the first time (wasn't enabled before), OR
  // 2. User is enabling reviewer login and there's no existing password in the database
  if (formData.allow_reviewer_login) {
    const isEnablingForFirstTime = !originalAllowReviewerLogin.value
    const hasEnteredNewPassword = formData.reviewer_login_password && formData.reviewer_login_password.trim() !== ''
    
    // If enabling for the first time, require a password
    if (isEnablingForFirstTime && !hasEnteredNewPassword) {
      showWarning(
        'Please enter a reviewer login password when enabling reviewer access',
        'Reviewer Password Required'
      )
      return false
    }
  }

  // Journal validation based on publication status
  if (
    formData.publication_status === '0' ||
    formData.publication_status === '1'
  ) {
    if (formData.journal_title === '' && formData.journal_title_other === '') {
      showWarning('Please enter journal title information', 'Journal Title Required')
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
        showWarning(`Please fill in ${field.replace(/_/g, ' ')}`, 'Required Field Missing')
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
          showWarning(`Please fill in ${field.replace(/_/g, ' ')}`, 'Required Field Missing')
          return false
        }
      }
    }
  }

  // Author format validation
  if (formData.article_authors && formData.article_authors.includes(' and ')) {
    showWarning('Article authors must be separated by commas, not "and"', 'Author Format Error')
    return false
  }

  // DOI format validation
  if (formData.article_doi && !formData.article_doi.match(/^10\..*\/\S+$/)) {
    showWarning(
      'Invalid DOI format. Please enter the DOI as provided by the publisher.',
      'DOI Format Error'
    )
    return false
  }

  return true
}

function cancel() {
  router.push(`/project/${projectId}/overview`)
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

function showDeleteConfirmation() {
  showDeleteDialog.value = true
}

function hideDeleteConfirmation() {
  if (!isDeleting.value) {
    showDeleteDialog.value = false
  }
}

async function deleteProject() {
  isDeleting.value = true
  error.value = null

  try {
    const response = await apiService.delete(
      apiService.buildUrl(`/projects/${projectId}`)
    )

    if (response.status === 200) {
      // Show success message briefly before redirecting
      showDeleteDialog.value = false
      
      // Navigate to projects list after deletion
      window.location.href = '/projects'
    } else {
      throw new Error('Failed to delete project')
    }
  } catch (err) {
    console.error('Error deleting project:', err)
    error.value = 
      err.response?.data?.message || 
      'An error occurred while deleting the project'
  } finally {
    isDeleting.value = false
  }
}

const projectUpdated = ref(false)

function getLoadingText() {
  if (projectUpdated.value) {
    return 'Project updated successfully!'
  }

  // Journal covers processed immediately, exemplar media goes to curation
  const hasJournalCover = !isJournalCoverUploadDisabled.value && formData.journal_cover
  const hasExemplarMedia = formData.exemplar_media

  if (hasJournalCover && hasExemplarMedia) {
    return 'Processing images and updating project...'
  } else if (hasJournalCover) {
    return 'Processing journal cover and updating project...'
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

.current-journal-cover-container {
  margin: 15px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.current-journal-cover-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.current-journal-cover {
  max-width: 150px;
  max-height: 100px;
  object-fit: contain;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
}

.current-journal-cover-info {
  flex: 1;
}

.current-journal-cover-filename {
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.remove-cover-btn {
  color: #dc3545;
  font-size: 0.9em;
}

.remove-cover-btn:hover {
  color: #c82333;
  text-decoration: underline;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.15em;
}

/* Delete Confirmation Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-dialog {
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #dee2e6;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.modal-body {
  padding: 20px 24px;
}

.modal-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #dee2e6;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.alert {
  padding: 12px 16px;
  margin: 16px 0;
  border: 1px solid transparent;
  border-radius: 4px;
}

.alert-warning {
  color: #856404;
  background-color: #fff3cd;
  border-color: #ffeaa7;
}

.text-warning {
  color: #f39c12 !important;
}

.form-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
}

.btn-outline-danger {
  color: #dc3545;
  border-color: #dc3545;
  background-color: transparent;
}

.btn-outline-danger:hover {
  color: white;
  background-color: #dc3545;
  border-color: #dc3545;
}

.btn-outline-danger:disabled {
  color: #dc3545;
  background-color: transparent;
  opacity: 0.65;
}

.btn-danger {
  color: white;
  background-color: #dc3545;
  border-color: #dc3545;
}

.btn-danger:hover {
  background-color: #c82333;
  border-color: #bd2130;
}

.btn-danger:disabled {
  background-color: #dc3545;
  border-color: #dc3545;
  opacity: 0.65;
}

.cache-warning-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 16px;
  background-color: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #004085;
  position: relative;
}

.cache-warning-banner i.fa-info-circle {
  color: #0066cc;
  flex-shrink: 0;
}

.cache-warning-banner span {
  flex: 1;
  line-height: 1.4;
}

.cache-warning-close {
  background: none;
  border: none;
  color: #004085;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.cache-warning-close:hover {
  opacity: 1;
}
</style>

