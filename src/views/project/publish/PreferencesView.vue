<script setup>
import { onMounted, ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublishWorkflowStore } from '@/stores/PublishWorkflowStore.js'
import { useNotifications } from '@/composables/useNotifications'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const router = useRouter()
const publishStore = usePublishWorkflowStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()
const projectId = route.params.id

const isLoaded = ref(false)
const isSaving = ref(false)
const formValid = ref(false)

const preferences = reactive({
  fundingAcknowledgment: '',
  nsfFunded: null, // null, true, false
  hasExtinctTaxa: null, // null, true, false
  extinctTaxaIdentified: null, // null, true, false
  noPersonalInfo: false,
  dataPrivacyLevel: 'public',
  copyrightPreference: 'cc-by',
  allowCommercialUse: false, // CC0 preference
  allowDerivatives: true, // Include downloadable files
  requireAttribution: true,
  // General publishing preferences
  publishCharacterComments: true,
  publishCellComments: true,
  publishChangeLogs: true,
  publishCellNotes: true,
  publishCharacterNotes: true,
  publishMediaNotes: true,
  publishMatrixMediaOnly: false,
  publishInactiveMembers: true,
})

// No unpublished items UI in this view; handled in FinalView

onMounted(async () => {
  // Check if we can access this step
  if (!publishStore.canProceedToPreferences) {
    router.push(`/myprojects/${projectId}/publish`)
    return
  }

  publishStore.setCurrentStep('preferences')

  // Try to load existing preferences from backend
  try {
    const result = await publishStore.loadPreferences(projectId)
    if (result.redirect) {
      // Backend says we should redirect (e.g., incomplete citation)
      router.push(`/myprojects/${projectId}/publish`)
      return
    }
  } catch (error) {
    console.error('Error loading preferences:', error)
    // Continue with demo mode
  }

  // Load existing preferences from store
  Object.assign(preferences, publishStore.preferences)

  // If user previously confirmed no personal info, skip to final step
  // Unless they came from final view to update preferences
  const fromFinal = route.query.from === 'final'
  if (preferences.noPersonalInfo === true && !fromFinal) {
    router.push(`/myprojects/${projectId}/publish/final`)
    return
  }

  // Simulate loading delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  isLoaded.value = true

  validateForm()

  // Unpublished items are handled and loaded in FinalView
})

// Removed unpublished items logic from this view

function validateForm() {
  formValid.value = true
}

async function savePreferences() {
  // Validation matching the original PHP form (updated)
  if (preferences.extinctTaxaIdentified === null) {
    showWarning('Please indicate if you have marked all extinct taxa.', 'Extinct Taxa Status Required')
    return false
  }

  if (!preferences.noPersonalInfo) {
    showWarning(
      'Please indicate that your data upload has no identifiable personal information.',
      'Personal Information Confirmation Required'
    )
    return false
  }

  try {
    isSaving.value = true
    // console.log(preferences)
    const result = await publishStore.savePreferences(projectId, preferences)
    // console.log(result)
    if (result.success) {
      // Proceed to final step
      router.push(`/myprojects/${projectId}/publish/final`)
    } else {
      showError('Error saving preferences: ' + result.message, 'Save Failed')
    }
  } catch (error) {
    console.error('Error saving preferences:', error)
    showError('An error occurred while saving preferences. Please try again.', 'Save Error')
  } finally {
    isSaving.value = false
  }

  return true
}

// Removed item editing helpers; not used in this view

function updateCopyrightPreference(preference) {
  preferences.copyrightPreference = preference

  // Update other fields based on CC license choice
  switch (preference) {
    case 'cc-by':
      preferences.allowCommercialUse = true
      preferences.allowDerivatives = true
      preferences.requireAttribution = true
      break
    case 'cc-by-sa':
      preferences.allowCommercialUse = true
      preferences.allowDerivatives = true
      preferences.requireAttribution = true
      break
    case 'cc-by-nc':
      preferences.allowCommercialUse = false
      preferences.allowDerivatives = true
      preferences.requireAttribution = true
      break
    case 'cc-by-nc-sa':
      preferences.allowCommercialUse = false
      preferences.allowDerivatives = true
      preferences.requireAttribution = true
      break
    case 'cc-by-nd':
      preferences.allowCommercialUse = true
      preferences.allowDerivatives = false
      preferences.requireAttribution = true
      break
    case 'cc-by-nc-nd':
      preferences.allowCommercialUse = false
      preferences.allowDerivatives = false
      preferences.requireAttribution = true
      break
    case 'all-rights-reserved':
      preferences.allowCommercialUse = false
      preferences.allowDerivatives = false
      preferences.requireAttribution = true
      break
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div id="formArea" class="publish-preferences">
      <!-- Intro/validation status removed per requirements -->

      <form @submit.prevent="savePreferences" id="publishingForm">
        <p style="font-size: 14px; line-height: 1.3em"><b>Extinct taxa:</b></p>
        <div class="formLabel">
          <div id="extinctTaxa">
            <span class="formErrors">*</span> Have you indicated if any project
            taxa are extinct?
          </div>
          <span style="font-weight: normal">
            <input
              type="radio"
              name="extinct_taxa_identified"
              value="0"
              :checked="preferences.extinctTaxaIdentified === false"
              @change="preferences.extinctTaxaIdentified = false"
            />
            This project has no extinct taxa
            <br />
            <input
              type="radio"
              name="extinct_taxa_identified"
              value="1"
              :checked="preferences.extinctTaxaIdentified === true"
              @change="preferences.extinctTaxaIdentified = true"
            />
            Extinct taxa have been indicated
          </span>
          <br />
          <a
            href="#"
            @click="router.push(`/myprojects/${projectId}/taxa`)"
            class="text-primary"
            >Do this now &raquo;</a
          >
        </div>

        <br />
        <p style="font-size: 14px; line-height: 1.3em">
          <b>Data and privacy:</b>
        </p>
        <div class="formLabel">
          <span class="formErrors">*</span>
          <span style="font-weight: normal">
            <input
              type="checkbox"
              name="no_personal_identifiable_info"
              value="1"
              v-model="preferences.noPersonalInfo"
            />
          </span>
          I verify that the data uploaded to MorphoBank and associated with this
          project does not contain personally identifiable information.<br />
        </div>

        <br />
        <p style="font-size: 14px; line-height: 1.3em">
          <b>Non-media data copyright preference:</b><br />
          <span style="font-size: 12px"
            >The purpose of storing data on MorphoBank is to share those data
            with the scientific community and the public so that they may be
            reused for the advancement of research and education. Some
            researchers prefer to go a step further and place a
            <a href="http://creativecommons.org/about/cc0" target="_blank"
              ><b>CC0</b></a
            >
            tag on their data.</span
          >
        </p>
        <div class="formLabel">
          <input type="checkbox" v-model="preferences.allowCommercialUse" />
          &nbsp;Publish project matrix, documents, character list and ontologies
          with CC0 copyright license
          <i>NOTE: media copyright is handled separately</i>
        </div>

        <br />
        <p style="font-size: 14px; line-height: 1.3em">
          <b>General publishing preferences:</b>
        </p>
        <div class="formLabel">
          <input type="checkbox" v-model="preferences.allowDerivatives" />
          &nbsp;Include downloadable data files
        </div>
        <div class="formLabel">
          <input
            type="checkbox"
            v-model="preferences.publishCharacterComments"
          />
          &nbsp;Publish character comments
        </div>
        <div class="formLabel">
          <input type="checkbox" v-model="preferences.publishCellComments" />
          &nbsp;Publish cell comments
        </div>
        <div class="formLabel">
          <input type="checkbox" v-model="preferences.publishChangeLogs" />
          &nbsp;Publish change logs
        </div>
        <div class="formLabel">
          <input type="checkbox" v-model="preferences.publishCellNotes" />
          &nbsp;Publish cell notes
        </div>
        <div class="formLabel">
          <input type="checkbox" v-model="preferences.publishCharacterNotes" />
          &nbsp;Publish character notes
        </div>
        <div class="formLabel">
          <input type="checkbox" v-model="preferences.publishMediaNotes" />
          &nbsp;Publish media notes
        </div>
        <div class="formLabel">
          <input type="checkbox" v-model="preferences.publishMatrixMediaOnly" />
          &nbsp;Only publish media used in matrices
        </div>
        <div class="formLabel">
          <input type="checkbox" v-model="preferences.publishInactiveMembers" />
          &nbsp;Publish inactive project members
        </div>

        <br />
        <div class="formButtons">
          <a href="#" @click.prevent="savePreferences" class="button"
            >&raquo; Save Publishing Preferences</a
          >
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <button
            type="button"
            @click="
              router.push(`/myprojects/${projectId}/publish/media-validation`)
            "
            class="button"
          >
            &raquo; Cancel
          </button>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
#formArea {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.formError {
  color: #d32f2f;
  font-weight: bold;
  background-color: #ffebee;
  padding: 10px;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  margin-bottom: 15px;
}

.formErrors {
  color: var(--theme-orange);
  font-weight: bold;
}

.formLabel {
  margin-bottom: 20px;
  font-weight: normal;
}

.form-control {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 5px;
}

.formButtons {
  margin-top: 30px;
  text-align: center;
}

.button {
  background-color: var(--mb-orange);
  color: white;
  padding: 10px 15px;
  text-decoration: none;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

.button:hover {
  background-color: var(--mb-orange-hover);
  color: white;
  text-decoration: none;
}

.text-primary {
  color: #007bff;
  text-decoration: none;
}

.text-primary:hover {
  text-decoration: underline;
}

hr {
  margin: 20px 0;
}

.media-warning-box {
  margin: 10px 0px 10px 0px;
  padding: 10px;
  border: 2px solid #ededed;
}

.unpublished-items-section {
  margin-top: 20px;
}

.info-box {
  margin: 10px 0px 10px 0px;
  padding: 10px;
  border: 2px solid #ededed;
}

#extinctTaxa {
  margin-bottom: 5px;
}

/* Validation Status Styles */
.validation-status-section {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.validation-status-section h3 {
  color: #333;
  margin: 0 0 15px 0;
  font-size: 18px;
}

.validation-checks {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.validation-check {
  display: flex;
  align-items: center;
  gap: 10px;
}

.validation-icon {
  font-size: 16px;
}

.validation-icon.success {
  color: #28a745;
}

.validation-text {
  font-weight: 500;
  color: #333;
}

.validation-note {
  margin: 15px 0 0 0;
  color: #6c757d;
}
</style>
