<script setup lang="ts">
import TaxonomicName from '@/components/project/TaxonomicName.vue'
import { getReference } from '@/utils/specimens'
defineProps<{
  specimen?: { [key: string]: string }
  taxon?: { [key: string]: string }
}>()
</script>
<template>
  <TaxonomicName v-if="taxon" :showExtinctMarker="true" :taxon="taxon">
    <span>{{ getReference(specimen) }}</span>
  </TaxonomicName>
  <span v-else>
    {{ getReference(specimen) }}
  </span>
</template>
