<script setup>
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useProjectMemberGroupsStore } from '@/stores/ProjectMemberGroupsStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { userSchema } from '@/views/project/members/schema.js'

const route = useRoute()
const projectId = route.params.id
const linkId = route.params.linkId

const projectUsersStore = useProjectUsersStore()
const projectMemberGroupsStore = useProjectMemberGroupsStore()
const user = computed(() => projectUsersStore.getUserByLinkId(linkId))
const isLoaded = computed(() => projectUsersStore.isLoaded)

async function edit(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  console.log("json")
  json.groups_membership = JSON.parse(json.groups_membership)
  //console.log()
  console.log("after change")
  console.log(json.groups_membership)
  console.log(json)
  const success = await projectUsersStore.editUser(projectId, linkId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to update member')
  }
}

onMounted(() => {
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
    //user[groups_membership] = projectMemberGroupsStore.fetchGroupsMembership(projectId, linkId)
  }
})
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div>
      <p>{{ user.groups_membership }}</p>
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
