<script setup>
import { useRoute } from 'vue-router'
import router from '@/router'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { schema } from '@/views/project/specimens/schema.js'

const route = useRoute()
const projectId = route.params.id
const specimensStore = useSpecimensStore()

async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await specimensStore.create(projectId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to create specimen')
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
