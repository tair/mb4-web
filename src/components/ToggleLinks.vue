<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})
const emit = defineEmits(['update:modelValue'])

const options = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'unpublished', label: 'Unpublished' },
]

function setValue(val) {
  emit('update:modelValue', val)
}
</script>
<template>
  <span class="ms-2 text-muted small" style="font-size: 0.95em">
    <template v-for="(opt, idx) in options" :key="opt.key">
      <a
        href="#"
        @click.prevent="setValue(opt.key)"
        :style="
          props.modelValue === opt.key
            ? 'font-weight:bold;text-decoration:underline;color:inherit'
            : 'color:inherit'
        "
        >{{ opt.label }}</a
      ><span v-if="idx < options.length - 1"> | </span>
    </template>
  </span>
</template>
