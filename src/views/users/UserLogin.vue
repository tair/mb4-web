<script setup>
import { reactive } from 'vue'
import router from '../../router'
import { useAuthStore } from '@/stores/storeAuth.js'

const authStore = useAuthStore()

const state = reactive({
  email: 't@g.com',
  password: '12345',
})

const submitForm = async () => {
  const flag = await authStore.login(state.email, state.password)
  if (flag) router.push({ path: '/myprojects' })
}
</script>

<template>
  <div class="form-signin">
    <form @submit.prevent="submitForm()">
      <h1 class="h3 mb-3 fw-normal">Please sign in</h1>

      <div class="form-floating">
        <input
          v-model.trim="state.email"
          type="email"
          class="form-control"
          id="email"
          placeholder="name@example.com"
        />
        <label for="email">Email address</label>
      </div>
      <div class="form-floating">
        <input
          v-model.trim="state.password"
          type="password"
          class="form-control"
          id="password"
          placeholder="Password"
        />
        <label for="password">Password</label>
      </div>
      <button class="w-100 btn btn-lg btn-primary" type="submit">
        Sign in
      </button>

      <div
        v-if="authStore.err"
        class="border border-danger rounded text-danger p-3 my-3"
      >
        <div class="fw-bold">Login failed. Please try again!</div>
        <!-- {{ authStore.err }} -->
      </div>
    </form>
    <br />

    <button class="btn btn-success" @click="authStore.fetchUsers()">
      Fetch Users
    </button>
  </div>
</template>

<style scoped>
.form-signin {
  width: 100%;
  max-width: 330px;
  padding: 15px;
  margin: auto;
}
</style>
