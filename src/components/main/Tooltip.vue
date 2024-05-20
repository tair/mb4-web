<script setup lang="ts">
defineProps<{
  content: string
}>()
</script>
<template>
  <tippy :content="content">
    <i class="fa-solid fa-circle-question theme-color"></i>
  </tippy>
  <div class="sr-only">{{ content }}</div>
</template>
<style scoped>
.theme-color {
  color: #ef782f;
}
</style>
