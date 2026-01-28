<script setup>
import { Modal } from 'bootstrap'
import { schema } from '@/views/project/common/citationSchema.js'
import { ref } from 'vue'
import Tooltip from '@/components/main/Tooltip.vue'

const props = defineProps({
  addCitation: Function,
})

const errorMessage = ref('')
const hasError = ref(false)

async function createCitation(event) {
  const target = event.currentTarget
  const formData = new FormData(target)
  const json = Object.fromEntries(formData)
  try {
    hasError.value = false
    errorMessage.value = ''
    const created = await props.addCitation(json)
    if (created) {
      const element = document.getElementById('addCitationModal')
      const modal = Modal.getInstance(element)

      // Remove focus from any focused element inside the modal before hiding
      const focusedElement = element.querySelector(':focus')
      if (focusedElement && 'blur' in focusedElement) {
        focusedElement.blur()
      }

      modal.hide()
      target.reset()
    }
  } catch (error) {
    hasError.value = true
    if (
      error.response?.status === 400 &&
      error.response?.data?.message === 'This citation already exists'
    ) {
      errorMessage.value =
        'This citation already exists. Please select a different reference.'
    } else {
      errorMessage.value =
        'Failed to add citation: ' +
        (error.response?.data?.message || error.message || 'Unknown error')
    }
  }
}

function clearError() {
  hasError.value = false
  errorMessage.value = ''
}
</script>
<template>
  <div
    class="modal fade"
    id="addCitationModal"
    data-bs-backdrop="static"
    data-bs-keyboard="true"
    tabindex="-1"
  >
    <form @submit.prevent="createCitation">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Add Citation
              <Tooltip
                content="Choose from the Bibliography added to this project. Type in the author last name or part of the title to narrow choices. Add to the Bibliography first, then select here."
              ></Tooltip>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <template v-for="(definition, index) in schema" :key="index">
              <div v-if="!definition.existed" class="form-group">
                <label for="index" class="form-label">{{
                  definition.label
                }}</label>
                <component
                  :key="index"
                  :is="definition.view"
                  :name="index"
                  :class="{
                    'is-invalid': hasError && index === 'reference_id',
                  }"
                  v-bind="definition.args"
                >
                </component>
                <div
                  v-if="hasError && index === 'reference_id'"
                  class="invalid-feedback"
                >
                  {{ errorMessage }}
                </div>
              </div>
            </template>
          </div>
          <!-- prettier-ignore -->
          <div class="modal-footer">
            <button
              type="reset"
              class="btn btn-outline-primary"
              data-bs-dismiss="modal"
              @click="clearError"
            >
              Cancel
            </button>
            <button class="btn btn-primary" type="submit">Create</button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
<style scoped>
.invalid-feedback {
  display: block;
}
</style>
