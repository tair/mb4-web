<template>
  <div class="card mb-4">
    <div class="card-header">
      <h5 class="card-title mb-0 text-white">
        <i :class="icon" class="me-2"></i>
        {{ title }}
      </h5>
    </div>
    <div class="card-body">
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else class="row">
        <div
          v-for="(value, key) in stats"
          :key="key"
          class="col-md-6 col-lg-4 mb-3"
        >
          <div class="stat-item">
            <div class="stat-label">{{ formatLabel(key) }}</div>
            <div class="stat-value">{{ formatValue(value) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'fa fa-chart-bar'
  },
  stats: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
})

function formatLabel(key) {
  // Convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

function formatValue(value) {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return value || '0'
}
</script>

<style scoped>
.stat-item {
  padding: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
}

.card-title {
  color: #495057;
}
</style>

