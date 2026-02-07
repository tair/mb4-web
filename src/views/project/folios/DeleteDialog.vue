<script setup lang="ts">
import { useFoliosStore } from '@/stores/FoliosStore'
import { useNotifications } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/AuthStore'
import { AccessControlService, EntityType } from '@/lib/access-control.js'
const props = defineProps<{
  projectId: number | string
  folios: any[]
}>()

const foliosStore = useFoliosStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()
const authStore = useAuthStore()

async function deleteFolios(folioIds: number[]) {
  if (authStore.isAnonymousReviewer) {
    showError('Anonymous reviewers have view-only access and cannot delete.', 'Permission Denied')
    return
  }
  try {
    const { projectId } = props
    const result = await AccessControlService.canCreateEntity({
      entityType: EntityType.FOLIO,
      projectId: typeof projectId === 'string' ? parseInt(projectId) : projectId,
    })
    if (!result.canCreate) {
      showError(result.reason || 'You do not have permission to delete folios.', 'Permission Denied')
      return
    }
  } catch (e) {
    showError('You do not have permission to delete folios.', 'Permission Denied')
    return
  }
  const deleted = foliosStore.deleteIds(props.projectId, folioIds)
  if (!deleted) {
    showError('Failed to delete folio', 'Delete Failed')
  }
}
</script>
<template>
  <div class="modal" id="folioDeleteModal" data-bs-keyboard="true" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" v-if="folios.length">
          Really delete folios:
          <p v-for="folio in folios" :key="folio.folio_id">
            {{ folio.name }}
          </p>
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
            @click="deleteFolios(folios.map((f) => f.folio_id))"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
