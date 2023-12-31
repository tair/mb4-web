<script setup lang="ts">
import { Modal } from 'bootstrap'
import { useRoute } from 'vue-router'
import { useSpecimenCitationsStore } from '@/stores/SpecimenCitationsStore'

const route = useRoute()
const projectId = route.params.id
const specimenId = route.params.specimenId

const props = defineProps<{
  citations: any[]
}>()

const specimenCitationsStore = useSpecimenCitationsStore()

async function handleDelete() {
  const citationIds = props.citations.map((citation) => citation.link_id)
  const deleted = await specimenCitationsStore.deleteIds(
    projectId,
    specimenId,
    citationIds
  )
  if (deleted) {
    const element = document.getElementById('citationDeleteModal')
    const modal = Modal.getInstance(element)
    modal.hide()
  } else {
    alert('Failed to delete specimen')
  }
}
</script>
<template>
  <div
    class="modal fade"
    id="citationDeleteModal"
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
