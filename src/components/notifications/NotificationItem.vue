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
  gap: 16px;
  padding: 20px 24px;
  margin-bottom: 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.notification-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  opacity: 0.9;
  z-index: -1;
}

.notification-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.notification-dismissing {
  transform: translateY(-20px) scale(0.95);
  opacity: 0;
}

/* Type-specific styles - Modern, vibrant colors */
.notification-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
  min-width: 400px;
}

.notification-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 15px 40px rgba(239, 68, 68, 0.5);
  min-width: 500px;
  animation: errorPulse 0.6s ease-out, slideInScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.notification-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 12px 35px rgba(245, 158, 11, 0.45);
  min-width: 450px;
}

.notification-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
  min-width: 400px;
}

/* Enhanced hover effects for each type */
.notification-success:hover {
  box-shadow: 0 20px 40px rgba(16, 185, 129, 0.6);
}

.notification-error:hover {
  box-shadow: 0 25px 50px rgba(239, 68, 68, 0.7);
  animation: errorHover 0.3s ease;
}

.notification-warning:hover {
  box-shadow: 0 20px 45px rgba(245, 158, 11, 0.65);
}

.notification-info:hover {
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.6);
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
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  color: inherit;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.notification-message {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  color: inherit;
  opacity: 0.95;
  font-weight: 500;
}

.notification-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  backdrop-filter: blur(10px);
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* Error-specific animations for maximum attention */
@keyframes errorPulse {
  0% { 
    box-shadow: 0 15px 40px rgba(239, 68, 68, 0.5);
  }
  50% { 
    box-shadow: 0 15px 40px rgba(239, 68, 68, 0.8);
  }
  100% { 
    box-shadow: 0 15px 40px rgba(239, 68, 68, 0.5);
  }
}

@keyframes errorHover {
  0% { transform: translateY(-4px) scale(1.02); }
  50% { transform: translateY(-6px) scale(1.03); }
  100% { transform: translateY(-4px) scale(1.02); }
}

/* Enhanced entrance animation */
@keyframes slideInScale {
  from {
    transform: translateY(-50px) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.notification-item {
  animation: slideInScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Enhanced mobile responsiveness */
@media (max-width: 768px) {
  .notification-item {
    min-width: 280px;
    max-width: 90vw;
    padding: 16px 20px;
    gap: 14px;
  }
  
  .notification-error {
    min-width: 300px;
  }
  
  .notification-warning {
    min-width: 290px;
  }
  
  .notification-icon {
    font-size: 24px;
  }
  
  .notification-title {
    font-size: 15px;
  }
  
  .notification-message {
    font-size: 13px;
  }
}

/* Dark mode considerations */
@media (prefers-color-scheme: dark) {
  .notification-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .notification-close {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .notification-close:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}
</style>