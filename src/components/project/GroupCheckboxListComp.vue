<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectMemberGroupsStore } from '@/stores/ProjectMemberGroupsStore'

const route = useRoute()
const projectId = route.params.id

const projectMemberGroupsStore = useProjectMemberGroupsStore()
const groups = computed(() => projectMemberGroupsStore.groups)

const props = defineProps<{
  value?: number[]
  name: string
}>()

function check(group: number) {
  return props.value.includes(group)
}
function remove(group: number) {
  const index = props.value.indexOf(group)
  if (index !== -1) {
    props.value.splice(index, 1)
  }
}
function add(group: number) {
  props.value.push(group)
}

onMounted(() => {
  if (!projectMemberGroupsStore.isLoaded) {
    projectMemberGroupsStore.fetchGroups(projectId)
  }
})
</script>
<template>
  <div v-for="group in groups" :key="group.group_id">
    <input
      class="form-check-input"
      type="checkbox"
      :name="name"
      :checked="!!check(group.group_id)"
      @click="
        !check(group.group_id) ? add(group.group_id) : remove(group.group_id)
      "
    />
    <input type="hidden" :name="name" :value="JSON.stringify(value)" />
    <label> &nbsp{{ group.group_name }}</label>
  </div>
</template>
