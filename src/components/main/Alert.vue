<template>
    <div v-if="message[messageName]" :class="'alert alert-dismissible fade show margin-top-s alert-' + alertType" role="alert">
      {{ message[messageName] }}
      <button type="button" class="btn-close" @click="dissmissAlert" aria-label="Close"></button>
    </div>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  alertType: {
    type: String,
  },
  message: {
    type: Object,
  },
  messageName: {
    type: String,
  }
})

const dissmissAlert = function() {
  props.message[props.messageName] = ''
}
</script>

<style>
.margin-top-s {
  margin-top: 10px;
}
</style>