<script setup lang="ts">
type Group = {
  group_id: number
  group_name: string
  description: string
}

const props = defineProps<{
  groups: Group[]
  deleteGroup: Group
  projectId: string
}>()
</script>

<template>
  <ul
    v-for="group in props.groups"
    :key="group.group_id"
    class="list-group pt-3"
  >
    <li class="list-group-item">
      <div class="list-group-item-header">
        <div class="list-group-item-name">
          {{ group.group_name }}
        </div>
        <div class="list-group-item-buttons">
          <RouterLink
            :to="`/myprojects/${projectId}/members/groups/${group.group_id}/edit`"
          >
            <button type="button" class="btn btn-sm btn-secondary">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
          </RouterLink>
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            data-bs-toggle="modal"
            data-bs-target="#groupDeleteModal"
            @click="$emit('update:deleteGroup', group)"
          >
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
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
