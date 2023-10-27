import { useProjectUsersStore } from '@/stores/ProjectUsersStore'

export function getUserName(userId) {
  const projectUserStore = useProjectUsersStore()
  const user = projectUserStore.getUserById(userId)
  return `${user.fname} ${user.lname}`
}
