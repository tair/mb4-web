<script setup>
import { useRoute } from 'vue-router'
import router from '@/router'
import { useFoliosStore } from '@/stores/FoliosStore'
import { schema } from '@/views/project/folios/schema.js'

const route = useRoute()
const projectId = parseInt(route.params.id)

const foliosStore = useFoliosStore()

async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await foliosStore.create(projectId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to create folio')
  }
}
</script>
<template>
  <header>
    <b>Create new</b>
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
</template>
