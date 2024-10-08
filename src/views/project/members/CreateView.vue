<script setup>
import router from '@/router'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import TextArea from '@/components/project/TextArea.vue'
import TextInput from '@/components/project/TextInput.vue'
import SelectInput from '@/components/project/SelectInput.vue'

const route = useRoute()
const projectId = route.params.id
const cont = ref(false)
const newProjectUser = ref()
const email = ref()
const existingUser = ref()

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
  const isProjectMember = projectUsersStore.isUserInProject(json.email)

  if (!isProjectMember) {
    const result = await projectUsersStore.isEmailAvailable(projectId, json)
    // we check email and see if a user with the email exist in morphobank
    // or not (exist property from result will tell us)
    if (!result.errorMessage) {
      existingUser.value = result.existing_user
      newProjectUser.value = result.user
      cont.value = true
    } else {
      alert(result.errorMessage)
    }
  } else {
    alert('User is already a member of this project')
  }
}
async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  // if the user existed we'll send their user_id back
  // if they did not then we'll send back their email to add a row to users
  if (existingUser.value) {
    json.user_id = newProjectUser.value.user_id
  } else {
    json.email = newProjectUser.value.email
  }
  // could add argument to send if user already exist or not
  const success = existingUser.value
    ? await projectUsersStore.addMember(projectId, json)
    : await projectUsersStore.createUser(projectId, json)
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
            <label :for="'email'" class="form-label"
              >Email address of new workgroup member</label
            >
            <TextInput :name="'email'"> </TextInput>
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
          <div v-if="existingUser">
            <p>
              {{
                `${newProjectUser.fname} ${newProjectUser.lname}, with email address ${newProjectUser.email}, is already a member of the Morphobank community.`
              }}
            </p>
          </div>
          <div v-else>
            <p>
              {{
                `This individual with the email address ${newProjectUser.email} is not yet a member of the morphobank community.`
              }}
            </p>
            <p>Please provide their first and last name so they may be added</p>
            <label :for="'fname'" class="form-label">First Name</label>
            <TextInput :name="'fname'"> </TextInput>
            <label :for="'lname'" class="form-label">Last Name</label>
            <TextInput :name="'lname'"> </TextInput>
          </div>
          <div class="form-group mb-3">
            <label :for="'message'" class="form-label fw-bold"
              >Please provide a message to be emailed to the new workgroup
              member</label
            >
            <TextArea :name="'message'"> </TextArea>
            <label :for="'membership_type'" class="form-label fw-bold"
              >Membership Type</label
            >
            <SelectInput
              :name="'membership_type'"
              :value="0"
              v-bind:options="{
                'Full membership (can edit everything)': 0,
                'Observer (cannot edit)': 1,
                'Character annotater (can edit everything but characters and states)': 2,
                'Bibliography maintainer (can edit bibliography only)': 3,
              }"
            >
            </SelectInput>
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
