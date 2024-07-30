<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectMemberGroupsStore } from '@/stores/ProjectMemberGroupsStore';

const route = useRoute()
const projectId = route.params.id

const projectMemberGroupsStore = useProjectMemberGroupsStore()
const groups = computed(() => projectMemberGroupsStore.groups)


type Group = {
  group_id: number
}

const props = defineProps<{
  value?: number[]
  name: string
}>()

const joinedGroups = props.value

onMounted(() => {
  if (!projectMemberGroupsStore.isLoaded) {
    projectMemberGroupsStore.fetchGroups(projectId)
  }
})
function check(group: number) {
  return joinedGroups.includes(group)
}
// as i do add and remove on joinedGroups the same changes get reflected in props.value
function remove(group: number) {
  const index = joinedGroups.indexOf(group)
  if(index!==-1) {
    joinedGroups.splice(index, 1)
  }
  console.log('in remove')
  console.log(joinedGroups)
  console.log(props.value)
}
function add(group: number) {
  joinedGroups.push(group)
  console.log('in add')
  console.log(joinedGroups)
  console.log(props.value)
}
</script>
<template>
  <div v-for="group in groups" :key="group.group_id">
    <input
      class="form-check-input"
      type="checkbox"
      :name="name"
      :checked="!!check(group.group_id)"
      @click="!check(group.group_id) ? (add(group.group_id)) : (remove(group.group_id))"
    />
    <input type="hidden" :name="name" :value="JSON.stringify(value)" />
    <label> &nbsp{{ group.group_name }}</label>
  </div>
</template>
