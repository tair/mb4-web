<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/AuthStore.js'
const authStore = useAuthStore()

onMounted(() => {
  authStore.fetchLocalStore()
})
</script>
<template>
  <RouterView></RouterView>
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

.btn-warning,
.btn-warning:disabled {
  background-color: #ef782f;
  border: #ef782f;
  color: white;
}

.btn-warning:hover {
  background-color: #d86c13;
  color: white;
}

.btn-primary {
  background-color: #ef782f;
  border: none;
  outline: none;
}

.btn-primary:hover {
  background-color: #ef630b;
  border: none;
}

.btn-primary:hover {
  background-color: #ef630b;
}

.btn-primary:disabled {
  background-color: #f6ba95;
  cursor: not-allowed;
}

.btn-outline-primary {
  border-color: #ef630b;
  color: #ef630b;
  outline: none;
}

.btn-outline-primary:hover {
  background-color: #ef630b;
  border-color: #6c757d;
}
</style>
