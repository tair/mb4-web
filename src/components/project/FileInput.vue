<script setup lang="ts">
defineProps<{
  name: string
  value?: string | number
}>()
</script>
<template>
  <input :name="name" :value="value" type="file" class="form-control" />
</template>
