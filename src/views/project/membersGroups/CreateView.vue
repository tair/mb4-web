<script setup>
import router from '@/router'
import { useRoute } from 'vue-router'
import { useProjectMemberGroupsStore } from '@/stores/ProjectMemberGroupsStore'
import { useNotifications } from '@/composables/useNotifications'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { groupSchema } from '@/views/project/membersGroups/schema.js'

const route = useRoute()
const projectId = route.params.id

const projectMemberGroupsStore = useProjectMemberGroupsStore()
const { showError, showSuccess, showWarning, showInfo } = useNotifications()

async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await projectMemberGroupsStore.createGroup(projectId, json)
  if (success) {
    router.go(-1)
  } else {
    showError('Failed to create group', 'Create Failed')
  }
}
</script>

<template>
  <LoadingIndicator :isLoaded="projectMemberGroupsStore.isLoaded">
    <div>
      <p class="fw-bold">Creating new project member group</p>
      <form @submit.prevent="create">
        <div class="row setup-content">
          <div
            v-for="(definition, index) in groupSchema"
            :key="index"
            class="form-group mb-3"
          >
            <label :for="index" class="form-label">{{
              definition.label
            }}</label>
            <component :key="index" :is="definition.view" :name="index">
            </component>
          </div>
          <div class="btn-form-group">
            <button
              class="btn btn-outline-primary me-2"
              type="button"
              @click="$router.go(-1)"
            >
              Cancel
            </button>
            <button class="btn btn-primary" type="submit">Create</button>
          </div>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>
