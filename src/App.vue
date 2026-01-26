<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/AuthStore.js'
import NotificationContainer from '@/components/notifications/NotificationContainer.vue'
import '@/assets/css/buttons.css'
const authStore = useAuthStore()

onMounted(async () => {
  // First restore from localStorage (with validation)
  authStore.fetchLocalStore()
  
  // If we have restored auth data, verify it with the server
  if (authStore.user?.authToken) {
    await authStore.verifyAuthenticationWithServer()
  }
})
</script>
<template>
  <RouterView></RouterView>
  <NotificationContainer />
</template>
<style>
body {
  display: flex;
  flex: 1 1 0%;
  flex-direction: column;
  font-family: 'Open Sans', sans-serif;
  font-size: medium;
  min-height: 100vh;
}

#app {
  display: flex;
  flex: 1 1 0%;
  flex-direction: column;
}

.text-mb {
  color: var(--theme-orange);
}

.mb-color {
  color: var(--theme-orange);
}

.table-scroll {
  position: relative;
  overflow: auto;
  display: block;
}

a {
  text-decoration: none;
}

a:link {
  color: var(--theme-orange);
}

a[role='button']:link,
a[role='button']:hover {
  color: white;
}

.nav-link {
  color: var(--theme-orange) !important;
}

.card-header {
  color: white;
  background-color: var(--theme-orange);
}

/* Button styles are now imported from buttons.css */
</style>
