<script setup lang="ts">
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
import InstitutionSearchInput from '../common/InstitutionSearchInput.vue'

const props = defineProps<{
  projectId: number | string
  institution: any
}>()

let institutionId = props.institution.institution_id
let institutionName = props.institution.name

const projectInstitutionsStore = useProjectInstitutionStore()

async function editInstitution() {
  if (
    institutionName == props.institution.name ||
    institutionName.trim().length == 0
  ) {
    alert('Please update your desired edits')
    return
  }

  const response = await projectInstitutionsStore.editInstitution(
    props.projectId,
    props.institution.institution_id,
    institutionName,
    institutionId
  )

  if (response) {
    alert('Success.')
  } else {
    alert('Could not edit the chosen institution.')
  }
}

function setInstitutionData(name: string, id: number) {
  institutionName = name
  institutionId = id
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
          Please make any changes to the institution below:
          <p :key="institution.institution_id">
            {{ institution.name }}
          </p>
        </div>
        <InstitutionSearchInput
          :projectId="Number(projectId)"
          @updateParent="setInstitutionData"
        >
        </InstitutionSearchInput>
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
            @click="editInstitution"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
