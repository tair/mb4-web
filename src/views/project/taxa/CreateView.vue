<script setup>
import router from '@/router'
import { useRoute } from 'vue-router'
import { useTaxaStore } from '@/stores/TaxaStore'
import { schema } from '@/views/project/taxa/schema.js'

const route = useRoute()
const projectId = route.params.id

const taxaStore = useTaxaStore()

async function createTaxon(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await taxaStore.create(projectId, json)
  if (!success) {
    alert(response.data?.message || 'Failed to create taxon')
    return
  }

  router.push({ path: `/myprojects/${projectId}/taxa` })
}
</script>
<template>
  <form @submit.prevent="createTaxon">
    <div class="row setup-content">
      <template v-for="(definition, index) in schema" :key="index">
        <div v-if="!definition.existed" class="form-group">
          <label :for="index" class="form-label">
            {{ definition.label }}
          </label>
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
    </div>
  </form>
</template>
<style scoped></style>
