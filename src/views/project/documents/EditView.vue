<script setup>
import router from '@/router'
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useAuthStore } from '@/stores/AuthStore'
import { AccessControlService, EntityType } from '@/lib/access-control.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { documentSchema } from '@/views/project/documents/schema.js'

const route = useRoute()
const projectId = route.params.id
const documentId = parseInt(route.params.documentId)

const documentsStore = useDocumentsStore()
const projectUsersStore = useProjectUsersStore()
const authStore = useAuthStore()

const isLoaded = computed(
  () => documentsStore.isLoaded && projectUsersStore.isLoaded
)
const document = computed(() => documentsStore.getDocumentById(documentId))

// ACCESS CONTROL - Using centralized service
const accessResult = ref(null)
const restrictedFields = ref([])
const accessChecked = ref(false)

// Reactive access control check
const canEditDocument = computed(() => accessResult.value?.canEdit || false)
const accessMessage = computed(() => {
  if (!accessResult.value) return null
  return AccessControlService.getAccessMessage(
    accessResult.value,
    EntityType.PROJECT_DOCUMENT
  )
})

// Check access when data is loaded
async function checkAccess() {
  if (!document.value || !isLoaded.value || accessChecked.value) return

  // Ensure auth store is ready
  if (!authStore.user?.access) {
    authStore.fetchLocalStore()

    // If still no access, wait a bit and try again
    if (!authStore.user?.access) {
      setTimeout(checkAccess, 100)
      return
    }
  }

  try {
    const result = await AccessControlService.canEditEntity({
      entityType: EntityType.PROJECT_DOCUMENT,
      projectId: parseInt(projectId),
      entity: document.value,
    })

    accessResult.value = result
    restrictedFields.value = AccessControlService.getRestrictedFields(
      EntityType.PROJECT_DOCUMENT,
      result
    )
    accessChecked.value = true
  } catch (error) {
    console.error('Error checking access:', error)
    accessResult.value = {
      canEdit: false,
      reason: 'Error checking permissions',
      level: 'error',
    }
    accessChecked.value = true
  }
}

// Watch for when all required data becomes available
watch(
  [isLoaded, document, () => authStore.user],
  () => {
    if (
      isLoaded.value &&
      document.value &&
      authStore.user &&
      !accessChecked.value
    ) {
      checkAccess()
    }
  },
  { immediate: true }
)

// Helper function to check if a field should be disabled
function isFieldDisabled(field) {
  // Disable all fields if user can't edit the document
  if (!canEditDocument.value) return true

  // Disable restricted fields
  if (restrictedFields.value.includes(field)) return true

  return false
}

async function editDocument(event) {
  // Prevent submission if user doesn't have access
  if (!canEditDocument.value) {
    alert('You do not have permission to edit this document.')
    return
  }

  const formData = new FormData(event.currentTarget)

  // Remove restricted fields from the submission for security
  restrictedFields.value.forEach((field) => {
    formData.delete(field)
  })

  const success = await documentsStore.edit(projectId, documentId, formData)
  if (!success) {
    alert(response.data?.message || 'Failed to modify document')
    return
  }

  router.push({ path: `/myprojects/${projectId}/documents` })
}

onMounted(() => {
  // Ensure auth store is loaded from localStorage
  if (!authStore.user?.access) {
    authStore.fetchLocalStore()
  }

  if (!documentsStore.isLoaded) {
    documentsStore.fetchDocuments(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <!-- Access Control Messages -->
    <div
      v-if="accessMessage"
      :class="[
        'alert',
        accessMessage.type === 'error' ? 'alert-danger' : 'alert-info',
      ]"
      role="alert"
    >
      <i
        :class="
          accessMessage.type === 'error'
            ? 'fa-solid fa-exclamation-triangle'
            : 'fa-solid fa-info-circle'
        "
        class="me-2"
      ></i>
      {{ accessMessage.message }}
    </div>

    <div>
      <form @submit.prevent="editDocument">
        <div class="row setup-content">
          <div
            v-for="(definition, index) in documentSchema"
            :key="index"
            class="form-group"
          >
            <label :for="index" class="form-label">
              {{ definition.label }}
              <span v-if="isFieldDisabled(index)" class="text-muted ms-1"
                >(read-only)</span
              >
            </label>
            <component
              :key="index"
              :is="definition.view"
              :name="index"
              :value="document[index]"
              :disabled="isFieldDisabled(index)"
              v-bind="definition.args"
            >
            </component>
          </div>
          <div class="btn-form-group">
            <RouterLink :to="{ name: 'MyProjectDocumentsView' }">
              <button class="btn btn-outline-primary" type="button">
                Cancel
              </button>
            </RouterLink>
            <button
              class="btn btn-primary"
              type="submit"
              :disabled="!canEditDocument"
              :title="
                !canEditDocument
                  ? 'You do not have permission to edit this document'
                  : ''
              "
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>
<style scoped></style>
