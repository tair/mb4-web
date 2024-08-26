<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectMemberGroupsStore } from '@/stores/ProjectMemberGroupsStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import DeleteGroupDialog from './DeleteGroupDialog.vue'

const route = useRoute()
const projectId = route.params.id

const projectMemberGroupsStore = useProjectMemberGroupsStore()
const groups = computed(() =>
  projectMemberGroupsStore.groups.sort((a, b) => {
    const nameA = a.group_name
    if (!nameA) {
      return -1
    }

    const nameB = b.group_name
    if (!nameB) {
      return -1
    }

    const compare = nameA.localeCompare(nameB)
    if (compare) {
      return compare
    }
  })
)
const numOfGroups = computed(() => projectMemberGroupsStore.groups?.length)
const groupToDelete = ref({})

onMounted(() => {
  if (!projectMemberGroupsStore.isLoaded) {
    projectMemberGroupsStore.fetchGroups(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="projectMemberGroupsStore.isLoaded">
    <header v-if="numOfGroups == 1">
      There is {{ numOfGroups }} member group associated with this project.
    </header>
    <header v-else>
      There are {{ numOfGroups }} member groups associated with this project.
    </header>
    <br />
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/members/groups/create`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Add New Project Member Group </span>
        </button>
      </RouterLink>
    </div>
    <div v-if="numOfGroups > 0">
      <div class="item-list">
        <ul class="list-group">
          <li
            v-for="group in groups"
            :key="group.group_id"
            class="list-group-item"
          >
            <div class="list-group-item-content">
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
                  @click="groupToDelete = group"
                >
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </LoadingIndicator>
  <DeleteGroupDialog :group="groupToDelete" :projectId="projectId" />
</template>
<style scoped>
@import '@/views/project/styles.css';
</style>
