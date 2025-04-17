<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="form-layout">
    <h2 class="form-heading">{{ title }}</h2>
    <div class="form-dividing-line"></div>
    <slot></slot>
  </div>
</template>

<style scoped>
.form-layout {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-heading {
  font-size: 1.5em;
  margin: 20px 0 10px;
  color: #444;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: normal;
}

.form-dividing-line {
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}
</style>
