<script setup lang="ts">
import { Modal } from 'bootstrap'

const props = defineProps<{
  delete: () => Promise<boolean>
}>()

async function handleDeleteButtonClicked() {
  const deleted = await props.delete()
  if (deleted) {
    const element = document.getElementById('deleteModal')
    const modal = Modal.getInstance(element)
    modal.hide()
  } else {
    alert('Failed to Delete')
  }
}
</script>
<template>
  <div
    class="modal fade"
    id="deleteModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
        </div>
        <div class="modal-body">
          <slot name="modal-body"></slot>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            data-bs-dismiss="modal"
            @click="handleDeleteButtonClicked"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
