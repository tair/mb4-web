<script setup lang="ts">
type Group = {
  joined: number
  group_name: string
  group_id: number
  link_id: number
}

defineProps<{
  value?: Group[]
  name: string
}>()

</script>
<template>
  <div v-for="group in value" :key="group.group_id">
    <input
      class="form-check-input"
      type="checkbox"
      :name="name"
      :checked="!!group.joined"
      @click="(group.joined==0) ? group.joined=1: group.joined=0"
    />
    <input
    type="hidden"
    :name="name"
    :value="JSON.stringify(value)"
    />
    <label> &nbsp{{ group.group_name }}</label>
  </div>
</template>