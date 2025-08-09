import { defineStore } from 'pinia'

export const usePublishWorkflowStore = defineStore('publishWorkflow', {
  state: () => ({
    // Current step in the workflow
    currentStep: 'prerequisite', // prerequisite, media-validation, preferences, final, confirmation

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
      publicUrl: '',
      doi: '',
      message: '',
    },

    // Loading states
    isLoading: false,
    isValidating: false,
    isPublishing: false,
  }),

  getters: {
    canProceedToMediaValidation: (state) => {
      return state.validations.citations.isValid
    },

    canProceedToPreferences: (state) => {
      // Allow proceeding if citations are valid, regardless of media status
      // User can publish without media or with incomplete media (with warnings)
      return state.validations.citations.isValid
    },

    canProceedToFinal: (state) => {
      return (
        state.validations.citations.isValid &&
        state.preferences.nsfFunded !== null &&
        state.preferences.extinctTaxaIdentified !== null &&
        state.preferences.noPersonalInfo === true
      )
    },

    canPublish: (state) => {
      return (
        state.validations.citations.isValid &&
        state.preferences.nsfFunded !== null &&
        state.preferences.extinctTaxaIdentified !== null &&
        state.preferences.noPersonalInfo === true &&
        state.finalData.agreedToTerms &&
        state.finalData.confirmDataAccuracy
      )
    },
  },

  actions: {
    // Reset workflow state
    resetWorkflow() {
      this.currentStep = 'prerequisite'
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
      }
      this.finalData = {
        publishingNotes: '',
        agreedToTerms: false,
        confirmDataAccuracy: false,
      }
      this.publicationResult = {
        success: false,
        projectId: null,
        publicUrl: '',
        doi: '',
        message: '',
      }
    },

    // Simulate citation validation
    async validateCitations(projectId) {
      this.isValidating = true

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock validation results - make it easier to test by increasing success rate
      const mockHasValidCitations = Math.random() > 0.1 // 90% chance of having valid citations

      this.validations.citations = {
        isValid: mockHasValidCitations,
        errors: mockHasValidCitations
          ? []
          : [
              'Project title is required for publication',
              'At least one author must be specified',
              'Publication year is missing',
            ],
        warnings: [
          'Consider adding more detailed project description',
          'Institutional affiliation is recommended',
        ],
      }

      this.isValidating = false
      return this.validations.citations
    },

    // Simulate media validation
    async validateMedia(projectId) {
      this.isValidating = true

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock validation results - make it easier to test
      const mockHasMedia = Math.random() > 0.1 // 90% chance of having media
      const mockHasIncompleteMedia = Math.random() > 0.7 // 30% chance of incomplete media

      this.validations.media = {
        isValid: mockHasMedia && !mockHasIncompleteMedia,
        hasMedia: mockHasMedia,
        incompleteMedia: mockHasIncompleteMedia
          ? [
              {
                id: 1,
                name: 'specimen_001.jpg',
                issues: ['Missing copyright information', 'No description'],
              },
              {
                id: 2,
                name: 'fossil_side_view.png',
                issues: ['Missing attribution'],
              },
            ]
          : [],
        errors: !mockHasMedia ? ['No media files found in project'] : [],
        warnings: mockHasIncompleteMedia
          ? ['Some media files have incomplete information']
          : [],
      }

      this.isValidating = false
      return this.validations.media
    },

    // Save publishing preferences
    async savePreferences(preferences) {
      this.isLoading = true

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      this.preferences = { ...this.preferences, ...preferences }
      this.isLoading = false
    },

    // Simulate final publication
    async publishProject(projectId, finalData) {
      this.isPublishing = true

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      this.finalData = { ...this.finalData, ...finalData }

      // Mock publication result
      const success = Math.random() > 0.1 // 90% success rate

      this.publicationResult = {
        success,
        projectId: success ? `P${Math.floor(Math.random() * 10000)}` : null,
        publicUrl: success
          ? `https://morphobank.org/project/${Math.floor(
              Math.random() * 10000
            )}`
          : '',
        doi: success
          ? `10.7934/${Math.random().toString(36).substr(2, 9)}`
          : '',
        message: success
          ? 'Project published successfully!'
          : 'Failed to publish project. Please try again.',
      }

      if (success) {
        this.currentStep = 'confirmation'
      }

      this.isPublishing = false
      return this.publicationResult
    },

    // Navigation helpers
    setCurrentStep(step) {
      this.currentStep = step
    },

    proceedToNextStep() {
      const steps = [
        'prerequisite',
        'media-validation',
        'preferences',
        'final',
        'confirmation',
      ]
      const currentIndex = steps.indexOf(this.currentStep)
      if (currentIndex < steps.length - 1) {
        this.currentStep = steps[currentIndex + 1]
      }
    },
  },
})
