<template>
  <div 
    :class="[
      'notification-item',
      `notification-${notification.type}`,
      { 'notification-dismissing': isDismissing }
    ]"
    @click="dismiss"
  >
    <!-- <div class="notification-icon">
      <span v-if="notification.type === 'success'">✅</span>
      <span v-else-if="notification.type === 'error'">❌</span>
      <span v-else-if="notification.type === 'warning'">⚠️</span>
      <span v-else-if="notification.type === 'info'">ℹ️</span>
    </div> -->
    
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
  gap:14px;
  padding: 16px 18px;
  margin-bottom: 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-width: 420px;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.notification-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  opacity: 0.95;
  z-index: -1;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.16);
}

.notification-dismissing {
  transform: translateY(-16px) scale(0.96);
  opacity: 0;
}

/* Type-specific styles - Refined, professional colors */
.notification-success {
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.95) 0%, rgba(16, 185, 129, 0.9) 100%);
  color: white;
  border-left: 4px solid #10b981;
}

.notification-error {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(239, 68, 68, 0.9) 100%);
  color: white;
  border-left: 4px solid #ef4444;
  animation: slideInScale 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.notification-warning {
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.95) 0%, rgba(245, 158, 11, 0.9) 100%);
  color: white;
  border-left: 4px solid #f59e0b;
}

.notification-info {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.95) 0%, rgba(59, 130, 246, 0.9) 100%);
  color: white;
  border-left: 4px solid #3b82f6;
}

/* Refined hover effects */
.notification-success:hover {
  box-shadow: 0 12px 48px rgba(16, 185, 129, 0.2);
}

.notification-error:hover {
  box-shadow: 0 12px 48px rgba(239, 68, 68, 0.25);
}

.notification-warning:hover {
  box-shadow: 0 12px 48px rgba(245, 158, 11, 0.2);
}

.notification-info:hover {
  box-shadow: 0 12px 48px rgba(59, 130, 246, 0.2);
}

.notification-icon {
  font-size: 28px;
  flex-shrink: 0;
  margin-top: 2px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.98);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  letter-spacing: -0.01em;
}

.notification-message {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  word-wrap: break-word;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 400;
  letter-spacing: 0.01em;
}

.notification-close {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
  color: rgba(255, 255, 255, 1);
}

/* Refined entrance animation */
@keyframes slideInScale {
  0% {
    transform: translateY(-24px) scale(0.94);
    opacity: 0;
  }
  60% {
    transform: translateY(-2px) scale(1.01);
    opacity: 0.8;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.notification-item {
  animation: slideInScale 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Enhanced mobile responsiveness */
@media (max-width: 768px) {
  .notification-item {
    min-width: 320px;
    max-width: calc(100vw - 20px);
    padding: 14px 16px;
    gap: 12px;
    border-radius: 10px;
  }
  
  .notification-icon {
    font-size: 22px;
  }
  
  .notification-title {
    font-size: 14px;
  }
  
  .notification-message {
    font-size: 12px;
  }

  .notification-close {
    width: 26px;
    height: 26px;
    font-size: 14px;
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .notification-item {
    animation: none;
    transition: opacity 0.2s ease;
  }
  
  .notification-item:hover {
    transform: none;
  }
  
  .notification-dismissing {
    transform: none;
  }
}

/* Enhanced dark mode support */
@media (prefers-color-scheme: dark) {
  .notification-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(28px) saturate(200%);
  }
  
  .notification-close {
    background: rgba(255, 255, 255, 0.12);
  }
  
  .notification-close:hover {
    background: rgba(255, 255, 255, 0.22);
  }
}
</style>