<script setup lang="ts">
import TaxonomicName from '@/components/project/TaxonomicName.vue'
import { TaxaColumns } from '@/utils/taxa'

const props = defineProps<{
  referenceSource: number
  institutionCode: string
  collectionCode: string
  catalogNumber: string
  taxon?: { [key: string]: string }
}>()

function tag() {
  switch (props.referenceSource) {
    case 0:
      let result = props.institutionCode
      if (props.collectionCode) {
        result += '/' + props.collectionCode
      }
      if (props.catalogNumber) {
        result += ':' + props.catalogNumber
      }
      if (result) {
        return '(' + result + ')'
      }
    case 1:
      return '(unvouchered)'
  }
  return ''
}
</script>
<template>
  <TaxonomicName v-if="taxon" :showExtinctMarker="true" :taxon="taxon">
    <span>{{ tag() }}</span>
  </TaxonomicName>
</template>
