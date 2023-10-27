<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { schema } from '@/views/project/views/schema.js'
import ProjectContainerComp from '@/components/project/ProjectContainerComp.vue'

const route = useRoute()
const projectId = route.params.id

const mediaViewsStore = useMediaViewsStore()

async function create(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await mediaViewsStore.create(projectId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to create media view')
  }
}
</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    :errorMessage="null"
    basePath="myprojects"
    itemName="media_views"
  >
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
  </ProjectContainerComp>
</template>
