<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{
  initialValue?: string
  search: (text: string) => Promise<any[]>
}>()

const emit = defineEmits(['select'])
const items = ref([])
const inputValue = ref(props.initialValue)

async function handleInput(event: any) {
  const text = event.target.value
  if (text.length < 3) {
    items.value = []
    return
  }
  const results = await props.search(text)
  items.value = results.slice(0, 5)
}

function handleSearch(event: Event) {
  const element = event.target as HTMLInputElement
  if (element.value == '') {
    emit('select', null)
  }
}

function handleSelect(event: any, item: any) {
  const target = event.currentTarget as HTMLElement
  const text: string[] = []
  target.childNodes.forEach(function getText(child: HTMLElement) {
    if (child.nodeType === Node.TEXT_NODE) {
      text.push(child.nodeValue.trim())
    }
    child.childNodes.forEach(getText)
  })
  inputValue.value = text.join(' ').trim()
  items.value = []
  emit('select', item)
}
</script>
<template>
  <div class="input-group">
    <input
      class="form-control border"
      type="search"
      @input="handleInput"
      @search="handleSearch"
      v-model="inputValue"
    />
    <ul v-if="items.length > 0" class="results">
      <template v-for="item in items">
        <li @click="handleSelect($event, item)">
          <slot name="item" v-bind="item"></slot>
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
