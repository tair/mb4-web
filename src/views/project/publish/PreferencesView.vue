<script setup>
import { onMounted, ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublishWorkflowStore } from '@/stores/PublishWorkflowStore.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const router = useRouter()
const publishStore = usePublishWorkflowStore()
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
})

// Mock data for unpublished items
const unpublishedItems = reactive({
  media: [
    { id: 123, type: 'media' },
    { id: 456, type: 'media' },
  ],
  documents: [{ id: 1, title: 'Research Notes Document', type: 'document' }],
  matrices: [],
  folios: [],
})

onMounted(async () => {
  // Check if we can access this step
  if (!publishStore.canProceedToPreferences) {
    router.push(`/myprojects/${projectId}/publish`)
    return
  }

  publishStore.setCurrentStep('preferences')

  // Load existing preferences if any
  Object.assign(preferences, publishStore.preferences)

  // Simulate loading delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  isLoaded.value = true

  validateForm()
})

const hasUnpublishedItems = computed(() => {
  return (
    unpublishedItems.documents.length > 0 ||
    unpublishedItems.folios.length > 0 ||
    unpublishedItems.matrices.length > 0 ||
    unpublishedItems.media.length > 0
  )
})

function validateForm() {
  formValid.value = preferences.nsfFunded !== null
}

async function savePreferences() {
  // Validation matching the original PHP form
  if (preferences.nsfFunded === null) {
    alert('Please indicate if your project received NSF funding.')
    return false
  }

  if (preferences.extinctTaxaIdentified === null) {
    alert('Please indicate if you have marked all extinct taxa.')
    return false
  }

  if (!preferences.noPersonalInfo) {
    alert(
      'Please indicate that your data upload has no identifiable personal information.'
    )
    return false
  }

  isSaving.value = true
  await publishStore.savePreferences(preferences)
  isSaving.value = false

  // Proceed to final step
  router.push(`/myprojects/${projectId}/publish/final`)
  return true
}

function editItem(id, type) {
  const routes = {
    media: `/myprojects/${projectId}/media/${id}`,
    document: `/myprojects/${projectId}/documents/${id}`,
    matrix: `/myprojects/${projectId}/matrices/${id}`,
    folio: `/myprojects/${projectId}/folios/${id}`,
  }
  router.push(routes[type])
}

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
      <!-- Warning for no published media -->
      <div
        v-if="!publishStore.validations.media.hasMedia"
        class="media-warning-box"
      >
        <div class="formError">
          <b>Warning:</b> Your project has no published media.
        </div>
        <br />
        <p>
          MorphoBank requires at least one image per project to help communicate
          science. If you would like to pull an image from the Encyclopedia of
          Life
          <a href="#" class="text-primary">click here</a> or upload one from
          your desktop in the
          <a
            href="#"
            @click="router.push(`/myprojects/${projectId}/media`)"
            class="text-primary"
            >media tab</a
          >. Be sure to add the
          <a
            href="#"
            @click="router.push(`/myprojects/${projectId}/taxa`)"
            class="text-primary"
            >taxon</a
          >
          and
          <a
            href="#"
            @click="router.push(`/myprojects/${projectId}/specimens`)"
            class="text-primary"
            >specimen</a
          >
          information first. If you are completely confused -
          <a href="#" class="text-primary">Ask Us</a> and we will help you.
        </p>
      </div>

      <p>
        Before publishing your project, please confirm your publishing
        preferences and click the "Save Publishing Preferences" button.
      </p>
      <p>
        Please note your project's exemplar media will always be published to
        your project.
      </p>
      <p>
        If your project contains character ontologies within a matrix (see
        manual) those will automatically be published.
      </p>
      <hr style="height: 2px; background-color: #dedede; border: 0px" />
      <br />
      <div class="formError">* indicates mandatory field</div>

      <form @submit.prevent="savePreferences" id="publishingForm">
        <!-- Funding Acknowledgment -->
        <p style="font-size: 14px; line-height: 1.3em">
          <b>Funding acknowledgment:</b>
        </p>
        <div class="formLabel">
          <span class="formErrors">*</span> NSF Funded?<br />
          <span style="font-weight: normal">
            <input
              type="radio"
              name="nsf_funded"
              value="1"
              :checked="preferences.nsfFunded === true"
              @change="preferences.nsfFunded = true"
            />
            Yes&nbsp;&nbsp;&nbsp;&nbsp;
            <input
              type="radio"
              name="nsf_funded"
              value="0"
              :checked="preferences.nsfFunded === false"
              @change="preferences.nsfFunded = false"
            />
            No
          </span>
        </div>

        <br />
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
            @click="router.push(`/myprojects/${projectId}/taxa/extinct-batch`)"
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
          &nbsp;Place a CC0 tag on non-media data (this is optional)
        </div>

        <br />
        <p style="font-size: 14px; line-height: 1.3em">
          <b>General publishing preferences:</b>
        </p>
        <div class="formLabel">
          <input type="checkbox" v-model="preferences.allowDerivatives" />
          &nbsp;Include downloadable data files
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

      <!-- Unpublished Items Section -->
      <div class="unpublished-items-section">
        <div class="info-box">
          <b>Please Note:</b> <b>Individual</b> project documents, folios,
          matrices and media can be set to 'Never publish to project'.

          <template v-if="hasUnpublishedItems">
            The following items will <b>NOT</b> be published to your project:
            <div style="padding: 0px 0px 0px 20px">
              <!-- Documents -->
              <p v-if="unpublishedItems.documents.length > 0">
                <b
                  >{{ unpublishedItems.documents.length }}
                  {{
                    unpublishedItems.documents.length === 1
                      ? 'document'
                      : 'documents'
                  }}:</b
                >
                <template
                  v-for="(doc, index) in unpublishedItems.documents"
                  :key="doc.id"
                >
                  <a
                    href="#"
                    @click="editItem(doc.id, 'document')"
                    class="text-primary"
                    >{{ doc.title }}</a
                  >
                  <span v-if="index < unpublishedItems.documents.length - 1"
                    >,
                  </span>
                </template>
              </p>

              <!-- Folios -->
              <p v-if="unpublishedItems.folios.length > 0">
                <b
                  >{{ unpublishedItems.folios.length }}
                  {{
                    unpublishedItems.folios.length === 1 ? 'folio' : 'folios'
                  }}:</b
                >
                <template
                  v-for="(folio, index) in unpublishedItems.folios"
                  :key="folio.id"
                >
                  <a
                    href="#"
                    @click="editItem(folio.id, 'folio')"
                    class="text-primary"
                    >{{ folio.name }}</a
                  >
                  <span v-if="index < unpublishedItems.folios.length - 1"
                    >,
                  </span>
                </template>
              </p>

              <!-- Matrices -->
              <p v-if="unpublishedItems.matrices.length > 0">
                <b
                  >{{ unpublishedItems.matrices.length }}
                  {{
                    unpublishedItems.matrices.length === 1
                      ? 'matrix'
                      : 'matrices'
                  }}:</b
                >
                <template
                  v-for="(matrix, index) in unpublishedItems.matrices"
                  :key="matrix.id"
                >
                  <a
                    href="#"
                    @click="editItem(matrix.id, 'matrix')"
                    class="text-primary"
                    >{{ matrix.title }} (matrix {{ matrix.id }})</a
                  >
                  <span v-if="index < unpublishedItems.matrices.length - 1"
                    >,
                  </span>
                </template>
              </p>

              <!-- Media -->
              <p v-if="unpublishedItems.media.length > 0">
                <b>{{ unpublishedItems.media.length }} media:</b>
                <template
                  v-for="(media, index) in unpublishedItems.media"
                  :key="media.id"
                >
                  <a
                    href="#"
                    @click="editItem(media.id, 'media')"
                    class="text-primary"
                    >M{{ media.id }}</a
                  >
                  <span v-if="index < unpublishedItems.media.length - 1"
                    >,
                  </span>
                </template>
              </p>
            </div>
          </template>

          <template v-else>
            <div style="padding: 0px 0px 0px 20px">
              <p>All items are set to publish when project is published</p>
            </div>
          </template>
        </div>
      </div>
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
  color: #ef782f;
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
</style>
