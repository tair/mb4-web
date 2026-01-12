<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['confirm', 'cancel'])

const userName = computed(() => {
  if (!props.user) return ''
  return `${props.user.fname} ${props.user.lname}`.trim() || props.user.email
})

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}

function handleBackdropClick(event) {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <Teleport to="body">
    <template v-if="show">
      <!-- Backdrop as separate element -->
      <div class="modal-backdrop show" @click="handleCancel"></div>
      <!-- Modal as sibling, not child -->
      <div class="modal show d-block" tabindex="-1" @click="handleBackdropClick">
        <div class="modal-dialog modal-dialog-centered" @click.stop>
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fa fa-exclamation-triangle text-warning me-2"></i>
                Confirm User Deletion
              </h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="handleCancel"
              ></button>
            </div>
            <div class="modal-body">
              <p>
                Are you sure you want to delete the user
                <strong>{{ userName }}</strong>?
              </p>
              <div class="alert alert-info mb-0">
                <i class="fa fa-info-circle me-2"></i>
                <strong>Note:</strong> This is a soft delete. The user account will be marked as
                deleted but the data will be preserved in the database. The user will no longer
                be able to log in.
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-primary"
                @click="handleCancel"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-danger"
                @click="handleConfirm"
              >
                <i class="fa fa-trash me-2"></i>
                Delete User
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1050;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1055;
  overflow-x: hidden;
  overflow-y: auto;
}

.modal-content {
  background-color: #ffffff;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}
</style>

