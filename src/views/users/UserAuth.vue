<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore.js'
import { useMessageStore } from '@/stores/MessageStore.js'
import router from '../../router'

const route = useRoute()
const authStore = useAuthStore()
const loading = ref(true)
const messages = ref(null)
const showRegister = ref(null)
const showSignin = ref(null)
const authCode = route.query.code

onMounted(async () => {
  try {
    const setProfileMsg = await authStore.setORCIDProfile(authCode)
    if (authStore.user && authStore.user.authToken) {
      if (setProfileMsg.redirectToProfile) {
        if (setProfileMsg.errorMsg) {
          const messageStore = useMessageStore()
          messageStore.setErrorMessage(setProfileMsg.errorMsg)
        }
        router.push('myprofile')
      } else {
        router.push('/myprojects')
      }
      return
    }
    messages.value = setProfileMsg.messages
    showRegister.value = setProfileMsg.showRegister
    showSignin.value = setProfileMsg.showSignin
  } catch (error) {
    messages.value = {
      msg: "We've experienced unexpected error when authenticating your profile.<br>Please try again or come back later.",
    }
    showSignin.value = true
    showRegister.value = false
  }
  loading.value = false
})
</script>

<style scoped>
.container {
  width: 100%;
  max-width: 400px;
  padding: 15px;
  margin: auto;
}
.btn-white {
  background-color: #ffffff !important;
  border: 1px solid #ced4da !important;
  color: #333333;
}
.spinner-img {
  height: 50px;
}
</style>

<template>
  <div class="container">
    <div v-if="loading" class="mt-5">
      <img
        class="spinner-img"
        alt="Loading spinner"
        src="/Loading_spinner.svg"
        title="Loading Spinner"
      />
      Authenticating User Profile
    </div>
    <div class="mt-5" v-else>
      <div v-if="messages.msg" v-html="messages.msg"></div>
      <div class="mt-4">
        <div v-if="messages.signinMsg" v-html="messages.signinMsg"></div>
        <RouterLink
          :to="{ path: 'login', query: { redirect: 'myprofile' } }"
          v-if="showSignin"
        >
          <button class="mt-3 w-100 btn btn-lg btn-primary">
            Sign in to MorphoBank
          </button>
        </RouterLink>
      </div>
      <div class="mt-4">
        <div v-if="messages.registerMsg" v-html="messages.registerMsg"></div>
        <RouterLink to="register" v-if="showRegister">
          <button class="mt-3 w-100 btn btn-lg btn-white">
            Create an Account
          </button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
