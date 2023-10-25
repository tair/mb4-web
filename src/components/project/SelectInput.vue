<script setup lang="ts">
defineProps<{
  name: string
  value?: string | number
  options: { [key: string]: string | number }
}>()
</script>
<template>
  <select class="form-control" :name="name">
    <template v-for="(option, index) in options" :key="option" class="mb-3">
      <option :value="option" :selected="value == option">{{ index }}</option>
    </template>
  </select>
</template>
