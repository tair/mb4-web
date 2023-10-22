<script setup lang="ts">
defineProps<{
  name: string,
  authors?: {[key: string]: string}[],
}>()

</script>
<template>
  <template v-if="authors">
    <div v-for="author in authors">
      <input type="text" name="forename" v-model="author.forename" />
      <input type="text" name="middlename" v-model="author.middlename" />
      <input type="text" name="surname" v-model="author.surname" />
      <span>Remove</span>
    </div>
  </template>
  <div v-else>
    <input type="text" name="forename" />
    <input type="text" name="middlename" />
    <input type="text" name="surname" />
  </div>
</template>
