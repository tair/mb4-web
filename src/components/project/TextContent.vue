<script setup lang="ts">
defineProps<{
  name: string
  value?: number
  getText: (value: number) => string
}>()
</script>
<template>
  <span v-html="getText(value)"></span>
</template>
