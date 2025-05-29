<script setup lang="ts">
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
const props = defineProps<{
  projectId: number | string
  mediaViews: any[]
}>()

const mediaViewsStore = useMediaViewsStore()

async function deleteMediaViews(viewIds: number[]) {
  const deleted = mediaViewsStore.deleteIds(props.projectId, viewIds)
  if (!deleted) {
    alert('Failed to delete views')
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
