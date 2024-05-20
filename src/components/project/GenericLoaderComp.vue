<script setup>
const props = defineProps({
  isLoading: Boolean,
  errorMessage: String,
})
</script>

<template>
  <div class="py-5" v-if="isLoading">
    <div class="spinner-border text-success" role="status"></div>
    Loading...
  </div>
  <div v-else-if="!errorMessage">
    <slot />
  </div>
  <div v-else>
    <strong>{{ errorMessage }}</strong>
  </div>
</template>
