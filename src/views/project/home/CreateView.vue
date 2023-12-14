<script setup>
import router from '@/router'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { schema } from './schema.js'

const projectsStore = useProjectsStore()

async function createProject(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const project = await projectsStore.create(json)
  if (!success) {
    alert(response.data?.message || 'Failed to create project')
    return
  }

  router.push({ path: `/myprojects/${project.project_id}` })
}
</script>
<template>
  <div>
    <form @submit.prevent="createProject">
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
  </div>
</template>
<style scoped></style>
