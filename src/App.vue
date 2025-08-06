<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/AuthStore.js'
import NotificationContainer from '@/components/notifications/NotificationContainer.vue'
import '@/assets/css/buttons.css'
const authStore = useAuthStore()

onMounted(() => {
  authStore.fetchLocalStore()
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
  color: #ef782f;
}

.mb-color {
  color: #ef782f;
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
  color: #ef782f;
}

a[role='button']:link,
a[role='button']:hover {
  color: white;
}

.nav-link {
  color: #ef782f !important;
}

.card-header {
  color: white;
  background-color: #ef782f;
}

/* Button styles are now imported from buttons.css */
</style>
