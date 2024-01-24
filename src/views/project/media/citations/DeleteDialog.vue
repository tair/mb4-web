<script setup lang="ts">
import { Modal } from 'bootstrap'
import { useRoute } from 'vue-router'
import { useMediaCitationsStore } from '@/stores/MediaCitationsStore'

const route = useRoute()
const projectId = route.params.id
const mediaId = route.params.mediaId

const props = defineProps<{
  citations: any[]
}>()

const mediaCitationsStore = useMediaCitationsStore()

async function handleDelete() {
  const citationIds = props.citations.map((citation) => citation.link_id)
  const deleted = await mediaCitationsStore.deleteIds(
    projectId,
    mediaId,
    citationIds
  )
  if (deleted) {
    const element = document.getElementById('mediaCitationDeleteModal')
    if (element) {
      const modal = Modal.getInstance(element)
      if (modal) {
        modal.hide()
      }
    }
  } else {
    alert('Failed to delete citations')
  }
}
</script>
<template>
  <div
    class="modal fade"
    id="mediaCitationDeleteModal"
    data-bs-backdrop="static"
    tabindex="-1"
    aria-labelledby="staticBackdropLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Delete Citations</h5>
        </div>
        <div class="modal-body">
          Delete selected {{ citations.length }} Citation(s)
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="handleDelete">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
