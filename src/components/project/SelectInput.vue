<script setup lang="ts">
defineProps<{
  name: string
  value?: string | number
  options:
    | { [key: string]: string | number }
    | (() => { [key: string]: string | number })
}>()
</script>
<template>
  <select class="form-select" :name="name">
    <template
      v-for="(option, index) in typeof options == 'function'
        ? options()
        : options"
      :key="option"
      class="mb-3"
    >
      <option :value="option" :selected="value == option">{{ index }}</option>
    </template>
  </select>
</template>
