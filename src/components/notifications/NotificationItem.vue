<template>
  <div 
    :class="[
      'notification-item',
      `notification-${notification.type}`,
      { 'notification-dismissing': isDismissing }
    ]"
    @click="dismiss"
  >
    <div class="notification-icon">
      <span v-if="notification.type === 'success'">✅</span>
      <span v-else-if="notification.type === 'error'">❌</span>
      <span v-else-if="notification.type === 'warning'">⚠️</span>
      <span v-else-if="notification.type === 'info'">ℹ️</span>
    </div>
    
    <div class="notification-content">
      <h4 v-if="notification.title" class="notification-title">
        {{ notification.title }}
      </h4>
      <p class="notification-message">
        {{ notification.message }}
      </p>
    </div>
    
    <button 
      class="notification-close"
      @click.stop="dismiss"
      aria-label="Close notification"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  persistent?: boolean
}

const props = defineProps<{
  notification: Notification
}>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

const isDismissing = ref(false)

function dismiss() {
  isDismissing.value = true
  setTimeout(() => {
    emit('dismiss', props.notification.id)
  }, 300) // Match CSS transition duration
}

onMounted(() => {
  if (!props.notification.persistent) {
    const duration = props.notification.duration || 5000
    setTimeout(() => {
      dismiss()
    }, duration)
  }
})
</script>

<style scoped>
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  max-width: 400px;
  backdrop-filter: blur(10px);
}

.notification-item:hover {
  transform: translateX(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.notification-dismissing {
  transform: translateX(100%);
  opacity: 0;
}

/* Type-specific styles */
.notification-success {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-left: 4px solid #28a745;
  color: #155724;
}

.notification-error {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border-left: 4px solid #dc3545;
  color: #721c24;
}

.notification-warning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border-left: 4px solid #ffc107;
  color: #856404;
}

.notification-info {
  background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
  border-left: 4px solid #17a2b8;
  color: #0c5460;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.notification-message {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  word-wrap: break-word;
}

.notification-close {
  background: none;
  border: none;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.notification-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

/* Animation for new notifications */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-item {
  animation: slideIn 0.3s ease-out;
}
</style>