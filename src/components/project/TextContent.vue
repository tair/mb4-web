<script setup lang="ts">
defineProps<{
  name: string
  value?: number
  getText: (value: number) => string
}>()
</script>
<template>
  <span> {{ getText(value) }} </span>
</template>
