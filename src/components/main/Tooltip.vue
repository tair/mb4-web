<template>
    <tippy :content="content">
      <i class="bi bi-question-circle-fill theme-color"></i>
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

<style>
.theme-color {
  color: #ef782f;
}
</style>