<script setup lang="ts">
defineProps<{
  name: string
  value?: number | boolean
}>()
</script>
<template>
  <input
    class="form-check-input"
    type="checkbox"
    :name="name"
    :checked="!!value"
    value="1"
  />
</template>
