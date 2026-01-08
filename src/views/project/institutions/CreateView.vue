<script setup>
import router from '@/router'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectInstitutionStore } from '@/stores/ProjectsInstitutionStore'
import { useNotifications } from '@/composables/useNotifications'
import InstitutionSearchInput from '@/views/project/common/InstitutionSearchInput.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import AddInstitutionDialog from '@/components/dialogs/AddInstitutionDialog.vue'
import { Modal } from 'bootstrap'

const route = useRoute()
const projectId = route.params.id
const projectInstitutionsStore = useProjectInstitutionStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()
const isLoaded = computed(() => projectInstitutionsStore.isLoaded)

const institutionId = ref(null)
const institutionName = ref(null)

onMounted(() => {
  if (!projectInstitutionsStore.isLoaded) {
    projectInstitutionsStore.fetchInstitutions(projectId)
  }
})

async function createInstitution() {
  const institutionXProject = projectInstitutionsStore.institutions.find(
    (institution) => institution.name == institutionName.value
  )

  if (institutionXProject == null) {
    const result = await projectInstitutionsStore.addInstitution(
      projectId,
      institutionId.value,
      institutionName.value
    )

    if (!result) {
      showError('Could not add Institution to Project', 'Add Failed')
    } else {
      // Determine redirect path based on current route
      const isPublishedRoute = route.path.startsWith('/project/')
      const redirectPath = isPublishedRoute 
        ? `/project/${projectId}/institutions`
        : `/myprojects/${projectId}/institutions`
      await router.push({ path: redirectPath })
    }
  } else {
    showWarning('Institution already associated with this project', 'Already Associated')
  }
}

function setInstitutionData(name, id) {
  institutionName.value = name
  institutionId.value = id
}

// Open add institution dialog
const openAddInstitutionDialog = () => {
  const modalElement = document.getElementById('addInstitutionModal')
  const modal = new Modal(modalElement)
  modal.show()
}

// Handle institution creation from dialog
const handleInstitutionCreated = (institution) => {
  // Set the selected institution data
  setInstitutionData(institution.name, institution.institution_id)
  
  // Show notification about pending approval if applicable
  if (institution.pendingApproval || institution.active === 0) {
    showInfo(
      `Institution "${institution.name}" has been submitted for curator approval. You can use it now, but it will be visible to others once approved.`,
      'Institution Created'
    )
  } else {
    showSuccess(`Institution "${institution.name}" selected.`)
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <h1>Add Institution</h1>

    <header>
      To add an institution fill out the text field and select save.
    </header>

    <div class="action-bar">
      <RouterLink :to="route.path.startsWith('/project/') ? `/project/${projectId}/institutions` : `/myprojects/${projectId}/institutions`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-arrow-left"></i>
          <span>Back to Institutions</span>
        </button>
      </RouterLink>
    </div>

    <form>
      <div class="form-section">
        <InstitutionSearchInput
          :projectId="Number(projectId)"
          :selectedInstitutionId="institutionId"
          :selectedInstitutionName="institutionName"
          @updateParent="setInstitutionData"
        >
        </InstitutionSearchInput>
        
        <!-- Add Institution Link -->
        <div class="mt-2">
          <a 
            href="#" 
            @click.prevent="openAddInstitutionDialog"
            class="text-primary"
            style="font-size: 0.9em;"
          >
            Can't find your institution? Add new institution
          </a>
        </div>
        
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-primary"
            @click="createInstitution()"
            :disabled="!institutionName || !institutionId"
          >
            <i class="fa fa-save"></i>
            Save
          </button>
        </div>
      </div>
    </form>
    
    <!-- Add Institution Modal -->
    <AddInstitutionDialog :onInstitutionCreated="handleInstitutionCreated" />
  </LoadingIndicator>
</template>

<style scoped>
@import '@/views/project/styles.css';

.form-section {
  margin: 32px 0;
  padding: 20px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.form-actions .btn {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
