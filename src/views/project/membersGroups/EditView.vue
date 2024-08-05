<script setup>
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectMemberGroupsStore } from '@/stores/ProjectMemberGroupsStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { groupSchema } from '@/views/project/membersGroups/schema.js'

const route = useRoute()
const projectId = route.params.id
const groupId = route.params.groupId

const projectMemberGroupsStore = useProjectMemberGroupsStore()
const group = computed(() => projectMemberGroupsStore.getGroupById(groupId))
const isLoaded = computed(() => projectMemberGroupsStore.isLoaded)

async function edit(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await projectMemberGroupsStore.editGroup(projectId, groupId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to update group')
  }
}

onMounted(() => {
  if (!projectMemberGroupsStore.isLoaded) {
    projectMemberGroupsStore.fetchGroups(projectId)
  }
})
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div>
      <div v-if="group" class="d-flex">
        <p class="fw-bold">Editing:&nbsp;</p>
        {{ group.group_name }}
      </div>
      <form @submit.prevent="edit">
        <div class="row setup-content">
          <div
            v-for="(definition, index) in groupSchema"
            :key="index"
            class="form-group mb-3"
          >
            <label :for="index" class="form-label">{{
              definition.label
            }}</label>
            <component
              :key="index"
              :is="definition.view"
              :name="index"
              :value="group[index]"
            >
            </component>
          </div>
          <div class="btn-form-group">
            <button
              class="btn btn-primary me-2"
              type="button"
              @click="$router.go(-1)"
            >
              Cancel
            </button>
            <button class="btn btn-primary" type="submit">Save</button>
          </div>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>