<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTaxaStore } from '@/stores/TaxaStore'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import TaxonomicName from '@/components/project/TaxonomicName.vue'

const route = useRoute()
const projectId = parseInt(route.params.id as string)
const taxonId = parseInt(route.params.taxonId as string)

const taxaStore = useTaxaStore()
const taxon = computed(() => taxaStore.getTaxonById(taxonId))

const isLoaded = computed(() => taxaStore.isLoaded)
onMounted(() => {
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      <b>Editing: </b>
      <TaxonomicName :showExtinctMarker="true" :taxon="taxon" />
    </header>
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <RouterLink
          :class="{
            'nav-link': true,
            active: route.name == 'MyProjectTaxaEditView',
          }"
          :to="{ name: 'MyProjectTaxaEditView' }"
          >Info</RouterLink
        >
      </li>
      <li class="nav-item">
        <RouterLink
          :class="{
            'nav-link': true,
            active: route.name == 'MyProjectTaxaCitationsView',
          }"
          :to="{ name: 'MyProjectTaxaCitationsView' }"
          >Citations</RouterLink
        >
      </li>
    </ul>
    <div class="tab-content py-2">
      <RouterView></RouterView>
    </div>
  </LoadingIndicator>
</template>
