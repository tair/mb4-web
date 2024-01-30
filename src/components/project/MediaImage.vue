<script setup lang="ts">
interface Image {
  url: string
  width: string | number
  height: string | number
}

defineProps<{
  image?: Image
}>()
</script>
<template>
  <div
    :style="{
      width: image.width + 'px',
      height: image.height + 'px',
    }"
  >
    <img
      v-if="image"
      :src="image.url"
      :width="image.width"
      :height="image.height"
      class="loading"
    />
  </div>
</template>
<style scoped>
.loading {
  background-size: 20px;
  background-repeat: no-repeat;
  background-image: url('/images/loader.png');
  background-position: 10px 10px;
}
</style>
