<script setup lang="ts">

type Member = {
  project_id: number
  user_id: number
  administrator: number
  fname: string
  lname: string
  member_email: string
  member_role: number
  member_name: string
}

const props = defineProps<{
  members: Member[]
}>()

function convertRole(m: Member): String{
  switch(m.member_role) {
    case 0:
      return "Full membership (can edit everything)"
    case 1:
      return "Character annotater (can edit everything but characters and states)"
    case 2:
      return "Bibliography maintainer (can edit bibliography only)"
    case 3:
      return "Observer (cannot edit)"
    default:
      return
  }
}

</script>

<template>
    <ul 
    v-for="member in props.members"
    :key="member.user_id"
    class="list-group pt-3"
    >
        <li class="list-group-item">
            <div class="list-group-item-header">
                <div class="list-group-item-name">
                    {{ member.member_name }} {{ `(${member.member_email})` }}
                </div>
                    <div class="list-group-item-buttons"> 
                        <button
                            v-if="!member.administrator"
                            type="button"
                            class="btn btn-sm btn-secondary"
                            data-bs-toggle="modal"
                            data-bs-target="#memberDeleteModal"
                            @click="$emit('update:deleteMember', member)"
                        >
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
            </div>
            <div class="list-group-item-description">
                {{ convertRole(member) }}
            </div>
            <div v-if="member.administrator" class="list-group-item-administrator">
                Project Administrator
            </div>
        </li>
    </ul>
</template>

<style scoped>
.list-group-item-header {
  display: flex;
}

.list-group-item-description {
  font-size: 95%;
  padding-top: 5px;
}

.list-group-item-adminstrator {
  padding-left: 20px;
  padding-top: 5px;
  font-weight: bold;
}

.list-group-item-name {
  display: flex;
  flex-grow: 1;
}

.list-group-item-buttons {
  display: flex;
  gap: 7px;
}
</style>