<script setup lang="ts">
import TaxonomicName from '@/components/project/TaxonomicName.vue'

interface Image {
  url: string
  width: string | number
  height: string | number
}

defineProps<{
  mediaId: number
  image?: Image
  taxon?: { [key: string]: string }
  viewName?: string
}>()
</script>
<template>
  <div class="mediaCard card shadow">
    <div class="card-image">
      <img
        v-if="image"
        :src="image.url"
        :width="image.width"
        :height="image.height"
        class="loading"
      />
      <span v-else></span>
    </div>
    <div class="card-body">
      <div class="card-text">
        <div>M{{ mediaId }}</div>
        <TaxonomicName v-if="taxon" :showExtinctMarker="true" :taxon="taxon" />
        <div v-if="viewName">
          {{ viewName }}
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.loading {
  background-size: 20px;
  background-repeat: no-repeat;
  background-image: url('/images/loader.png');
  background-position: 10px 10px;
}

.card-image {
  height: 120px;
  margin: 5px auto;
  width: 120px;
}

.card-text {
  align-items: center;
  display: flex;
  flex-direction: column;
}

.mediaCard {
  background-color: rgba(248, 249, 250);
  width: 175px;
}
</style>
