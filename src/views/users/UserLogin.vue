<script setup>
import { reactive } from 'vue'
import { useAuthStore } from '@/stores/AuthStore.js'
import { ref } from 'vue';
import axios from 'axios'
import router from '../../router'

const authStore = useAuthStore()

const state = reactive({})

const submitForm = async () => {
  const flag = await authStore.login(state.email, state.password)
  if (flag) {
    router.push({ path: '/myprojects' })
  }
}

const orcidLoginUrl = ref(null)

axios.get(`${import.meta.env.VITE_API_URL}/auth/get-orcid-login-url`)
  .then(response => {
    orcidLoginUrl.value = response.data.url;
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
</script>

<template>
  <div class="form-signin">
    <form @submit.prevent="submitForm()">
      <h1 class="h3 mb-3 fw-normal">Please sign in</h1>

      <div class="form-floating margin-s-top">
        <input
          v-model.trim="state.email"
          type="text"
          class="form-control"
          id="email"
          placeholder="name@example.com"
        />
        <label for="email">Email address</label>
      </div>
      <div class="form-floating margin-s-top">
        <input
          v-model.trim="state.password"
          type="password"
          class="form-control"
          id="password"
          placeholder="Password"
        />
        <label for="password">Password</label>
      </div>
      <button class="w-100 btn btn-lg btn-primary margin-s-top" type="submit">
        Sign in
      </button>
      <button class="w-100 btn btn-lg btn-primary btn-white margin-s-top">
        <a :href="orcidLoginUrl"><img alt="ORCID logo" src="/ORCIDiD_iconvector.svg" class="orcid-icon"/>  Sign in with ORCID</a>
      </button>

      <div
        v-if="authStore.err"
        class="border border-danger rounded text-danger p-3 my-3"
      >
        <div class="fw-bold">Login failed. Please try again!</div>
      </div>
    </form>
    <br />
  </div>
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
}
.btn-white > a {
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
