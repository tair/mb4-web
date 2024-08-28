<script setup>
import { toDateString } from '@/utils/date'
import { getViewStatsTooltipText } from '@/utils/util.js'
import Tooltip from '@/components/main/Tooltip.vue'

const props = defineProps({
  specimen_detail: {
    type: Object,
  },
})

const viewStatsTooltipText = getViewStatsTooltipText()
function getHitsMessage(specimenObj) {
  let message = ''
  if (specimenObj.hits) {
    message =
      ' This specimen record has been viewed ' +
      specimenObj.hits +
      ' time' +
      (specimenObj.hits == 1 ? '' : 's')
  }
  return message
}
</script>

<template>
  <div class="row p-2" v-if="specimen_detail != null">
    <div class="col">
      <div>
        <strong>Specimen reference source</strong>
        <p>{{ specimen_detail.reference_source }}</p>
      </div>
      <div v-if="specimen_detail.taxon_name">
        <strong>Taxonomic name</strong>
        <p v-html="specimen_detail.taxon_name"></p>
      </div>
      <div v-if="specimen_detail.institution_code">
        <strong>Institution code for specimens repository</strong>
        <p>{{ specimen_detail.institution_code }}</p>
      </div>
      <div v-if="specimen_detail.collection_code">
        <strong>Collection code for specimens repository</strong>
        <p>{{ specimen_detail.collection_code }}</p>
      </div>
      <div v-if="specimen_detail.catalog_number">
        <strong>Repository catalog number</strong>
        <p>{{ specimen_detail.catalog_number }}</p>
      </div>
      <div v-if="specimen_detail.references">
        <strong>{{
          specimen_detail.references.length > 1
            ? 'Bibliographic References'
            : 'Bibliographic Reference'
        }}</strong>
        <p v-html="specimen_detail.references.join('<br/><br/>')"></p>
      </div>
      <div v-if="specimen_detail.specimen_notes">
        <strong>Specimen notes</strong>
        <p v-html="specimen_detail.specimen_notes"></p>
      </div>

      <div v-if="specimen_detail.user_name">
        <strong>Specimen created by</strong>
        <p>{{ specimen_detail.user_name }}</p>
      </div>
      <div v-if="specimen_detail.created_on">
        <strong>Media loaded on</strong>
        <p>{{ toDateString(specimen_detail.created_on) }}</p>
      </div>
      <div class="mb-4" v-if="getHitsMessage(specimen_detail)">
        {{ getHitsMessage(specimen_detail) }}
        <Tooltip :content="viewStatsTooltipText"></Tooltip>
      </div>
    </div>
  </div>
</template>
