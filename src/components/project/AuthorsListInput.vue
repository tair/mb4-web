<script setup lang="ts">
import { reactive, watch } from 'vue'
import { nanoid } from 'nanoid' // or any small ID generator

type AuthorName = {
  id: string
  forename?: string
  middlename?: string
  surname?: string
}

const props = defineProps<{
  name: string
  value?: AuthorName[]
}>()

// Initialize with IDs
const authors = reactive<AuthorName[]>(
  props.value?.map((a) => ({ id: nanoid(), ...a })) || [{ id: nanoid() }]
)

watch(
  () => props.value,
  (newValue) => {
    if (newValue) {
      const newAuthors = newValue.map((a) => ({ id: nanoid(), ...a }))
      authors.splice(0, authors.length, ...newAuthors)
    }
  },
  { deep: true }
)

function addAuthor() {
  authors.push({ id: nanoid() })
}

function removeAuthor(i: number) {
  if (authors.length > 1) {
    authors.splice(i, 1)
  }
}

function clearAuthor(i: number) {
  authors[i].forename = ''
  authors[i].middlename = ''
  authors[i].surname = ''
}
</script>

<template>
  <div class="authors-container">
    <div
      v-for="(author, index) in authors"
      :key="author.id"
      class="author-input-group"
    >
      <input
        v-model="author.forename"
        :name="`${name}[${index}].forename`"
        placeholder="First name or initial"
        class="author-input"
      />
      <input
        v-model="author.middlename"
        :name="`${name}[${index}].middlename`"
        placeholder="Middle name or initial"
        class="author-input"
      />
      <input
        v-model="author.surname"
        :name="`${name}[${index}].surname`"
        placeholder="Last name"
        class="author-input"
      />
      <button
        v-if="authors.length > 1"
        type="button"
        class="btn-close"
        aria-label="Remove author"
        @click="removeAuthor(index)"
      ></button>
      <a
        v-else-if="author.forename || author.middlename || author.surname"
        href="#"
        @click.prevent="clearAuthor(index)"
        class="clear-link"
        title="Clear this author"
      >
        clear
      </a>
    </div>
    <button
      type="button"
      class="btn btn-sm btn-outline-warning add-more-btn"
      @click="addAuthor"
    >
      + Add more
    </button>
  </div>
</template>

<style scoped>
.authors-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.author-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.author-input {
  flex: 1;
  min-width: 0;
}

.add-more-btn {
  align-self: flex-start;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  color: var(--theme-orange);
  border-color: var(--theme-orange);
}

.add-more-btn:hover {
  background-color: var(--theme-orange);
  color: white;
}

.clear-link {
  color: var(--theme-orange);
  text-decoration: none;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.15s ease-in-out;
}

.clear-link:hover {
  color: white;
  background-color: var(--theme-orange);
  text-decoration: none;
}
</style>
