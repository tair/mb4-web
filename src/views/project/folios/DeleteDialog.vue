<script setup lang="ts">
import { useFoliosStore } from '@/stores/FoliosStore'
const props = defineProps<{
  projectId: number | string
  folios: any[]
}>()

const foliosStore = useFoliosStore()

async function deleteFolios(folioIds: number[]) {
  const deleted = foliosStore.deleteIds(props.projectId, folioIds)
  if (!deleted) {
    alert('Failed to delete folio')
  }
}
</script>
<template>
  <div class="modal" id="folioDeleteModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
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
