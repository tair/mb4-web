<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MembersCard from '@/components/project/MembersCard.vue'
import DeleteMemberDialog from './DeleteMemberDialog.vue'

const route = useRoute()
const projectId = route.params.id

const membersStore = useProjectUsersStore()
const isLoaded = computed(() => membersStore.isLoaded)
const memberToDelete = ref({})
onMounted(() => {
  if (!membersStore.isLoaded) {
    membersStore.fetchUsers(projectId)
    console.log(membersStore)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      There are {{ membersStore.members?.length }} members associated with this
      project.
    </header>
    <br />
    <div class="action-bar">
      <RouterLink :to="`/myprojects/${projectId}/member/add`">
        <button type="button" class="btn btn-m btn-outline-primary">
          <i class="fa fa-plus"></i>
          <span> Add New Member </span>
        </button>
      </RouterLink>
    </div>
    <MembersCard
      :members="membersStore.members"
      v-model:deleteMember="memberToDelete"
    ></MembersCard>
  </LoadingIndicator>
  <DeleteMemberDialog :member="memberToDelete" :projectId="projectId" />
</template>
