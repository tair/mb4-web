<script setup>
import { RouterLink } from "vue-router";

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
    <RouterLink class="nav-link m-0 p-0" :to="`/project`">
      Browse projects
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
        :to="`/project/${project_id}/overview`"
      >
        Project Overview
      </RouterLink>
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
        :to="`/project/${project_id}/matrices`"
      >
        Matrices
      </RouterLink>
    </li>

    <li
      :class="[
        item === 'media' ? 'list-group-item-warning' : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink class="nav-link m-0 p-0" :to="`/project/${project_id}/media`"
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
      <RouterLink class="nav-link m-0 p-0" :to="`/project/${project_id}/views`"
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
        :to="`/project/${project_id}/specimens`"
      >
        Specimens
      </RouterLink>
    </li>

    <li
      :class="[
        item === 'taxa' ? 'list-group-item-warning' : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink class="nav-link m-0 p-0" :to="`/project/${project_id}/taxa`">
        Taxa
      </RouterLink>
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
        :to="`/project/${project_id}/bibliography`"
      >
        Bibliography
      </RouterLink>
    </li>

    <li
      :class="[
        item === 'documents'
          ? 'list-group-item-warning'
          : 'list-group-item-action',
        'list-group-item',
      ]"
    >
      <RouterLink
        class="nav-link m-0 p-0"
        :to="`/project/${project_id}/documents`"
      >
        Documents
      </RouterLink>
    </li>
  </ul>
</template>
