<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema } from '@/views/project/specimens/schema.js'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import SpecimenName from '@/components/project/SpecimenName.vue'

const route = useRoute()
const projectId = route.params.id
const specimenId = route.params.specimenId

const projectUsersStore = useProjectUsersStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()

const isLoaded = computed(
  () =>
    specimensStore.isLoaded && projectUsersStore.isLoaded && taxaStore.isLoaded
)

const specimen = computed(() => specimensStore.getSpecimenById(specimenId))
const taxon = computed(() => taxaStore.getTaxonById(specimen.value.taxon_id))

onMounted(() => {
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetchTaxaByProjectId(projectId)
  }
})

async function edit(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await specimensStore.edit(projectId, specimenId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to update specimen')
  }
}
</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="!isLoaded"
    :errorMessage="null"
    basePath="myprojects"
    itemName="specimens"
  >
    <header>
      <b>Editing: </b>
      <SpecimenName
        :referenceSource="specimen.reference_source"
        :institutionCode="specimen.institution_code"
        :collectionCode="specimen.collection_code"
        :catalogNumber="specimen.catalog_number"
        :taxon="taxon"
      />
    </header>
    <form @submit.prevent="edit">
      <div v-for="(definition, index) in schema" :key="index" class="mb-3">
        <label for="index" class="form-label">{{ definition.label }}</label>
        <component
          :key="index"
          :is="definition.view"
          :name="index"
          :value="specimen[index]"
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
  </ProjectContainerComp>
</template>
