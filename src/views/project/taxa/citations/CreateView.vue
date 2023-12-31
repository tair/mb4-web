<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useTaxaCitationsStore } from '@/stores/TaxaCitationsStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema } from '@/views/project/taxa/citations/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import TaxonomicName from '@/components/project/TaxonomicName.vue'

const route = useRoute()
const projectId = route.params.id
const taxonId = route.params.taxonId

const bibliographiesStore = useBibliographiesStore()
const taxaCitationStore = useTaxaCitationsStore()
const taxaStore = useTaxaStore()

const taxon = computed(() => taxaStore.getTaxonById(taxonId))

const isLoaded = computed(
  () =>
    taxaCitationStore.isLoaded &&
    bibliographiesStore.isLoaded &&
    taxaStore.isLoaded
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
})

async function create(event) {
  const target = event.currentTarget
  const formData = new FormData(target)
  const json = Object.fromEntries(formData)
  const success = await taxaCitationStore.create(projectId, taxonId, json)
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
        <TaxonomicName :showExtinctMarker="true" :taxon="taxon" />.
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
