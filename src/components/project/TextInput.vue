<script setup lang="ts">
defineProps<{
  name: string,
  value?: string | number,
}>()

</script>
<template>
  <input :name="name" :value="value" class="form-control" />
</template>
