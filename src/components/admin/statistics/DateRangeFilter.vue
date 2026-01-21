<template>
  <div class="card mb-4">
    <div class="card-header">
      <h5 class="card-title mb-0 text-white">
        <i class="fa fa-calendar me-2"></i>
        Date Range Filter
      </h5>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-md-6">
          <label for="dateRangePreset" class="form-label">Quick Select</label>
          <select
            id="dateRangePreset"
            v-model="preset"
            class="form-select"
            @change="onPresetChange"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last week">Last Week</option>
            <option value="last month">Last Month</option>
            <option value="this month">This Month</option>
            <option value="this year">This Year</option>
            <option value="custom">Custom...</option>
          </select>
        </div>
        <div v-if="preset === 'custom'" class="col-md-6">
          <label for="customRange" class="form-label">Custom Range</label>
          <input
            id="customRange"
            v-model="customRange"
            type="text"
            class="form-control"
            placeholder="e.g., April 2012 or April 1 - April 30, 2012"
            @blur="onCustomRangeChange"
          />
        </div>
      </div>
      <div v-if="currentRange" class="mt-3">
        <small class="text-muted">
          Current range: <strong>{{ currentRange }}</strong>
        </small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'today'
  },
  currentRange: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const preset = ref(props.modelValue === 'custom' ? 'custom' : props.modelValue)
const customRange = ref('')

function onPresetChange() {
  if (preset.value !== 'custom') {
    emit('update:modelValue', preset.value)
    emit('change', preset.value)
  }
}

function onCustomRangeChange() {
  if (preset.value === 'custom' && customRange.value) {
    emit('update:modelValue', customRange.value)
    emit('change', customRange.value)
  }
}

watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== preset.value && newValue !== customRange.value) {
    // Check if it's a preset
    const presets = ['today', 'yesterday', 'last week', 'last month', 'this month', 'this year']
    if (presets.includes(newValue)) {
      preset.value = newValue
    } else {
      preset.value = 'custom'
      customRange.value = newValue
    }
  }
})
</script>

<style scoped>
.card-title {
  color: #495057;
}
</style>

