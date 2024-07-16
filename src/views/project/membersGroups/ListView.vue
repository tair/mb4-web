<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectMemberGroupsStore } from '@/stores/ProjectMemberGroupsStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MembersGroupsComp from '@/components/project/MembersGroupsComp.vue'

const route = useRoute()
const projectId = route.params.id

const projectMemberGroupsStore = useProjectMemberGroupsStore()
const isLoaded = computed(() => projectMemberGroupsStore.isLoaded)
const numOfGroups = computed(() => projectMemberGroupsStore.groups?.length)

onMounted(() => {
  if (!projectMemberGroupsStore.isLoaded) {
    projectMemberGroupsStore.fetchGroups(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header v-if="numOfGroups == 1">
      There is {{ numOfGroups }} member group associated with this project.
    </header>
    <header v-else>
      There are {{ numOfGroups }} member groups associated with this project.
    </header>
    <br />
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/member/group/add`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Add New Project Member Group </span>
        </button>
      </RouterLink>
    </div>
    <MembersGroupsComp
      :groups="projectMemberGroupsStore.groups"
    ></MembersGroupsComp>
  </LoadingIndicator>
</template>
