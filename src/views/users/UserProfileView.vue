<script setup>
import { reactive, ref, onMounted } from "vue";
import { useUserStore } from '@/stores/UserStore.js'
import { useAuthStore } from '@/stores/AuthStore.js'
import Tooltip from '@/components/main/Tooltip.vue'

const userStore = useUserStore()
const authStore = useAuthStore()
const user = ref(null);
const error = reactive({});
const orcidLoginUrl = ref(null);
const emailTooltipText='The e-mail address of this user. The address will be used for all mail-based system notifications and alerts to this user'
const insititutionalTootipText = 'Scientists on MorphoBank are often affiliated with more than one institution and those can be entered here. When you change institutions, your older, published projects will remain credited to the institution you belonged to at the time the paper was published on MorphoBank'

onMounted(async () => {
  try {
    orcidLoginUrl.value = await authStore.getOrcidLoginUrl();
    user.value = await userStore.getCurrentUser()
  } catch (error) {
    console.error('Error fetching current user:', error);
  }
});

const submitForm = async() => {

}
</script>

<template>
  <form @submit.prevent="submitForm" v-if="user" class="form-profile">
    <h3 class="mb-3 fw-normal">User Profile</h3>
    <p>All fields are required</p>
    <div class="form-group">
      <label for="firstName">First Name</label>
      <input id="firstName" type="text" class="form-control" v-model="user.firstName" required>
    </div>
    <div class="form-group">
      <label for="lastName">Last Name</label>
      <input id="lastName" type="text" class="form-control" v-model="user.lastName" required>
    </div>
    <div class="form-group">
      <label for="email">
        Email <Tooltip :content="emailTooltipText"></Tooltip>
      </label>
      <input id="email" type="email" class="form-control" v-model="user.email" required>
    </div>
    <div class="form-group">
      <label for="newPassword">Password<br>(Only enter a password if you wish to change your current password)</label>
      <input id="newPassword" type="password" class="form-control" v-model="user.newPassword">
    </div>
    <div class="form-group">
      <label for="newPasswordConfirm">Password (Confirm)</label>
      <input id="newPasswordConfirm" type="password" class="form-control" v-model="user.newPasswordConfirm">
    </div>
    <div class="form-group">
      <div class="data-error" id="institution-error" v-if="error.institutions">{{ error.institutions }}</div>
      <label>
        Institutional Affiliation(s) 
        <Tooltip :content="insititutionalTootipText"></Tooltip>
      </label> 
      <ul>
        <li v-for="institution in user.institutions" :key="institution.institution_id">{{ institution.name }}</li>
      </ul>

    </div>
    <div class="form-group row text-vert-center">
      <div class="col-sm-2" style="">ORCID</div>
      <div class="col-sm-10">
        <a v-if= "!user.orcid" :href="orcidLoginUrl" class="w-100 btn btn-lg btn-primary btn-white"><img alt="ORCID logo" src="/ORCIDiD_iconvector.svg" class="orcid-icon"/>  Link Account with ORCID</a>
        <div v-if="user.orcid">
          <img alt="ORCID logo" src="/ORCIDiD_iconvector.svg" title="ORCID iD" class="orcid-icon"/>  {{ user.orcid }}
        </div>
      </div>
    </div>
    <button class="w-100 btn btn-lg btn-primary form-group" type="submit">
        Update
    </button>
    <div
      v-if="userStore.err"
      class="border border-danger rounded text-danger p-3 my-3"
    >
      <div class="fw-bold">Update profile failed. Please try again!</div>
    </div>
  </form>
</template>

<style scoped>
.form-profile {
  width: 100%;
  max-width: 600px;
  padding: 15px;
}
.btn-white {
  background-color: #ffffff !important;
  border: 1px solid #ced4da !important;
  color: #333333;
}
.margin-top-s {
  margin-top: 10px;
}
.orcid-icon {
  width: 24px;
  height: 24px;
}
.form-group {
  margin-top: 10px;
}
.text-vert-center {
  display: flex; align-items: center;
}
.data-error {
  color: red;
  font-weight: bold;
}
</style>
