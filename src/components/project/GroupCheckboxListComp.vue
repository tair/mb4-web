<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectMemberGroupsStore } from '@/stores/ProjectMemberGroupsStore'

const route = useRoute()
const projectId = route.params.id

type Group = {
  group_id: number
  group_name: string
  description: string
}

const props = defineProps<{
  value?: number[]
  name: string
}>()

const projectMemberGroupsStore = useProjectMemberGroupsStore()
const groups = computed((): Group[] => projectMemberGroupsStore.groups)

const group_memberships = ref<{ [key: number]: boolean }>({})

function compare() {
  for (let group of groups.value) {
    group_memberships.value[group.group_id] = check(group.group_id)
  }
}
function check(group: number) {
  return props.value.includes(group)
}
function remove(group: number) {
  group_memberships.value[group] = false
}
function add(group: number) {
  group_memberships.value[group] = true
}

compare()
onMounted(() => {
  if (!projectMemberGroupsStore.isLoaded) {
    projectMemberGroupsStore.fetchGroups(projectId)
  }
})
watch(groups, () => {
  compare()
})
</script>
<template>
  <div v-for="group in groups" :key="group.group_id">
    <input
      class="form-check-input"
      type="checkbox"
      :name="name"
      :checked="group_memberships[group.group_id]"
      :value="group.group_id"
      @click="
        group_memberships[group.group_id]
          ? remove(group.group_id)
          : add(group.group_id)
      "
    />
    <label> &nbsp{{ group.group_name }}</label>
  </div>
</template>
