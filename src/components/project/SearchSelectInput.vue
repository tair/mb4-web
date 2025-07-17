<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{
  // The name of the input field.
  name?: string

  // The ID of the item for the initial value.
  initialValue?: number

  // Whether the input field is disabled.
  disabled?: boolean

  // The search function that returns items based on the text.
  search: (text: string) => Promise<any[]>

  // A function that will get the item given its ID.
  getItem: (id: number) => any

  // Get the display text given the item.
  getText: (item: any) => string

  // Get the item's ID.
  getId: (item: any) => number
}>()

const emit = defineEmits(['select', 'updateTextboxString'])
const items = ref([])
const item = computed(() => props.getItem(props.initialValue))
const text = ref(props.getText(item.value))
const currentValue = ref(props.initialValue)
const isSearching = ref(false)

async function handleInput(event: any) {
  const text = event.target.value
  isSearching.value = true
  items.value = await props.search(text)
  emit('updateTextboxString', text)
}

function handleSearch(event: Event) {
  const element = event.target as HTMLInputElement
  if (element.value == '') {
    currentValue.value = undefined
    emit('select', null)
    return
  }
}

function handleSelect(item: any) {
  const itemId = props.getId(item)
  currentValue.value = itemId

  const itemText = props.getText(item)
  text.value = itemText

  items.value = []
  isSearching.value = false
  emit('select', item)
}

async function handleFocus(event: any) {
  // Show dropdown with initial results when focused
  if (items.value.length === 0) {
    isSearching.value = true
    items.value = await props.search('')
  }
}

function handleBlur() {
  if (items.value.length) {
    const item = props.getItem(currentValue.value)
    const itemText = props.getText(item)
    text.value = itemText
    items.value = []
    isSearching.value = false
  }
}
</script>
<template>
  <div class="input-group">
    <input
      :name="name"
      :value="currentValue"
      v-if="name"
      type="hidden"
      :disabled="disabled"
    />
    <input
      @input="handleInput"
      @search="handleSearch"
      @focus="handleFocus"
      @blur="handleBlur"
      v-model="text"
      :disabled="disabled"
      class="form-control border"
      type="search"
    />
    <ul v-if="items.length > 0" class="results">
      <template v-for="item in items">
        <li @mousedown="handleSelect(item)">
          <slot name="item" v-bind="item"></slot>
        </li>
      </template>
    </ul>
    <ul v-else-if="isSearching" class="results">
      <li class="no-results">No matching search results found</li>
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
  z-index: 100;
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

ul.results li.no-results {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 10px;
}
</style>
