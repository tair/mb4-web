<script setup lang="ts">
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'

const props = defineProps<{
  projectId: number | string
  institutions: any[]
}>()

const projectInstitutionsStore = useProjectInstitutionStore()

async function removeInstitution(institutionIds: number[]) {
  const deleted = await projectInstitutionsStore.removeInstitution(
    props.projectId,
    institutionIds
  )

  if (deleted) {
    projectInstitutionsStore.fetchInstitutions(props.projectId)
  } else {
    alert('Failed to delete Institution')
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
        <div class="modal-body" v-if="institutions.length">
          Really delete institution from project:
          <p v-for="inst in institutions" :key="inst.institutionId">
            {{ inst.name }}
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
            @click="removeInstitution(institutions.map((v) => v.institutionId))"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
