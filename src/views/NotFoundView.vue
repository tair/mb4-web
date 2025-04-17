<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const errorMessage = route.query.message || 'Page not found 404'
</script>

<template>
  <div class="not-found-container">
    <h2 class="text-danger">{{ errorMessage }}</h2>
    <div class="mt-3">
      <RouterLink to="/" class="btn btn-primary">Return to Home</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  padding: 2rem;
  text-align: center;
}
</style>
