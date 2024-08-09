<script setup lang="ts">
type User = {
  user_id: number
  link_id: number
  admin: boolean
  fname: string
  lname: string
  email: string
  membership_type: number
}
defineProps<{
  users: User[]
  deleteUser: User
  projectId: string
}>()
</script>
<template>
  <ul v-for="user in users" :key="user.user_id" class="list-group pt-3">
    <li class="list-group-item">
      <div class="list-group-item-header">
        <div class="list-group-item-name">
          {{ `${user.fname} ${user.lname}` }} {{ `(${user.email})` }}
        </div>
        <div class="list-group-item-buttons">
          <RouterLink
            :to="`/myprojects/${projectId}/members/${user.link_id}/edit`"
          >
            <button type="button" class="btn btn-sm btn-secondary">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
          </RouterLink>
          <button
            v-if="!user.admin"
            type="button"
            class="btn btn-sm btn-secondary"
            data-bs-toggle="modal"
            data-bs-target="#userDeleteModal"
            @click="$emit('update:deleteUser', user)"
          >
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
      <div>
        {{ 
          user.membership_type == 0 ? 'Full membership (can edit everything)':
          user.membership_type == 1 ? 'Observer (cannot edit)':
          user.membership_type == 2 ? 'Character annotater (can edit everything but characters and states)':
          user.membership_type == 3 ? 'Bibliography maintainer (can edit bibliography only)': ''
         }}
      </div>
      <div v-if="user.admin" class="fw-bold">Project Administrator</div>
    </li>
  </ul>
</template>
<style scoped>
.list-group-item-header {
  display: flex;
}
.list-group-item-buttons {
  display: flex;
  gap: 7px;
}
.list-group-item-name {
  display: flex;
  flex-grow: 1;
}
</style>
