<script setup lang="ts">
import { getAuthorAndTitle, getSections, getTitle } from '@/utils/bibliography'

defineProps<{
  bibliography: any
}>()
</script>
<template>
  <span>
    <span>{{ getAuthorAndTitle(bibliography) }}</span>
    <em>{{ getTitle(bibliography) }}</em>
    <span>{{ getSections(bibliography) }}</span>
    <slot></slot>
  </span>
</template>
