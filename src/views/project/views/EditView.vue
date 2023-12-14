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
const viewId = route.params.viewId

const projectUsersStore = useProjectUsersStore()
const mediaViewsStore = useMediaViewsStore()
const mediaView = computed(() => mediaViewsStore.getMediaViewById(viewId))

onMounted(() => {
  if (!mediaViewsStore.isLoaded) {
    mediaViewsStore.fetchMediaViews(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})

async function edit(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await mediaViewsStore.edit(projectId, viewId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to update media view')
  }
}
</script>
<template>
  <ProjectContainerComp
    :projectId="projectId"
    :isLoading="!mediaViewsStore.isLoaded || !projectUsersStore.isLoaded"
    :errorMessage="null"
    basePath="myprojects"
    itemName="media_views"
  >
    <header>
      <b>Editing: </b>
      {{ mediaView.name }}
    </header>
    <form @submit.prevent="edit">
      <div v-for="(definition, index) in schema" :key="index" class="mb-3">
        <label for="index" class="form-label">{{ definition.label }}</label>
        <component
          :key="index"
          :is="definition.view"
          :name="index"
          :value="mediaView[index]"
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
