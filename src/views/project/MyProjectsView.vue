<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import ProjectSideNav from '@/components/project/ProjectSideNav.vue'

const route = useRoute()
const projectId = route.params.id as string
const breadcrumbs = computed(() => {
  const list = route.meta.breadcrumbs as any
  return list
})
</script>
<template>
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li class="breadcrumb-item">
        <RouterLink to="/myprojects">My Projects</RouterLink>
      </li>
      <li class="breadcrumb-item">
        <RouterLink :to="`/myprojects/${projectId}/overview`">
          P{{ projectId }}
        </RouterLink>
      </li>
      <li
        v-for="(crumb, index) in breadcrumbs"
        :key="index"
        class="breadcrumb-item"
      >
        <RouterLink :to="{ name: crumb.to }">{{ crumb.label }}</RouterLink>
      </li>
    </ol>
  </nav>
  <div class="row">
    <div class="col-2 border-end">
      <ProjectSideNav basePath="myprojects"></ProjectSideNav>
    </div>
    <div class="col-10">
      <RouterView></RouterView>
    </div>
  </div>
  <RouterView class="row" name="ContentFooter"></RouterView>
</template>
