<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import router from '@/router'
import { useFoliosStore } from '@/stores/FoliosStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { schema } from '@/views/project/folios/schema.js'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = route.params.id
const folioId = parseInt(route.params.folioId)

const projectUsersStore = useProjectUsersStore()
const foliosStore = useFoliosStore()
const folio = computed(() => foliosStore.getFolioById(folioId))
const isLoaded = computed(
  () => foliosStore.isLoaded && projectUsersStore.isLoaded
)

onMounted(() => {
  if (!foliosStore.isLoaded) {
    foliosStore.fetch(projectId)
  }
  if (!projectUsersStore.isLoaded) {
    projectUsersStore.fetchUsers(projectId)
  }
})

async function edit(event) {
  const formData = new FormData(event.currentTarget)
  const json = Object.fromEntries(formData)
  const success = await foliosStore.edit(projectId, folioId, json)
  if (success) {
    router.go(-1)
  } else {
    alert('Failed to update folio')
  }
}
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <form @submit.prevent="edit">
      <div v-for="(definition, index) in schema" :key="index" class="mb-3">
        <label for="index" class="form-label">{{ definition.label }}</label>
        <component
          :key="index"
          :is="definition.view"
          :name="index"
          :value="folio[index]"
          v-bind="definition.args"
        >
        </component>
      </div>
      <div class="btn-form-group">
        <RouterLink :to="{ name: 'MyProjectFoliosView' }">
          <button class="btn btn-primary" type="button">Cancel</button>
        </RouterLink>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  </LoadingIndicator>
</template>
