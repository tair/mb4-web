<template>
  <div class="card mb-4">
    <div class="card-header">
      <h5 class="card-title mb-0 text-white">
        <i class="fa fa-chart-line me-2"></i>
        {{ title }}
      </h5>
    </div>
    <div class="card-body">
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else-if="!chartData || chartData.length === 0" class="text-center py-4 text-muted">
        No data available
      </div>
      <div v-else class="chart-container">
        <canvas ref="chartCanvas"></canvas>
      </div>
      <div v-if="showSummary && chartData && chartData.length > 0" class="chart-summary mt-3">
        <div class="row text-center">
          <div class="col-6">
            <div class="summary-label">Total</div>
            <div class="summary-value">{{ total }}</div>
          </div>
          <div class="col-6">
            <div class="summary-label">Average</div>
            <div class="summary-value">{{ average }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  },
  chartType: {
    type: String,
    default: 'bar',
    validator: (value) => ['bar', 'line'].includes(value)
  },
  showSummary: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#4F46E5'
  }
})

const chartCanvas = ref(null)
let chartInstance = null

const total = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  return props.data.reduce((sum, item) => sum + (item.value || 0), 0)
})

const average = computed(() => {
  if (!props.data || props.data.length === 0) return 0
  return Math.round(total.value / props.data.length)
})

const chartData = computed(() => {
  return props.data || []
})

function initChart() {
  if (!chartCanvas.value || chartData.value.length === 0) return
  
  // Simple canvas-based chart rendering
  // For production, consider using Chart.js or similar library
  const ctx = chartCanvas.value.getContext('2d')
  const canvas = chartCanvas.value
  const width = canvas.width = canvas.offsetWidth
  const height = canvas.height = 300
  
  ctx.clearRect(0, 0, width, height)
  
  if (chartData.value.length === 0) return
  
  const maxValue = Math.max(...chartData.value.map(d => d.value || 0))
  const barWidth = width / chartData.value.length - 10
  const padding = 40
  
  // Draw bars or lines
  chartData.value.forEach((item, index) => {
    const x = (index * width) / chartData.value.length + padding
    const barHeight = ((item.value || 0) / maxValue) * (height - padding * 2)
    const y = height - padding - barHeight
    
    ctx.fillStyle = props.color
    if (props.chartType === 'bar') {
      ctx.fillRect(x, y, barWidth, barHeight)
    } else {
      // Line chart - draw points and connect
      ctx.beginPath()
      ctx.arc(x + barWidth / 2, y, 4, 0, 2 * Math.PI)
      ctx.fill()
      
      if (index > 0) {
        const prevX = ((index - 1) * width) / chartData.value.length + padding
        const prevBarHeight = ((chartData.value[index - 1].value || 0) / maxValue) * (height - padding * 2)
        const prevY = height - padding - prevBarHeight
        ctx.beginPath()
        ctx.moveTo(prevX + barWidth / 2, prevY)
        ctx.lineTo(x + barWidth / 2, y)
        ctx.strokeStyle = props.color
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
    
    // Draw label
    ctx.fillStyle = '#666'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(item.x || '', x + barWidth / 2, height - 10)
  })
}

watch([chartData, chartType], () => {
  if (chartInstance) {
    initChart()
  }
})

onMounted(() => {
  initChart()
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance = null
  }
})
</script>

<style scoped>
.chart-container {
  height: 300px;
  position: relative;
}

.chart-summary {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
}

.card-title {
  color: #495057;
}
</style>

