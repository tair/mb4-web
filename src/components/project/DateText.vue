<script setup lang="ts">
import { toDateString } from '@/utils/date'
defineProps<{
  name: string
  value: number
}>()
</script>
<template>
  <div>{{ toDateString(value) }}</div>
</template>
