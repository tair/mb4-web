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
const exist = ref()
const newProjectUser = ref()
const email = ref()

const projectUsersStore = useProjectUsersStore()

async function check(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  email.value = json.email

  const user = projectUsersStore.users.find(
    (user) => user.email == email.value
  )

  if (user == null) {
    const result = await projectUsersStore.checkEmail(projectId, json)
    if(result) {
      cont.value = true
      exist.value = result.exist
      newProjectUser.value = result.user
    } else {
      alert('Could not add a member to this project')
    }
  } else {
    alert('User is already a member of this project')
  }
}
async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  json.email = email.value
  const success = await projectUsersStore.createUser(projectId, json, exist.value)
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
            <component
              :is="schema.email.view"
              :name="'email'"
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
            <button class="btn btn-primary" type="submit">Go</button>
          </div>
        </div>
      </form>
    </div>
    <div v-else>
      <form @submit.prevent="create">
        <div class="row setup-content">
          <div v-if="exist">
            <p>{{ `${newProjectUser.fname} ${newProjectUser.lname}, with email address ${newProjectUser.email}, is already a member of the Morphobank community.` }}</p>
          </div>
          <div v-else>
            <p>{{`The individual with the email address ${newProjectUser.email} is not yet a member of the Morphobank community.`}}</p>
            <p>Please provide their first and last name so they can be added</p>
            <label :for="'fname'" class="form-label fw-bold">{{
              schema.fname.label
            }}</label>
            <component
              :is="schema.fname.view"
              :name="'fname'"
            >
            </component>
            <label :for="'lname'" class="form-label fw-bold">{{
              schema.lname.label
            }}</label>
            <component
              :is="schema.lname.view"
              :name="'lname'"
            >
            </component>
          </div>
          <div class="form-group mb-3">
            <label :for="'message'" class="form-label fw-bold">{{
              schema.message.label
            }}</label>
            <component
              :is="schema.message.view"
              :name="'message'"
            >
            </component>
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
            <button class="btn btn-primary" type="submit">Send Invitation</button>
          </div>
        </div>
      </form>
    </div>
  </LoadingIndicator>
</template>