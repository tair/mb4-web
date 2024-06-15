<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{
  // The name of the input field.
  name?: string

  // The ID of the item for the initial value.
  initialValue?: number

  // The search function that returns items based on the text.
  search: (text: string) => Promise<any[]>

  // A function that will get the item given its ID.
  getItem: (id: number) => any

  // Get the display text given the item.
  getText: (item: any) => string

  // Get the item's ID.
  getId: (item: any) => number
}>()

const emit = defineEmits(['select'])
const items = ref([])
const item = computed(() => props.getItem(props.initialValue))
const text = ref(props.getText(item.value))
const currentValue = ref(props.initialValue)

async function handleInput(event: any) {
  const text = event.target.value
  if (text.length < 3) {
    items.value = []
  } else {
    items.value = await props.search(text)
  }
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
  emit('select', item)
}

function handleBlur() {
  if (items.value.length) {
    const item = props.getItem(currentValue.value)
    const itemText = props.getText(item)
    text.value = itemText
    items.value = []
  }
}
</script>
<template>
  <div class="input-group">
    <input :name="name" :value="currentValue" v-if="name" type="hidden" />
    <input
      @input="handleInput"
      @search="handleSearch"
      @blur="handleBlur"
      v-model="text"
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
</style>
