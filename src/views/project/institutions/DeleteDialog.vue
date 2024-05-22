<script setup lang="ts">
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
import axios from 'axios'

const props = defineProps<{
  projectId: number | string
  institutions: any[]
}>()

const projectInstitutionsStore = useProjectInstitutionStore()
let destroyInstitution = false

async function removeInstitution() {
  const institutionIds = props.institutions.map((v) => v.institution_id)

  const deleted = await projectInstitutionsStore.removeInstitution(
    props.projectId,
    institutionIds
  )

  if (destroyInstitution) {
    const url = `${import.meta.env.VITE_API_URL}/projects/${
      props.projectId
    }/institutions/destroy`
    const response = await axios.post(url, { institutionIds })

    if (response.status != 200) {
      console.log('Could not remove institution from the database')
    }
  }

  if (deleted) {
    projectInstitutionsStore.fetchInstitutions(props.projectId)
  } else {
    alert('Failed to delete Institution')
  }
}

function toggledestroyInstitution() {
  if (!destroyInstitution) {
    destroyInstitution = true
  } else {
    destroyInstitution = false
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
          <p
            v-for="institution in institutions"
            :key="institution.institution_id"
          >
            {{ institution.name }}
          </p>
          <p>
            would you like to remove any institution from our database that is
            not referenced by another project?
          </p>

          <label class="item">
            <input
              type="checkbox"
              class="form-check-input"
              @click="toggledestroyInstitution()"
            />
          </label>
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
            @click="removeInstitution()"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
