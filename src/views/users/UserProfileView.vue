<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from '@/stores/UserStore.js'
import { useAuthStore } from '@/stores/AuthStore.js'
import axios from 'axios'

const userStore = useUserStore()
const authStore = useAuthStore()
const user = ref(null);
const orcidLoginUrl = ref(null);

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
  <h1>User Profile</h1>
  <p>All fields are required</p>
  <form @submit.prevent="submitForm" v-if="user">
    <div>
      <label for="firstname">First Name:</label>
      <input type="text" id="firstname" v-model="user.firstName" required />
    </div>

    <div>
      <label for="lastname">Last Name:</label>
      <input type="text" id="lastname" v-model="user.lastName" required />
    </div>

    <div>
      <label for="email">Email:</label>
      <input type="email" id="email" v-model="user.email" required />
    </div>

    <a v-if= "!user.orcid" :href="orcidLoginUrl" class="w-100 btn btn-lg btn-primary btn-white margin-s-top"><img alt="ORCID logo" src="/ORCIDiD_iconvector.svg" class="orcid-icon"/>  Link Account with ORCID</a>
    <div v-if="user.orcid">
      <img alt="ORCID logo" src="/ORCIDiD_iconvector.svg" class="orcid-icon"/>  {{ user.orcid }}
    </div>
    <button class="w-100 btn btn-lg btn-primary margin-s-top" type="submit">
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
.form-signin {
  width: 100%;
  max-width: 330px;
  padding: 15px;
  margin: auto;
}
.btn-white {
  background-color: #ffffff !important;
  border: 1px solid #ced4da !important;
  color: #333333;
}
.margin-s-top {
  margin-top: 10px;
}
.orcid-icon {
  width: 24px;
  height: 24px;
}
</style>
