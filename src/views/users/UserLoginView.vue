<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore.js'
import { useMessageStore } from '@/stores/MessageStore.js'
import router from '../../router'
import Alert from '@/components/main/Alert.vue'

const authStore = useAuthStore()
const route = useRoute()
const state = reactive({})
const messageStore = useMessageStore()
const message = reactive({
  message: messageStore.getMessage(),
})
const error = reactive({})

const submitForm = async () => {
  const loggedIn = await authStore.login(state.email, state.password)
  if (authStore.err) {
    error.login = 'Login failed. ' + authStore.err
  }
  if (loggedIn) {
    if (route.query.redirect) {
      router.push({ name: `${route.query.redirect}` })
    } else {
      router.push({ path: '/myprojects' })
    }
  }
}

const orcidLoginUrl = ref(null)

onMounted(async () => {
  orcidLoginUrl.value = await authStore.getOrcidLoginUrl()
})
//clears the message if you change page
onBeforeUnmount(() => {
  messageStore.clearMessage()
})
</script>

<template>
  <div class="form-signin">
    <form @submit.prevent="submitForm()">
      <Alert
        :message="message"
        messageName="message"
        :alertType="messageStore.getMessageType()"
      ></Alert>
      <h3 class="mb-3 fw-normal">Please sign in</h3>
      <div class="form-floating mt-3">
        <input
          v-model.trim="state.email"
          type="text"
          class="form-control"
          id="email"
          placeholder="name@example.com"
          required
        />
        <label for="email">Email address</label>
      </div>
      <div class="form-floating mt-2">
        <input
          v-model.trim="state.password"
          type="password"
          class="form-control"
          id="password"
          placeholder="Password"
          required
        />
        <label for="password">Password</label>
      </div>
      <div class="form-floating">
        <RouterLink
          class="p-0 m-1 text-nowrap float-end"
          style="text-align: right"
          to="resetpassword"
          >Forget your password?</RouterLink
        >
      </div>
      <Alert :message="error" messageName="login" alertType="danger"></Alert>
      <button class="w-100 btn btn-lg btn-primary mt-3" type="submit">
        Sign in
      </button>
      <a
        :href="orcidLoginUrl"
        class="w-100 btn btn-lg btn-primary btn-white mt-3"
        ><img
          alt="ORCID logo"
          src="/ORCIDiD_iconvector.svg"
          class="orcid-icon"
        />
        Sign in with ORCID</a
      >
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
.orcid-icon {
  width: 24px;
  height: 24px;
}
</style>
