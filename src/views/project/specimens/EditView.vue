<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema } from '@/views/project/specimens/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import Tooltip from '@/components/main/Tooltip.vue'
import {
  getSpecimenTypeTooltipText,
  getTaxonTooltipText,
} from '@/utils/util.js'

const route = useRoute()
const projectId = parseInt(route.params.id)
const specimenId = parseInt(route.params.specimenId)

const projectUsersStore = useProjectUsersStore()
const specimensStore = useSpecimensStore()
const taxaStore = useTaxaStore()

const isLoaded = computed(
  () =>
    specimensStore.isLoaded && projectUsersStore.isLoaded && taxaStore.isLoaded
)

const specimen = computed(() => specimensStore.getSpecimenById(specimenId))

onMounted(() => {
  if (!specimensStore.isLoaded) {
    specimensStore.fetchSpecimens(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
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
  <LoadingIndicator :isLoaded="isLoaded">
    <form @submit.prevent="edit">
      <div v-for="(definition, index) in schema" :key="index" class="mb-3">
        <label for="index" class="form-label">
          {{ definition.label }}
          <Tooltip
            v-if="index === 'reference_source'"
            :content="getSpecimenTypeTooltipText()"
          ></Tooltip>
          <Tooltip
            v-if="index === 'taxon_id'"
            :content="getTaxonTooltipText()"
          ></Tooltip>
          <RouterLink
            v-if="index === 'taxon_id'"
            :to="{ name: 'MyProjectTaxaCreateView', params: { id: projectId } }"
            target="_blank"
            class="ms-2"
          >
            Add new taxon
          </RouterLink>
        </label>
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
        <RouterLink :to="{ name: 'MyProjectSpecimensListView' }">
          <button class="btn btn-outline-primary" type="button">Cancel</button>
        </RouterLink>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  </LoadingIndicator>
</template>
