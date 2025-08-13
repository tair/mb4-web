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
    <slot name="bar"></slot>
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
  height: 8rem;
  margin: 5px auto;
}

.card-text {
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  padding: 0.25rem 0.5rem;
}

.card-text > div {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: center;
  width: 100%;
}

.mediaCard {
  background-color: rgba(248, 249, 250);
  width: 12rem;
  height: 15rem;
  font-size: 12px;
}
</style>
