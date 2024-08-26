<script setup>
import router from '@/router'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { schema } from '@/views/project/members/createSchema.js'

const route = useRoute()
const projectId = route.params.id
const cont = ref(false)
const newProjectUser = ref()
const email = ref()

const projectUsersStore = useProjectUsersStore()

async function check(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  // checking if email is in correct format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailPattern.test(json.email)
  if (!isValid) {
    alert('E-mail address is not valid.')
    return
  }
  // email is valid so we store it for later use
  email.value = json.email
  // checking if user with email exist in the project already
  const isProjectMember = await inProject(json.email)

  if (!isProjectMember) {
    const result = await projectUsersStore.isAvailableUser(projectId, json)
    // we check email and see if a user with the email exist in morphobank
    // or not (exist property from result will tell us)
    if (!result.errorMessage) {
      newProjectUser.value = result.user
      cont.value = true
    } else {
      alert(result.errorMessage)
    }
  } else {
    alert('User is already a member of this project')
  }
}
async function inProject(em) {
  const user = projectUsersStore.users.find((user) => user.email == email.value)
  return user == null ? false : true
}
async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  json.user_id = newProjectUser.value.user_id
  const success = await projectUsersStore.createUser(projectId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to create member')
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
    <div v-if="!cont">
      <p>Creating new project member</p>
      <form @submit.prevent="check">
        <div class="row setup-content">
          <div class="form-group mb-3">
            <label :for="'email'" class="form-label">{{
              schema.email.label
            }}</label>
            <component :is="schema.email.view" :name="'email'"> </component>
          </div>
          <div class="btn-form-group">
            <button
              class="btn btn-primary me-2"
              type="button"
              @click="$router.go(-1)"
            >
              Cancel
            </button>
            <button class="btn btn-primary" type="submit">Go</button>
          </div>
        </div>
      </form>
    </div>
    <div v-else>
      <form @submit.prevent="create">
        <div class="row setup-content">
          <div>
            <p>
              {{
                `${newProjectUser.fname} ${newProjectUser.lname}, with email address ${newProjectUser.email}, is already a member of the Morphobank community.`
              }}
            </p>
          </div>
          <div class="form-group mb-3">
            <label :for="'message'" class="form-label fw-bold">{{
              schema.message.label
            }}</label>
            <component :is="schema.message.view" :name="'message'"> </component>
            <label :for="'membership_type'" class="form-label fw-bold">{{
              schema.membership_type.label
            }}</label>
            <component
              :is="schema.membership_type.view"
              :name="'membership_type'"
              :value="0"
              v-bind="schema.membership_type.args"
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
            <button class="btn btn-primary" type="submit">
              Send Invitation
            </button>
          </div>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>
