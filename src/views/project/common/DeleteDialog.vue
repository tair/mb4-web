<script setup lang="ts">
import { Modal } from 'bootstrap'
import { useNotifications } from '@/composables/useNotifications'

const props = defineProps<{
  delete: () => Promise<boolean>
}>()

const { showError, showSuccess, showWarning, showInfo } = useNotifications()

async function handleDeleteButtonClicked() {
  const deleted = await props.delete()
  if (deleted) {
    const element = document.getElementById('deleteModal')
    const modal = Modal.getInstance(element)

    // Remove focus from any focused element inside the modal before hiding
    const focusedElement = element.querySelector(':focus') as HTMLElement
    if (focusedElement) {
      focusedElement.blur()
    }

    modal.hide()
  } else {
    showError('Failed to Delete', 'Delete Failed')
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
            class="btn btn-outline-primary"
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
