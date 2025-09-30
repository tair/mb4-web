<template>
  <div class="modal" id="matrixCopyrightModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Matrix copyright Preferences</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <p>
            <strong>Non-media data copyright preference:</strong>
          </p>
          <p>
            The purpose of storing data on MorphoBank is to share those data
            with the scientific community and the public so they may be reused
            for the advancement of research and education. Some researchers
            prefer to go a step further and place a CC0 tag on their data.
          </p>
          <div class="form-check">
            <input
              v-model="publish_cc0"
              class="form-check-input"
              name="cc0"
              type="checkbox"
              value="1"
              id="publishMatrixContentAsCC0"
            />
            <label class="form-check-label" for="publishMatrixContentAsCC0">
              <strong>Publish project matrix, documents, character list and ontologies
              with CC0 copyright license</strong>
            </label>
          </div>
          <p class="mt-2">
            <strong>NOTE: media copyright is handled separately</strong>
          </p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-outline-primary"
            data-bs-dismiss="modal"
          >
            Close
          </button>
          <button
            type="button"
            class="btn btn-primary"
            data-bs-dismiss="modal"
            @click="saveCopyrightPreference"
            :disabled="isSaving"
          >
            <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { setCopyRight } from '@/lib/copyright.js'
import { useNotifications } from '@/composables/useNotifications'

const props = defineProps({
  projectId: {
    type: [String, Number],
    required: true,
  },
  initialValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['updated'])
const { showError, showSuccess, showWarning, showInfo } = useNotifications()

const publish_cc0 = ref(props.initialValue)
const isSaving = ref(false)

// Watch for changes in initialValue prop
watch(() => props.initialValue, (newValue) => {
  publish_cc0.value = newValue
})

async function saveCopyrightPreference() {
  isSaving.value = true
  try {
    await setCopyRight(props.projectId, { publish_cc0: publish_cc0.value ? 1 : 0 })
    emit('updated', publish_cc0.value)
  } catch (error) {
    console.error('Error saving copyright preference:', error)
    showError('Failed to save copyright preference. Please try again.', 'Save Failed')
  } finally {
    isSaving.value = false
  }
}
</script>
