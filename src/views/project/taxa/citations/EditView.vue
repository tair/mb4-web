<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useTaxaCitationsStore } from '@/stores/TaxaCitationsStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema } from '@/views/project/taxa/citations/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import TaxonomicName from '@/components/project/TaxonomicName.vue'

const route = useRoute()
const projectId = route.params.id
const taxonId = route.params.taxonId
const citationId = route.params.citationId

const bibliographiesStore = useBibliographiesStore()
const taxaCitationStore = useTaxaCitationsStore()
const projectUsersStore = useProjectUsersStore()
const taxaStore = useTaxaStore()

const taxon = computed(() => taxaStore.getTaxonById(taxonId))
const citation = computed(() => taxaCitationStore.getCitationById(citationId))

const isLoaded = computed(
  () =>
    taxaCitationStore.isLoaded &&
    bibliographiesStore.isLoaded &&
    taxaStore.isLoaded &&
    projectUsersStore.isLoaded
)

onMounted(() => {
  if (!taxaCitationStore.isLoaded) {
    taxaCitationStore.fetchCitations(projectId, taxonId)
  }
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
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
  const success = await taxaCitationStore.edit(
    projectId,
    taxonId,
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
        <TaxonomicName :showExtinctMarker="true" :taxon="taxon" />.
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
