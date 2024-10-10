<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import SpecimenName from '@/components/project/SpecimenName.vue'

const route = useRoute()
const projectId = route.params.id
const specimenId = parseInt(route.params.specimenId as string)

const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()

const isLoaded = computed(() => specimensStore.isLoaded && taxaStore.isLoaded)

const specimen = computed(() => specimensStore.getSpecimenById(specimenId))
const taxon = computed(() => taxaStore.getTaxonById(specimen.value.taxon_id))

onMounted(() => {
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      <b>Editing: </b>
      <SpecimenName :specimen="specimen" :taxon="taxon" />
    </header>
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <RouterLink
          :class="{
            'nav-link': true,
            active: route.name == 'MyProjectSpecimensEditView',
          }"
          :to="{ name: 'MyProjectSpecimensEditView' }"
          >Info</RouterLink
        >
      </li>
      <li class="nav-item">
        <RouterLink
          :class="{
            'nav-link': true,
            active: route.name == 'MyProjectSpecimenCitationsView',
          }"
          :to="{ name: 'MyProjectSpecimenCitationsView' }"
          >Citations</RouterLink
        >
      </li>
    </ul>
    <div class="tab-content py-2">
      <RouterView></RouterView>
    </div>
  </LoadingIndicator>
</template>
