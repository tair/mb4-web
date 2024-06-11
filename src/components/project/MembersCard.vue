<script setup lang="ts">

type Member = {
  user_id: number
  fname: string
  lname: string
  email: string
  membership_type: number
}

const props = defineProps<{
  members: Member[]
}>()

function convertRole(m: Member): String{
  switch(m.membership_type) {
    case 0:
      return "Full membership (can edit everything)"
    case 1:
      return "Character annotater (can edit everything but characters and states)"
    case 2:
      return "Bibliography maintainer (can edit bibliography only)"
    case 3:
      return "Observer (cannot edit)"
    case 4:
      return "Full membership (can edit everything)"
    default:
      return ""
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
              <div class="">
                  {{ `${member.fname} ${member.lname}` }} {{ `(${member.email})` }}
              </div>
            <div class="">
                {{ convertRole(member) }}
            </div>
            <div v-if="member.membership_type==4" class="fw-bold">
                Project Administrator
            </div>
        </li>
    </ul>
</template>

<style scoped>
</style>