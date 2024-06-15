<script setup>
import { Modal } from 'bootstrap'
import { schema } from '@/views/project/common/citationSchema.js'

const props = defineProps({
  addCitation: Function,
})

async function createCitation(event) {
  const target = event.currentTarget
  const formData = new FormData(target)
  const json = Object.fromEntries(formData)
  const created = await props.addCitation(json)
  if (created) {
    const element = document.getElementById('addCitationModal')
    const modal = Modal.getInstance(element)
    modal.hide()
    target.reset()
  } else {
    alert('Failed to add citation')
  }
}
</script>
<template>
  <div
    class="modal fade"
    id="addCitationModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <form @submit.prevent="createCitation">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Citation</h5>
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
                  v-bind="definition.args"
                >
                </component>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button
              type="reset"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
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
<style scoped></style>
