<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimenCitationsStore } from '@/stores/SpecimenCitationsStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema } from '@/views/project/specimens/citations/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import SpecimenName from '@/components/project/SpecimenName.vue'

const route = useRoute()
const projectId = route.params.id
const specimenId = route.params.specimenId
const citationId = route.params.citationId

const bibliographiesStore = useBibliographiesStore()
const specimenCitationsStore = useSpecimenCitationsStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()
const projectUsersStore = useProjectUsersStore()

const specimen = computed(() => specimensStore.getSpecimenById(specimenId))
const taxon = computed(() => taxaStore.getTaxonById(specimen.value.taxon_id))
const citation = computed(() =>
  specimenCitationsStore.getCitationById(citationId)
)

const isLoaded = computed(
  () =>
    specimenCitationsStore.isLoaded &&
    bibliographiesStore.isLoaded &&
    taxaStore.isLoaded &&
    specimensStore.isLoaded &&
    projectUsersStore.isLoaded
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
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})

async function edit(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await specimenCitationsStore.edit(
    projectId,
    specimenId,
    citationId,
    json
  )
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to update citation')
  }
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      <b>
        Editing Citation for
        <SpecimenName :specimen="specimen" :taxon="taxon" />.
      </b>
    </header>
    <form @submit.prevent="edit">
      <div v-for="(definition, index) in schema" :key="index" class="mb-3">
        <label for="index" class="form-label">{{ definition.label }}</label>
        <component
          :key="index"
          :is="definition.view"
          :name="index"
          :value="citation[index]"
          v-bind="definition.args"
        >
        </component>
      </div>
      <div class="btn-form-group">
        <button class="btn btn-primary" type="button" @click="$router.go(-1)">
          Cancel
        </button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  </LoadingIndicator>
</template>
