<script setup>
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { userSchema } from '@/views/project/members/schema.js'

const route = useRoute()
const projectId = route.params.id
const userId = parseInt(route.params.userId)

const projectUsersStore = useProjectUsersStore()
const user = computed(() => projectUsersStore.getUserById(userId))

async function edit(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  json.group_ids = formData.getAll('group_ids')

  const success = await projectUsersStore.editUser(
    projectId,
    userId,
    json.membership_type,
    json.group_ids
  )
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to update member')
  }
}

onMounted(() => {
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})
</script>

<template>
  <LoadingIndicator :isLoaded="projectUsersStore.isLoaded">
    <div>
      <div v-if="user" class="d-flex">
        <p class="fw-bold">Editing:&nbsp;</p>
        {{ `${user.fname} ${user.lname}` }}
      </div>
      <form @submit.prevent="edit">
        <div class="row setup-content">
          <div
            v-for="(definition, index) in userSchema"
            :key="index"
            class="form-group mb-3"
          >
            <label :for="index" class="form-label fw-bold">{{
              definition.label
            }}</label>
            <component
              :key="index"
              :is="definition.view"
              :name="index"
              :value="user[index]"
              v-bind="definition.args"
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
