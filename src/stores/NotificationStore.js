import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: []
  }),

  actions: {
    addNotification(notification) {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const newNotification = {
        id,
        type: 'info',
        duration: 5000,
        persistent: false,
        ...notification
      }

      this.notifications.push(newNotification)

      // Auto-remove non-persistent notifications
      if (!newNotification.persistent) {
        setTimeout(() => {
          this.removeNotification(id)
        }, newNotification.duration)
      }

      return id
    },

    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },

    clearAllNotifications() {
      this.notifications = []
    },

    // Helper methods for different notification types
    showSuccess(message, options = {}) {
      return this.addNotification({
        type: 'success',
        message,
        ...options
      })
    },

    showError(message, options = {}) {
      return this.addNotification({
        type: 'error',
        message,
        duration: 7000, // Errors stay longer
        ...options
      })
    },

    showWarning(message, options = {}) {
      return this.addNotification({
        type: 'warning',
        message,
        duration: 6000,
        ...options
      })
    },

    showInfo(message, options = {}) {
      return this.addNotification({
        type: 'info',
        message,
        ...options
      })
    }
  }
})