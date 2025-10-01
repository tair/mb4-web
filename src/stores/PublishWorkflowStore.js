import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const usePublishWorkflowStore = defineStore('publishWorkflow', {
  state: () => ({
    // Current step in the workflow
    currentStep: 'validation', // validation, preferences, final

    // Validation states
    validations: {
      citations: {
        isValid: false,
        errors: [],
        warnings: [],
      },
      media: {
        isValid: false,
        hasMedia: false,
        incompleteMedia: [],
        errors: [],
        warnings: [],
      },
    },

    // Publishing preferences
    preferences: {
      fundingAcknowledgment: '',
      nsfFunded: null,
      hasExtinctTaxa: false,
      extinctTaxaIdentified: null,
      noPersonalInfo: false,
      dataPrivacyLevel: 'public',
      copyrightPreference: 'cc-by',
      allowCommercialUse: false,
      allowDerivatives: true,
      requireAttribution: true,
      publishMatrixMediaOnly: false,
      // General publishing preferences
      publishCharacterComments: true,
      publishCellComments: true,
      publishChangeLogs: true,
      publishCellNotes: true,
      publishCharacterNotes: true,
      publishMediaNotes: true,
      publishInactiveMembers: true,
    },

    // Items explicitly set to never publish
    unpublishedItems: {
      documents: [],
      folios: [],
      matrices: [],
      media: [],
    },

    // Final publishing data
    finalData: {
      publishingNotes: '',
      agreedToTerms: false,
      confirmDataAccuracy: false,
    },

    // Publication result
    publicationResult: {
      success: false,
      projectId: null,
      publishedOn: null,
      message: '',
    },

    // Loading states
    isLoading: false,
    isValidating: false,
    isPublishing: false,
  }),

  getters: {
    // Check if both citations and media validation are complete
    canProceedToPreferences: (state) => {
      return (
        state.validations.citations.isValid && state.validations.media.isValid
      )
    },

    canProceedToFinal: (state) => {
      // Allow progression if validations are complete and preferences are filled out
      return (
        state.validations.citations.isValid &&
        state.validations.media.isValid &&
        state.preferences.extinctTaxaIdentified !== null &&
        state.preferences.noPersonalInfo === true
      )
    },

    canPublish: (state) => {
      // Allow publishing if all validations, preferences and final data are complete
      return (
        state.validations.citations.isValid &&
        state.validations.media.isValid &&
        state.preferences.nsfFunded !== null &&
        state.preferences.extinctTaxaIdentified !== null &&
        state.preferences.noPersonalInfo === true &&
        state.finalData.agreedToTerms &&
        state.finalData.confirmDataAccuracy
      )
    },

    // Get validation status for UI display
    getValidationStatus: (state) => {
      return {
        citations: {
          isValid: state.validations.citations.isValid,
          hasErrors: state.validations.citations.errors.length > 0,
          errors: state.validations.citations.errors,
          warnings: state.validations.citations.warnings,
        },
        media: {
          isValid: state.validations.media.isValid,
          hasErrors: state.validations.media.errors.length > 0,
          hasWarnings: state.validations.media.warnings.length > 0,
          errors: state.validations.media.errors,
          warnings: state.validations.media.warnings,
          hasMedia: state.validations.media.hasMedia,
          incompleteMedia: state.validations.media.incompleteMedia,
        },
      }
    },
  },

  actions: {
    // Reset workflow state
    resetWorkflow() {
      this.currentStep = 'validation'
      this.validations.citations = { isValid: false, errors: [], warnings: [] }
      this.validations.media = {
        isValid: false,
        hasMedia: false,
        incompleteMedia: [],
        errors: [],
        warnings: [],
      }
      this.preferences = {
        fundingAcknowledgment: '',
        nsfFunded: null,
        hasExtinctTaxa: false,
        extinctTaxaIdentified: null,
        noPersonalInfo: false,
        dataPrivacyLevel: 'public',
        copyrightPreference: 'cc-by',
        allowCommercialUse: false,
        allowDerivatives: true,
        requireAttribution: true,
        publishMatrixMediaOnly: false,
        // General publishing preferences
        publishCharacterComments: true,
        publishCellComments: true,
        publishChangeLogs: true,
        publishCellNotes: true,
        publishCharacterNotes: true,
        publishMediaNotes: true,
        publishInactiveMembers: true,
      }
      this.unpublishedItems = {
        documents: [],
        folios: [],
        matrices: [],
        media: [],
      }
      this.finalData = {
        publishingNotes: '',
        agreedToTerms: false,
        confirmDataAccuracy: false,
      }
      this.publicationResult = {
        success: false,
        projectId: null,
        publishedOn: null,
        message: '',
      }
    },

    // Validate citations using backend API
    async validateCitations(projectId) {
      this.isValidating = true

      try {
        // Call backend API to check publishing status
        const response = await apiService.get(
          `/projects/${projectId}/publishing/validate/citation`
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(
            'Response is not JSON - likely API endpoint not found'
          )
        }

        const data = await response.json()

        this.validations.citations = {
          isValid: data.citation_complete || false,
          errors: data.citation_complete
            ? []
            : [data.citation_message || 'Citation information is incomplete'],
          warnings: [],
        }
      } catch (error) {
        console.error('Citation validation error:', error)
        this.validations.citations = {
          isValid: false,
          errors: [
            'Citation validation service unavailable - please try again',
          ],
          warnings: [],
        }
      } finally {
        this.isValidating = false
      }

      return this.validations.citations
    },

    // Validate media using backend API
    async validateMedia(projectId) {
      this.isValidating = true

      try {
        // Call backend API to get publish form data (includes media validation)
        const response = await apiService.get(
          `/projects/${projectId}/publishing/validate/media`
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Process media validation results
        const canPublish = data.canPublish !== false // Default to true if not specified

        if (data.warning === 'no_media') {
          // Block publishing: explicit error copy per requirements
          this.validations.media = {
            isValid: false,
            hasMedia: false,
            incompleteMedia: [],
            errors: ['At least 1 media file is required to publish a project.'],
            warnings: [],
          }
        } else if (data.warning === 'no_exemplar_media') {
          // Exemplar media is required
          this.validations.media = {
            isValid: false,
            hasMedia: Boolean(data.has_media ?? true),
            incompleteMedia: [],
            errors: [
              'An exemplar media file must be selected for the project.',
            ],
            warnings: [],
          }
        } else if (data.warning === 'invalid_exemplar_media') {
          // Selected exemplar is invalid or missing
          this.validations.media = {
            isValid: false,
            hasMedia: Boolean(data.has_media ?? true),
            incompleteMedia: [],
            errors: [
              'The selected exemplar media file is invalid or does not exist.',
            ],
            warnings: [],
          }
        } else if (data.warning === 'media_warnings') {
          // Prefer new API fields: unfinishedMedia and message
          const unfinished = Array.isArray(data.unfinishedMedia)
            ? data.unfinishedMedia
            : Array.isArray(data.incomplete_media)
            ? data.incomplete_media
            : []
          const detailedMessage =
            data.message || 'Some media files have incomplete information'

          this.validations.media = {
            isValid: canPublish,
            hasMedia: true,
            incompleteMedia: unfinished,
            errors: canPublish ? [] : [detailedMessage],
            warnings: [],
          }
        } else {
          this.validations.media = {
            isValid: canPublish,
            hasMedia: true,
            incompleteMedia: [],
            errors: canPublish ? [] : ['Media validation failed'],
            warnings: [],
          }
        }
      } catch (error) {
        console.error('Media validation error:', error)
        // Fallback for when API is unavailable - block progression
        this.validations.media = {
          isValid: false,
          hasMedia: false,
          incompleteMedia: [],
          errors: ['Media validation service unavailable - please try again'],
          warnings: [],
        }
      } finally {
        this.isValidating = false
      }

      return this.validations.media
    },

    // Load existing preferences from backend
    async loadPreferences(projectId) {
      try {
        const response = await apiService.get(
          `/projects/${projectId}/publishing/preferences`
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.redirect) {
          // Backend indicates we should redirect (e.g., incomplete citation)
          return { redirect: true, message: data.message }
        }

        // Load existing preferences from backend
        const fields = data.publishingFields || {}
        this.preferences = {
          ...this.preferences,
          nsfFunded:
            fields.nsf_funded !== undefined ? Boolean(fields.nsf_funded) : null,
          extinctTaxaIdentified:
            fields.extinct_taxa_identified !== undefined
              ? Boolean(fields.extinct_taxa_identified)
              : null,
          noPersonalInfo: Boolean(fields.no_personal_identifiable_info),
          allowCommercialUse: Boolean(fields.publish_cc0),
          allowDerivatives: Boolean(fields.include_downloadable_files),
          publishMatrixMediaOnly: Boolean(fields.publish_matrix_media_only),
          // General publishing preferences
          publishCharacterComments: Boolean(
            fields.publish_character_comments ?? true
          ),
          publishCellComments: Boolean(fields.publish_cell_comments ?? true),
          publishChangeLogs: Boolean(fields.publish_change_logs ?? true),
          publishCellNotes: Boolean(fields.publish_cell_notes ?? true),
          publishCharacterNotes: Boolean(
            fields.publish_character_notes ?? true
          ),
          publishMediaNotes: Boolean(fields.publish_media_notes ?? true),
          publishInactiveMembers: Boolean(
            fields.publish_inactive_members ?? true
          ),
        }

        // Load unpublished items if provided
        if (
          Array.isArray(data.unpublishedDocuments) ||
          Array.isArray(data.unpublishedFolios) ||
          Array.isArray(data.unpublishedMatrices) ||
          Array.isArray(data.unpublishedMedia)
        ) {
          this.unpublishedItems = {
            documents: data.unpublishedDocuments || [],
            folios: data.unpublishedFolios || [],
            matrices: data.unpublishedMatrices || [],
            media: data.unpublishedMedia || [],
          }
        }

        return { redirect: false }
      } catch (error) {
        console.error('Load preferences error:', error)
        return { redirect: false }
      }
    },

    // Load unpublished items from backend (fallback endpoint if not included in preferences)
    async loadUnpublishedItems(projectId) {
      try {
        const response = await apiService.get(
          `/projects/${projectId}/publishing/unpublished-items`
        )
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const data = await response.json()
        this.unpublishedItems = {
          documents: data.documents || [],
          folios: data.folios || [],
          matrices: data.matrices || [],
          media: data.media || [],
        }
      } catch (error) {
        console.error('Load unpublished items error:', error)
        // keep existing values
      }
      return this.unpublishedItems
    },

    // Save publishing preferences to backend
    async savePreferences(projectId, preferences) {
      this.isLoading = true

      try {
        // Map Vue preferences to backend format
        const backendData = {
          publish_cc0: preferences.allowCommercialUse ? 1 : 0,
          extinct_taxa_identified:
            preferences.extinctTaxaIdentified !== null
              ? preferences.extinctTaxaIdentified
                ? 1
                : 0
              : 0,
          publish_character_comments: preferences.publishCharacterComments
            ? 1
            : 0,
          publish_cell_comments: preferences.publishCellComments ? 1 : 0,
          publish_change_logs: preferences.publishChangeLogs ? 1 : 0,
          publish_cell_notes: preferences.publishCellNotes ? 1 : 0,
          publish_character_notes: preferences.publishCharacterNotes ? 1 : 0,
          publish_media_notes: preferences.publishMediaNotes ? 1 : 0,
          publish_matrix_media_only: preferences.publishMatrixMediaOnly ? 1 : 0,
          publish_inactive_members: preferences.publishInactiveMembers ? 1 : 0,
          no_personal_identifiable_info: preferences.noPersonalInfo ? 1 : 0,
        }

        const response = await apiService.post(
          `/projects/${projectId}/publishing/preferences`,
          backendData
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Update local state
        this.preferences = { ...this.preferences, ...preferences }

        return {
          success: true,
          message: data.message || 'Publishing preferences saved successfully',
        }
      } catch (error) {
        console.error('Save preferences error:', error)

        // Check if this is a real API server error vs network/unavailable service
        if (error.message.includes('500') || error.message.includes('400')) {
          // Real API error - don't use fallback, show the error
          return { success: false, message: error.message }
        }

        // Network error or service unavailable
        return {
          success: false,
          message: 'Network error - please check your connection and try again',
        }
      } finally {
        this.isLoading = false
      }
    },

    // Publish project using backend API
    async publishProject(projectId, finalData = null) {
      this.isPublishing = true

      try {
        if (finalData) {
          this.finalData = { ...this.finalData, ...finalData }
        }
        const response = await apiService.post(
          `/projects/${projectId}/publishing/publish`
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        this.publicationResult = {
          success: true,
          projectId: data.projectId,
          publishedOn: data.publishedOn,
          message: data.message,
        }

        this.currentStep = 'confirmation'
      } catch (error) {
        console.error('Publishing error:', error)

        // Set error result
        this.publicationResult = {
          success: false,
          message: error.message || 'Publishing failed',
        }
      } finally {
        this.isPublishing = false
      }

      return this.publicationResult
    },

    // Get authentication token
    getAuthToken() {
      // This would typically come from your auth store
      return localStorage.getItem('authToken') || ''
    },

    // Navigation helpers
    setCurrentStep(step) {
      this.currentStep = step
    },

    proceedToNextStep() {
      const steps = ['validation', 'preferences', 'final']
      const currentIndex = steps.indexOf(this.currentStep)
      if (currentIndex < steps.length - 1) {
        this.currentStep = steps[currentIndex + 1]
      }
    },
  },
})
