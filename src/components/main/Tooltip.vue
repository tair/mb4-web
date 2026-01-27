<script setup lang="ts">
interface Props {
  content: string
  displayStyle?: string
  displayContent?: string | null
}

const props = defineProps<Props>()

// If you need to assign defaults, do it here
const displayStyle = props.displayStyle || 'question'
const displayContent = props.displayContent || null
</script>

<template>
  <tippy
    :content="props.content"
    :allowHTML="true"
    v-if="displayStyle === 'question'"
  >
    <i class="fa-solid fa-circle-question theme-color"></i>
  </tippy>
  <tippy :content="props.content" :allowHTML="true" v-else>
    <div v-html="displayContent"></div>
  </tippy>
  <div class="sr-only">{{ props.content }}</div>
</template>

<style scoped>
.theme-color {
  color: var(--theme-orange);
}
</style>
