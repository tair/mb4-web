<script setup>
const props = defineProps({
  matrix: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="card shadow">
    <span>{{ matrix.title }}</span>
  </div>
</template>
