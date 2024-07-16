<script setup lang="ts">
type Group = {
  group_id: number
  group_name: string
  description: string
}

const props = defineProps<{
  groups: Group[]
}>()

</script>

<template>
  <ul v-for="group in props.groups" :key="group.group_id" class="list-group pt-3">
    <li class="list-group-item">
      <div class="list-group-item-header">
        <div class="list-group-item-name">
          {{ group.group_name }}
        </div>
        <div class="list-group-item-buttons">
        </div>
      </div>
      <div>
        {{ group.description }}
      </div>
    </li>
  </ul>
</template>
<style scoped>
.list-group-item-header {
  display: flex;
}
.list-group-item-name {
  display: flex;
  flex-grow: 1;
}
</style>