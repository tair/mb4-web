<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MembersComp from '@/components/project/MembersComp.vue'
import DeleteUserDialog from '@/views/project/members/DeleteUserDialog.vue'

const route = useRoute()
const projectId = route.params.id

const projectUsersStore = useProjectUsersStore()
const isLoaded = computed(() => projectUsersStore.isLoaded)
const numOfUsers =  computed(() => projectUsersStore.users?.length)
const userToDelete = ref({})

onMounted(() => {
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header v-if="numOfUsers==1">
      There is {{ numOfUsers }} member associated with
      this project.
    </header>
    <header v-else>
      There are {{ numOfUsers }} members associated with
      this project.
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
    <MembersComp
      :users="projectUsersStore.users"
      v-model:deleteUser="userToDelete"
    ></MembersComp>
  </LoadingIndicator>
  <DeleteUserDialog :user="userToDelete" :projectId="projectId" />
</template>
