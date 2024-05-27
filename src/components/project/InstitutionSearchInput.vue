<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{
  search: (text: string) => Promise<any[]>
  creation: (id: number, name: string) => void
}>()

const items = ref([])
let text = ref()
let institutionId: number = null

async function handleInput(event: any) {
  const text = event.target.value
  if (text.length < 3) {
    items.value = []
  } else {
    items.value = await props.search(text)
    institutionId = null
  }
}

function handleCreation(institutionId: number, name: string) {
  // to handle a case where the user does not decide to use the dropdown select
  if (institutionId == null) {
    const institution = items.value.find((i: any) => i.name == name)
    institutionId = institution ? institution.institution_id : null
  }

  props.creation(institutionId, name)
}

function handleSelect(item: any) {
  institutionId = item.institution_id
  text.value = item.name
  items.value = []
}
</script>
<template>
  <div class="input-group">
    <input
      @input="handleInput"
      v-model="text"
      class="form-control border"
      type="search"
    />
    <button type="button" @click="handleCreation(institutionId, text)">
      Save
    </button>
    <ul v-if="items.length > 0" class="results">
      <template v-for="item in items">
        <li @mousedown="handleSelect(item)">
          <slot name="item" v-bind="item">{{ item.name }}</slot>
        </li>
      </template>
    </ul>
  </div>
</template>
<style scoped>
ul.results {
  background-color: white;
  border: solid 1px #ccc;
  left: -1px;
  list-style: none;
  max-height: 100px;
  min-height: 50px;
  overflow-x: hidden;
  overflow-y: scroll;
  padding: 10px;
  position: absolute;
  right: -1px;
  top: 36px;
}

ul.results li {
  font-size: 13px;
  margin: 0;
  padding: 5px;
}

ul.results li:hover {
  background: #eee;
  cursor: pointer;
}
</style>
