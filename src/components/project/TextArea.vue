<script setup lang="ts">
defineProps<{
  name: string
  value?: string,
}>()

</script>
<template>
  <textarea class="form-control" :name="name">{{ value }}</textarea>
</template>