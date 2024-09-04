<script setup>
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema } from '@/views/project/taxa/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = parseInt(route.params.id)
const taxonId = parseInt(route.params.taxonId)

const projectUsersStore = useProjectUsersStore()
const taxaStore = useTaxaStore()
const isLoaded = computed(
  () => projectUsersStore.isLoaded && taxaStore.isLoaded
)
const taxon = computed(() => taxaStore.getTaxonById(taxonId))

async function editTaxon(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await taxaStore.edit(projectId, taxonId, json)
  if (!success) {
    alert(response.data?.message || 'Failed to modify taxon')
    return
  }

  router.push({ path: `/myprojects/${projectId}/taxa` })
}

onMounted(() => {
  if (!taxaStore.isLoaded) {
    taxaStore.fetch(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <form @submit.prevent="editTaxon">
      <div class="row setup-content">
        <div
          v-for="(definition, index) in schema"
          :key="index"
          class="form-group"
        >
          <label :for="index" class="form-label">
            {{ definition.label }}
          </label>
          <component
            :key="index"
            :is="definition.view"
            :name="index"
            :value="taxon[index]"
            v-bind="definition.args"
          >
          </component>
        </div>
        <div class="btn-form-group">
          <RouterLink :to="{ name: 'MyProjectTaxaView' }">
            <button class="btn btn-primary" type="button">Cancel</button>
          </RouterLink>
          <button class="btn btn-primary" type="submit">Save</button>
        </div>
      </div>
    </form>
  </LoadingIndicator>
</template>
<style scoped></style>
