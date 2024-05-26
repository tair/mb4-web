<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMembersStore } from '@/stores/MembersStore'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import MembersCard from '@/components/project/MembersCard.vue'
import DeleteDialog from '@/views/project/views/DeleteDialog.vue'

const route = useRoute()
const projectId = route.params.id

const membersStore = useMembersStore()
const isLoaded = computed(
  () =>
    membersStore.isLoaded
)

onMounted(() => {
  if (!membersStore.isLoaded) {
    membersStore.fetchMembers(projectId)
  }
})

const memberToDelete = ref({})
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
              :projectId="projectId"
              :members="membersStore.members"
              v-model:deleteMember="memberToDelete"
            >
    </MembersCard>

    
    </LoadingIndicator>
</template>