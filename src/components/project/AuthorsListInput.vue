<script setup lang="ts">
type AuthorName = {
  forename?: string
  middlename?: string
  surname?: string
}

import { reactive } from 'vue'
const props = defineProps<{
  name: string
  value?: AuthorName[]
}>()

const authors: AuthorName[] = props.value || reactive([{}])
</script>
<template>
  <div v-for="(author, index) in authors" :key="index">
    <input
      type="text"
      :name="`${name}.forename`"
      :value="author.forename"
      placeholder="First name or initial"
    />
    <input
      type="text"
      :name="`${name}.middlename`"
      :value="author.middlename"
      placeholder="Middle name or initial"
    />
    <input
      type="text"
      :name="`${name}.surname`"
      :value="author.surname"
      placeholder="Last name"
    />
    <button
      type="button"
      class="btn-close"
      aria-label="Close"
      @click="() => authors.splice(index, 1)"
    ></button>
  </div>
  <button
    type="button"
    class="btn btn-xxs btn-outline-secondary"
    @click="() => authors.push({})"
  >
    Add more
  </button>
</template>
