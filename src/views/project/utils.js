import { useProjectUsersStore } from '@/stores/ProjectUsersStore'

export function getUserName(userId) {
  const projectUserStore = useProjectUsersStore()
  const user = projectUserStore.getUserById(userId)
  if (user) {
    return ` ${user.fname} ${user.lname} (${user.email})`
  }
  return ' Unknown User'
}
