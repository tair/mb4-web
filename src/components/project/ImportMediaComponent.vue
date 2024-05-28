<script setup lang="ts">
import TaxonomicName from '@/components/project/TaxonomicName.vue'

defineProps<{
  taxon: any
  importText: string
  results: any[]
}>()
</script>
<template>
  <div>
    <TaxonomicName :showExtinctMarker="true" :taxon="taxon" />
    <a>visit taxon page on {{ importText }}</a>
    <div v-for="result in results">
      <span>Select for import</span>
      <span>Use iamge as taxon exemplar</span>
      <span>Media Image</span>
      <span>Media Rights Holder</span>
    </div>
  </div>
</template>
<style scoped>
</style>