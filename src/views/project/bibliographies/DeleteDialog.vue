<script setup lang="ts">
import BibliographyItem from '@/components/project/BibliographyItem.vue'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'

const props = defineProps<{
  projectId: number | string
  bibliographies: any[]
}>()

const bibliographiesStore = useBibliographiesStore()

async function deleteBibliographies(referenceIds: number[]) {
  const deleted = bibliographiesStore.deleteIds(props.projectId, referenceIds)
  if (!deleted) {
    alert('Failed to delete bibliographies')
  }
}
</script>
<template>
  <div
    class="modal fade"
    id="bibliographyDeleteModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
        </div>
        <div class="modal-body" v-if="bibliographies.length">
          Really delete Biliographies:
          <p
            v-for="bibliography in bibliographies"
            :key="bibliography.reference_id"
          >
            <BibliographyItem :bibliography="bibliography" />
          </p>
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
            @click="
              deleteBibliographies(bibliographies.map((b) => b.reference_id))
            "
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
