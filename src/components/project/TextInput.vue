<script setup lang="ts">
defineProps<{
  name: string
  value?: string | number
}>()
</script>
<template>
  <input :name="name" :value="value" type="text" class="form-control" />
</template>
