<script setup>
import { Modal } from 'bootstrap'
import { schema } from '@/views/project/common/citationSchema.js'

const props = defineProps({
  citation: Object,
  editCitation: Function,
})

async function createCitation(event) {
  const target = event.currentTarget
  const formData = new FormData(target)
  const json = Object.fromEntries(formData)
  const created = await props.editCitation(props.citation.link_id, json)
  if (created) {
    const element = document.getElementById('editCitationModal')
    const modal = Modal.getInstance(element)
    modal.hide()
    target.reset()
  } else {
    alert('Failed to edit citation')
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
    <form @submit.prevent="createCitation">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Citation</h5>
          </div>
          <div class="modal-body" v-if="citation">
            <template v-for="(definition, index) in schema" :key="index">
              <label for="index" class="form-label">{{
                definition.label
              }}</label>
              <component
                :is="definition.view"
                :name="index"
                :value="citation[index]"
                :disabled="index === 'reference_id'"
                v-bind="definition.args"
              >
              </component>
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
