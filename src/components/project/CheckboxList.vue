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
  <div v-for="v in value" :key="v.group_id">
    <input
      class="form-check-input"
      type="checkbox"
      :name="name"
      :checked="!!v.joined"
      @click="(v.joined==0) ? v.joined=1: v.joined=0"
      :value="JSON.stringify(value)"
    />
    <label> &nbsp{{ v.group_name }}</label>
    <p>{{ v.joined }}</p>
  </div>
</template>