<template>
  <tippy :content="content">
    <i class="fa-solid fa-circle-question theme-color"></i>
  </tippy>
  <div class="sr-only">{{ content }}</div>
</template>

<script setup>
const props = defineProps({
  content: {
    type: String,
    default: 'tooltip',
  },
})
</script>

<style scoped>
.theme-color {
  color: #ef782f;
}
</style>
