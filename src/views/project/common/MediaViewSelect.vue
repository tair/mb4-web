<script setup>
import { computed } from 'vue'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import SelectInput from '@/components/project/SelectInput.vue'

defineProps({
  name: {
    type: String,
  },
  value: {
    type: Number,
  },
})

const mediaViewsStore = useMediaViewsStore()
const options = computed(() => {
  const views = { '- NONE - ': '' }
  for (const mediaView of mediaViewsStore.mediaViews) {
    views[mediaView.name] = mediaView.view_id
  }
  return views
})
</script>
<template>
  <SelectInput :name="name" :value="value" :options="options" />
</template>
