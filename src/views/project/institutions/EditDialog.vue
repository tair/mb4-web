<script setup lang="ts">
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'

const props = defineProps<{
  projectId: number | string
  institution: any
}>()

const projectInstitutionsStore = useProjectInstitutionStore()

async function editInstitution(event: any) {
  const formData = new FormData(event.target)
  const formObject = Object.fromEntries(formData.entries())

  const newName = formObject.name

  const response = await projectInstitutionsStore.editInstitution(
    props.projectId,
    props.institution.institution_id,
    newName
  )

  if (response == 200) {
    alert('Success.')
  } else {
    alert('Could not edit the chosen institution.')
  }
}
</script>

<template>
  <div class="modal" id="viewEditModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit</h5>
        </div>
        <div class="modal-body" v-if="institution">
          Please enter your new name:
          <p :key="institution.institution_id">
            {{ institution.name }}
          </p>
        </div>
        <form @submit.prevent="editInstitution">
          <input type="text" name="name" />
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              data-bs-dismiss="modal"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
