<script setup lang="ts">
const {
  message,
  messageName,
  alertType = 'info',
} = defineProps<{
  message: { [key: string]: string }
  messageName: string
  alertType?: string
}>()

function dismissAlert() {
  message[messageName] = ''
}
</script>
<template>
  <div
    v-if="message[messageName]"
    :class="'alert alert-dismissible fade show mt-2 alert-' + alertType"
    role="alert"
  >
    <span v-html="message[messageName]"></span>
    <button
      type="button"
      class="btn-close"
      @click="dismissAlert"
      aria-label="Close"
    ></button>
  </div>
</template>
