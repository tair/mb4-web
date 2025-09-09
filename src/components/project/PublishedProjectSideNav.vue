<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { usePublicMediaStore } from '@/stores/PublicMediaStore.js'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
const projectStore = usePublicProjectDetailsStore()
const mediaStore = usePublicMediaStore()

defineProps<{
  basePath: string
}>()

const route = useRoute()
const projectId = route.params.id as string
const item = computed(() => route.meta.itemName)

onMounted(() => {
  mediaStore.fetchMediaFiles(projectId)
  projectStore.fetchProject(projectId)
})
</script>

<template>
  <div class="nav-link d-flex align-items-center fw-bold small m-0 p-0 mb-3">
    <i class="fa-solid fa-chevron-left"></i>
    <RouterLink class="nav-link m-0 p-0 pl-1" :to="`/${basePath}`">
      <span v-if="basePath == 'project'">Browse projects</span>
      <span v-else>My projects</span>
    </RouterLink>
  </div>

  <ul class="list-group list-group-item-action list-group-flush">
    <li
      :class="[
        item === 'overview'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/${basePath}/${projectId}/overview`"
      >
        Project Overview
      </RouterLink>
    </li>

    <li
      v-if="projectStore.hasMatrices"
      :class="[
        item === 'matrices'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/${basePath}/${projectId}/matrices`"
      >
        Matrices
      </RouterLink>
    </li>

    <li
      v-if="mediaStore.hasMedia"
      :class="[
        item === 'media' || item === 'mediaDetail' ? 'list-group-item-warning' : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/${basePath}/${projectId}/media`"
        >Media</RouterLink
      >
    </li>

    <li
      v-if="projectStore.hasMediaViews"
      :class="[
        item === 'media_views'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/${basePath}/${projectId}/views`"
        >Views for Media</RouterLink
      >
    </li>

    <li
      v-if="projectStore.hasFolios"
      :class="[
        item === 'folios'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/${basePath}/${projectId}/folios`"
        >Folios</RouterLink
      >
    </li>

    <li
      v-if="projectStore.hasSpecimens"
      :class="[
        item === 'specimens'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/${basePath}/${projectId}/specimens`"
      >
        Specimens
      </RouterLink>
    </li>

    <li
      v-if="projectStore.hasTaxa"
      :class="[
        item === 'taxa' ? 'list-group-item-warning' : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/${basePath}/${projectId}/taxa`"
      >
        Taxa
      </RouterLink>
    </li>

    <li
      v-if="projectStore.hasBibliographies"
      :class="[
        item === 'bibliography'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/${basePath}/${projectId}/bibliography`"
      >
        Bibliography
      </RouterLink>
    </li>

    <li
      v-if="projectStore.hasDocuments"
      :class="[
        item === 'documents'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/${basePath}/${projectId}/documents`"
      >
        Documents
      </RouterLink>
    </li>
  </ul>
</template>
