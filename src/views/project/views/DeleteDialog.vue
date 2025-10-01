<script setup lang="ts">
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useNotifications } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/AuthStore'
import { AccessControlService, EntityType } from '@/lib/access-control.js'
const props = defineProps<{
  projectId: number | string
  mediaViews: any[]
}>()

const mediaViewsStore = useMediaViewsStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()
const authStore = useAuthStore()

async function deleteMediaViews(viewIds: number[]) {
  // Hard block anonymous reviewers and unauthorized users
  if (authStore.isAnonymousReviewer) {
    showError('Anonymous reviewers have view-only access and cannot delete.', 'Permission Denied')
    return
  }
  // Best-effort project-level create permission check for media views
  try {
    const { projectId } = props
    const result = await AccessControlService.canCreateEntity({
      entityType: EntityType.MEDIA_VIEW,
      projectId: typeof projectId === 'string' ? parseInt(projectId) : projectId,
    })
    if (!result.canCreate) {
      showError(result.reason || 'You do not have permission to delete media views.', 'Permission Denied')
      return
    }
  } catch (e) {
    // If the check fails, fail closed
    showError('You do not have permission to delete media views.', 'Permission Denied')
    return
  }
  const deleted = mediaViewsStore.deleteIds(props.projectId, viewIds)
  if (!deleted) {
    showError('Failed to delete views', 'Delete Failed')
  }
}
</script>
<template>
  <div class="modal" id="viewDeleteModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
        </div>
        <div class="modal-body" v-if="mediaViews.length">
          Really delete media views:
          <p v-for="mediaView in mediaViews" :key="mediaView.view_id">
            {{ mediaView.name }}
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
            @click="deleteMediaViews(mediaViews.map((v) => v.view_id))"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
