<script setup>
const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
  members: {
    type: Object,
    required: true,
  },
})
</script>

<template>
    <ul 
    v-for="member in members"
    :key="member.id"
    class="list-group"
    >
        <li class="list-group-item">
            <div class="list-group-item-header">
                <div class="list-group-item-name">
                    {{ member.first }} {{ member.last }} {{ `(${member.email})` }}
                </div>
                    <div class="list-group-item-buttons"> 
                       <!-- <RouterLink
                        :to="`/myprojects/${projectId}/members/${memberId}/edit`"
                    >
                        <button type="button" class="btn btn-sm btn-secondary">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                    </RouterLink>not implemented yet-->
                        <button
                            v-if="!member.adminstrator"
                            type="button"
                            class="btn btn-sm btn-secondary"
                            data-bs-toggle="modal"
                            data-bs-target="#memberDeleteModal"
                            @click="$emit('update:member', member)"
                        >
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
            </div>
            <div class="list-group-item-description">
                {{ member.membershipType }}
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
  padding-left: 20px;
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