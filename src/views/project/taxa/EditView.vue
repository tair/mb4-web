<script setup>
import router from '@/router'
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'
import { schema } from './schema.js'

const route = useRoute()
const projectId = route.params.id
const taxonId = route.params.taxonId

const projectUsersStore = useProjectUsersStore()
const taxaStore = useTaxaStore()
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
    taxaStore.fetchTaxaByProjectId(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})
</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="!taxaStore.isLoaded || !projectUsersStore.isLoaded"
    basePath="myprojects"
    itemName="taxa"
  >
    <div>
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
            <button
              class="btn btn-primary"
              type="button"
              @click="$router.go(-1)"
            >
              Cancel
            </button>
            <button class="btn btn-primary" type="submit">Save</button>
          </div>
        </div>
      </form>
    </div>
  </ProjectContainerComp>
</template>
<style scoped></style>
