<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useFoliosStore } from '@/stores/FoliosStore'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'

const route = useRoute()
const projectId = parseInt(route.params.id as string)
const folioId = parseInt(route.params.folioId as string)

const foliosStore = useFoliosStore()
const folio = computed(() => foliosStore.getFolioById(folioId))
const isLoaded = computed(() => foliosStore.isLoaded)

onMounted(() => {
  if (!foliosStore.isLoaded) {
    foliosStore.fetch(projectId)
  }
})
</script>
<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <header>
      <b>Editing: </b>
      {{ folio.name }}
    </header>
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <RouterLink
          :class="{
            'nav-link': true,
            active: route.name == 'MyProjectFoliosEditView',
          }"
          :to="{ name: 'MyProjectFoliosEditView' }"
          >Info</RouterLink
        >
      </li>
      <li class="nav-item">
        <RouterLink
          :class="{
            'nav-link': true,
            active: route.name == 'MyProjectFoliosMediaView',
          }"
          :to="{ name: 'MyProjectFoliosMediaView' }"
          >Media</RouterLink
        >
      </li>
    </ul>
    <div class="tab-content py-2">
      <RouterView></RouterView>
    </div>
  </LoadingIndicator>
</template>
