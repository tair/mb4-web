<template>
  <Teleport to="body">
    <div 
      v-if="notifications.length > 0" 
      class="notification-container"
    >
      <NotificationItem
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
        @dismiss="removeNotification"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import NotificationItem from './NotificationItem.vue'
import { useNotificationStore } from '@/stores/NotificationStore'

const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)

function removeNotification(id: string) {
  notificationStore.removeNotification(id)
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.notification-container > * {
  pointer-events: auto;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
}
</style>