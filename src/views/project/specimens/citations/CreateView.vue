<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useSpecimenCitationsStore } from '@/stores/SpecimenCitationsStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema } from '@/views/project/specimens/citations/schema.js'
import SpecimenName from '@/components/project/SpecimenName.vue'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id
const specimenId = route.params.specimenId
const citationId = route.params.citationId

const bibliographiesStore = useBibliographiesStore()
const specimenCitationsStore = useSpecimenCitationsStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()

const specimen = computed(() => specimensStore.getSpecimenById(specimenId))
const taxon = computed(() => taxaStore.getTaxonById(specimen.value.taxon_id))

const isLoaded = computed(
  () =>
    specimenCitationsStore.isLoaded &&
    bibliographiesStore.isLoaded &&
    taxaStore.isLoaded &&
    specimensStore.isLoaded
)

onMounted(() => {
  if (!specimenCitationsStore.isLoaded) {
    specimenCitationsStore.fetchCitations(projectId, specimenId)
  }
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetchTaxaByProjectId(projectId)
  }
})

async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await specimenCitationsStore.create(
    projectId,
    specimenId,
    json
  )
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to create citations')
  }
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      <b>
        Create new citation for
        <SpecimenName :specimen="specimen" :taxon="taxon" />.
      </b>
    </header>
    <form @submit.prevent="create">
      <template v-for="(definition, index) in schema" :key="index">
        <div v-if="!definition.existed" class="form-group">
          <label for="index" class="form-label">{{ definition.label }}</label>
          <component
            :key="index"
            :is="definition.view"
            :name="index"
            v-bind="definition.args"
          >
          </component>
        </div>
      </template>
      <div class="btn-form-group">
        <button class="btn btn-primary" type="button" @click="$router.go(-1)">
          Cancel
        </button>
        <button class="btn btn-primary" type="submit">Create</button>
      </div>
    </form>
  </LoadingIndicator>
</template>
