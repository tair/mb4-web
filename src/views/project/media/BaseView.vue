<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
const mediaId = parseInt(route.params.mediaId as string)
</script>
<template>
  <header>
    <b>Editing: </b>
    M{{ mediaId }}
  </header>
  <ul class="nav nav-tabs">
    <li class="nav-item">
      <RouterLink
        :class="{
          'nav-link': true,
          active: route.name == 'MyProjectMediaEditView',
        }"
        :to="{ name: 'MyProjectMediaEditView' }"
      >
        Info
      </RouterLink>
    </li>
    <li class="nav-item">
      <RouterLink
        :class="{
          'nav-link': true,
          active: route.name == 'MyProjectMediaCitationsView',
        }"
        :to="{ name: 'MyProjectMediaCitationsView' }"
      >
        Citations
      </RouterLink>
    </li>
  </ul>
  <div class="tab-content py-2">
    <RouterView></RouterView>
  </div>
</template>
