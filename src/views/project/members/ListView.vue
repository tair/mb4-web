<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMembersStore } from '@/stores/MembersStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MembersCard from '@/components/project/MembersComp.vue'

const route = useRoute()
const projectId = route.params.id

const membersStore = useMembersStore()
const isLoaded = computed(() => membersStore.isLoaded)

onMounted(() => {
  if (!membersStore.isLoaded) {
    membersStore.fetchMembers(projectId)
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
    <MembersCard :members="membersStore.members"></MembersCard>
  </LoadingIndicator>
</template>