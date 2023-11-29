<script setup lang="ts">
defineProps<{
  name: string
  value?: number
}>()
</script>
<template>
  <input :name="name" :value="value" type="number" class="form-control" />
</template>
