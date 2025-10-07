<script setup lang="ts">
defineProps<{
  name: string
  value?: string | number
  accept?: string
}>()
</script>
<template>
  <input 
    :name="name" 
    :value="value" 
    :accept="accept"
    type="file" 
    class="form-control" 
  />
</template>
