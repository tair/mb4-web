<script setup lang="ts">
defineProps<{
  isLoaded: boolean
  errorMessage?: string
}>()
</script>

<template>
  <div v-if="errorMessage">
    <strong>{{ errorMessage }}</strong>
  </div>
  <div v-else-if="!isLoaded">
    <div class="spinner-border text-success" role="status"></div>
    Loading...
  </div>
  <div v-else>
    <slot></slot>
  </div>
</template>
