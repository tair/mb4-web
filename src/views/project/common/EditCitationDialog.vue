<script setup>
import { computed } from 'vue'
import { Modal } from 'bootstrap'
import { schema } from '@/views/project/common/citationSchema.js'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { getBibliographyText } from '@/utils/bibliography'

const bibliographiesStore = useBibliographiesStore()

const props = defineProps({
  citation: Object,
  editCitation: Function,
})

const bibliographyTitle = computed(() => {
  if (props.citation?.reference_id) {
    const bibliography = bibliographiesStore.getReferenceById(
      props.citation.reference_id
    )
    return bibliography ? getBibliographyText(bibliography) : 'Loading...'
  }
  return ''
})

async function editCitation(event) {
  const target = event.currentTarget
  const formData = new FormData(target)
  const json = Object.fromEntries(formData)

  try {
    const created = await props.editCitation(props.citation.link_id, json)
    if (created) {
      const element = document.getElementById('editCitationModal')
      const modal = Modal.getInstance(element)

      // Remove focus from any focused element inside the modal before hiding
      const focusedElement = element.querySelector(':focus')
      if (focusedElement && 'blur' in focusedElement) {
        focusedElement.blur()
      }

      modal.hide()
      target.reset()
    } else {
      alert('Failed to edit citation')
    }
  } catch (error) {
    console.error('Error editing citation:', error)
    alert(
      'Failed to edit citation: ' +
        (error.response?.data?.message || error.message || 'Unknown error')
    )
  }
}
</script>
<template>
  <div
    class="modal fade"
    id="editCitationModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <form @submit.prevent="editCitation">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Citation</h5>
          </div>
          <div class="modal-body" v-if="citation">
            <!-- Show bibliography as read-only text -->
            <div class="form-group">
              <label class="form-label">Citation</label>
              <input
                type="text"
                class="form-control"
                :value="bibliographyTitle"
                disabled
                readonly
              />
            </div>

            <!-- Show other editable fields -->
            <template v-for="(definition, index) in schema" :key="index">
              <div
                v-if="index !== 'reference_id' && !definition.existed"
                class="form-group"
              >
                <label for="index" class="form-label">{{
                  definition.label
                }}</label>
                <component
                  :is="definition.view"
                  :name="index"
                  :value="citation[index]"
                  v-bind="definition.args"
                >
                </component>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button
              type="reset"
              class="btn btn-outline-primary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button class="btn btn-primary" type="submit">Save</button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
<style scoped></style>
