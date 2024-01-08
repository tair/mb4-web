<script setup lang="ts">
import { RouterView } from 'vue-router'
import ProjectSideNav from '@/components/project/ProjectSideNav.vue'
</script>
<template>
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
