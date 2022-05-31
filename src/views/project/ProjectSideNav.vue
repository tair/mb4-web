<script setup>
// import { useProjectStore } from "@/stores/storeProjectDetails.js";
import { RouterLink } from "vue-router";

// const projectStore = useProjectStore();

const props = defineProps({
  project_id: {
    type: [Number, String],
    required: true,
  },
  item: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="nav-link mb-1 d-flex fw-bold small m-0 p-0 mb-3">
    <i class="bi bi-chevron-double-left me-1"></i>
    <RouterLink class="nav-link m-0 p-0" :to="`/project`"
      >Browse projects</RouterLink
    >
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
        :to="`/project/overview/${project_id}`"
        >Project Overview</RouterLink
      >
    </li>

    <li
      :class="[
        item === 'matrices'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/project/matrices/${project_id}`"
        >Matrices</RouterLink
      >
    </li>

    <li
      :class="[
        item === 'media' ? 'list-group-item-warning' : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink class="nav-link m-0 p-0" :to="`/project/media/${project_id}`"
        >Media</RouterLink
      >
    </li>

    <li
      :class="[
        item === 'media_views'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/project/media_views/${project_id}`"
        >Views of Media</RouterLink
      >
    </li>

    <li
      :class="[
        item === 'specimens'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/project/specimens/${project_id}`"
        >Specimens</RouterLink
      >
    </li>

    <li
      :class="[
        item === 'taxa' ? 'list-group-item-warning' : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink class="nav-link m-0 p-0" :to="`/project/taxa/${project_id}`"
        >Taxa</RouterLink
      >
    </li>

    <li
      :class="[
        item === 'bibliography'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/project/bibliography/${project_id}`"
        >Bibliography</RouterLink
      >
    </li>

    <li
      :class="[
        item === 'documents'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink class="nav-link m-0 p-0" :to="`/project/docs/${project_id}`"
        >Documents</RouterLink
      >
    </li>
  </ul>
</template>
