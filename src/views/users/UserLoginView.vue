<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore.js'
import { useMessageStore } from '@/stores/MessageStore.js'
import router from '../../router'
import Alert from '@/components/main/Alert.vue'
import { useNotifications } from '@/composables/useNotifications'

const authStore = useAuthStore()
const route = useRoute()
const state = reactive({})
const messageStore = useMessageStore()
const { showError, showSuccess } = useNotifications()
const message = reactive({
  message: messageStore.getMessage(),
})

const submitForm = async () => {
  const loggedIn = await authStore.login(state.email, state.password)
  if (authStore.err) {
    showError(authStore.err, 'Sign in failed')
  }
  if (loggedIn) {
    showSuccess('Welcome back to MorphoBank!', 'Signed in')
    // Check if this is an anonymous reviewer
    if (authStore.isAnonymousReviewer) {
      const projectId = authStore.getAnonymousProjectId
      if (projectId) {
        router.push({ path: `/myprojects/${projectId}/overview` })
      } else {
        router.push({ path: '/' }) // Fallback to home
      }
    } else if (route.query.redirectPath) {
      // Prefer full path redirect when available (avoids missing required params)
      router.push({ path: `${route.query.redirectPath}` }).catch(() => {
        // If router refuses due to malformed saved query, fall back to session storage
        const fallbackPath = sessionStorage.getItem('mb-redirectPath')
        if (fallbackPath) {
          router.push({ path: fallbackPath })
        } else {
          router.push({ path: '/myprojects' })
        }
      })
    } else if (route.query.redirect) {
      // Handle named-route redirect with optional params/query
      const redirectRoute = { name: `${route.query.redirect}` }
      if (route.query.originalParams) {
        try {
          redirectRoute.params = JSON.parse(route.query.originalParams)
        } catch (e) {
          console.warn('Could not parse original route params:', e)
        }
      }
      if (route.query.originalQuery) {
        try {
          redirectRoute.query = JSON.parse(route.query.originalQuery)
        } catch (e) {
          console.warn('Could not parse original query parameters:', e)
        }
      }
      router.push(redirectRoute).catch(() => {
        // If required params are missing, fallback to fullPath if persisted
        const fallbackPath = sessionStorage.getItem('mb-redirectPath')
        if (fallbackPath) {
          router.push({ path: fallbackPath })
        } else {
          router.push({ path: '/myprojects' })
        }
      })
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
    <Alert
      :message="message"
      messageName="message"
      :alertType="messageStore.getMessageType()"
    ></Alert>
    
    <!-- ORCID Sign In (Primary) -->
    <div class="orcid-section mb-4">
      <a
        :href="orcidLoginUrl"
        class="w-100 btn btn-lg btn-orcid"
        >
        <div class="orcid-button-content">
          <div class="orcid-icon-wrapper">
            <img
              alt="ORCID logo"
              src="/ORCIDiD_iconvector.svg"
              class="orcid-icon"
            />
          </div>
          <span class="orcid-text">Sign in with ORCID</span>
        </div></a
      >
    </div>

    <!-- Or Separator -->
    <div class="separator-container mb-4">
      <div class="separator">
        <hr class="separator-line">
        <div class="separator-text-wrapper">
          <span class="separator-text">or</span>
        </div>
        <hr class="separator-line">
      </div>
    </div>

    <!-- Regular/Anonymous Login Form -->
    <form @submit.prevent="submitForm()">
      <div class="mb-3">
        <p class="text-muted small mb-3">
          <strong>MorphoBank Users:</strong> Use your email address<br>
          <strong>Anonymous Reviewers:</strong> Use your project number (e.g., 123, P123, or Project 123)
        </p>
      </div>
      
      <div class="form-floating mt-3">
        <input
          v-model.trim="state.email"
          type="text"
          class="form-control"
          id="email"
          placeholder="name@example.com or project number"
          required
        />
        <label for="email">Email address or Project ID</label>
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
      
      <button class="w-100 btn btn-lg btn-outline-primary mt-3" type="submit">
        Sign in
      </button>
    </form>
    <br />
  </div>
</template>

<style scoped>
.form-signin {
  width: 100%;
  max-width: 380px;
  padding: 20px;
  margin: auto;
}

/* ORCID Button Styling */
.btn-orcid {
  background-color: white;
  border: 2px solid #A6CE39;
  color: #A6CE39;
  font-weight: 600;
  transition: all 0.2s ease;
  padding: 12px 20px;
}

.btn-orcid:hover {
  background-color: #A6CE39;
  border-color: #A6CE39;
  color: white;
}

.btn-orcid:hover .orcid-icon-wrapper {
  background-color: white;
}

.orcid-button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.orcid-text {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1;
}

.orcid-icon-wrapper {
  background-color: #A6CE39;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.orcid-icon {
  width: 22px;
  height: 22px;
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Separator Styling */
.separator-container {
  position: relative;
  margin: 2rem 0;
}

.separator {
  display: flex;
  align-items: center;
  text-align: center;
}

.separator-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, #dee2e6 20%, #dee2e6 80%, transparent);
  border: none;
  margin: 0;
}

.separator-text-wrapper {
  position: relative;
  padding: 0 20px;
  background-color: white;
}

.separator-text {
  color: #6c757d;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: lowercase;
  letter-spacing: 0.5px;
}

/* Form Instructions */
.text-muted.small {
  font-size: 0.85rem;
  line-height: 1.4;
  text-align: left;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #dee2e6;
}

/* Adjust button styling */
.btn-outline-primary {
  font-weight: 500;
}
</style>
