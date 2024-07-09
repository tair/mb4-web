<script setup>
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { userSchema } from '@/views/project/members/schema.js'

const route = useRoute()
const projectId = route.params.id
const userId = route.params.userId

const projectUsersStore = useProjectUsersStore()
const user = computed(() => projectUsersStore.getUserById(userId))
const isLoaded = computed(() => projectUsersStore.isLoaded)

async function editUser(event) {
  console.log(event.currentTarget)
  const formData = new FormData(event.currentTarget)
  const success = await projectUsersStore.edit(userId, formData)
  if (!success) {
    alert(response.data?.message || 'Failed to modify member')
    return
  }

  router.push({ path: `/myprojects/${projectId}/members` })
}

onMounted(() => {
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})

</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div>
      <p v-if="user">Editing: {{ `${user.fname} ${user.lname}` }} </p>
      <form @submit.prevent="editUser">
        <div class="row setup-content">
          <div
            v-for="(definition, index) in userSchema"
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

