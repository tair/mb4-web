import { useNotificationStore } from '@/stores/NotificationStore'

/**
 * Reusable notification composable using toast notifications
 * Provides a clean interface for showing success, error, warning, and info messages
 */
export function useNotifications() {
  const notificationStore = useNotificationStore()

  type Options = { persistent?: boolean; duration?: number }

  const showError = (message: string, title?: string, options: Options = {}) => {
    return notificationStore.showError(message, { title, ...options })
  }

  const showSuccess = (message: string, title?: string, options: Options = {}) => {
    return notificationStore.showSuccess(message, { title, ...options })
  }

  const showWarning = (title: string, message: string) => {
    return notificationStore.showWarning(message, { title })
  }

  const showInfo = (message: string, title?: string) => {
    return notificationStore.showInfo(message, { title })
  }

  // Advanced usage methods
  const showNotification = (options: {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    title?: string
    duration?: number
    persistent?: boolean
  }) => {
    return notificationStore.addNotification(options)
  }

  const removeNotification = (id: string) => {
    notificationStore.removeNotification(id)
  }

  const clearAll = () => {
    notificationStore.clearAllNotifications()
  }

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showNotification,
    removeNotification,
    clearAll
  }
}