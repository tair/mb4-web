<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectMemberGroupsStore } from '@/stores/ProjectMemberGroupsStore'

const route = useRoute()
const projectId = route.params.id

const projectMemberGroupsStore = useProjectMemberGroupsStore()

defineProps<{
  value?: number[]
  name: string
}>()

onMounted(() => {
  if (!projectMemberGroupsStore.isLoaded) {
    projectMemberGroupsStore.fetchGroups(projectId)
  }
})
</script>
<template>
  <div v-for="group in projectMemberGroupsStore.groups" :key="group.group_id">
    <input
      class="form-check-input"
      type="checkbox"
      :name="name"
      :checked="value?.includes(group.group_id)"
      :value="group.group_id"
    />
    <label> {{ group.group_name }}</label>
  </div>
</template>
