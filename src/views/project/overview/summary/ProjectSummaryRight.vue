<script setup>
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import Tooltip from '@/components/main/Tooltip.vue'
import { toDMYDate } from '@/utils/date';

const projectStore = usePublicProjectDetailsStore()
const viewTooltipText = "Project download and view statistics are available since August 2012.  Views and downloads pre August 2012 are not reflected in the statistics."
</script>

<template>
  <div class="mb-3">
    <div class="card shadow">
      <div class="card-header fw-bold">
        Project {{ projectStore.project_id }}
      </div>
      <div class="card-body m-0 p-0 small">
        <ul class="list-group list-group-flush">
          <li class="list-group-item">
            <span class="fw-bold">Created on: </span
            >{{ toDMYDate(projectStore.overview.created_on) }}
          </li>
          <li class="list-group-item">
            <span class="fw-bold">Published on: </span
            >{{ toDMYDate(projectStore.overview.published_on) }}
          </li>
          <li v-if="projectStore.overview.partition_published_on" class="list-group-item">
            <span class="fw-bold">Date of Last Publication of Partition: </span
            >{{ toDMYDate(projectStore.overview.partition_published_on) }}
          </li>
          <li class="list-group-item">
            <router-link class="fw-bold" to="#project-view">Project Views </router-link><Tooltip :content="viewTooltipText"></Tooltip>: {{ projectStore.overview.project_views.total }}
          </li>
          <li class="list-group-item" v-if="projectStore.overview.project_downloads.M">
            <router-link class="fw-bold" to="#project-download">Media downloads</router-link> <Tooltip :content="viewTooltipText"></Tooltip>: {{ projectStore.overview.project_downloads.M }}
          </li>
          <li class="list-group-item" v-if="projectStore.overview.project_downloads.X">
            <router-link class="fw-bold" to="#project-download">Matrix downloads</router-link> <Tooltip :content="viewTooltipText"></Tooltip>: {{ projectStore.overview.project_downloads.X }}
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div>
    <div class="card shadow">
      <div class="card-header fw-bold">Authors' Institutions</div>
      <div class="card-body m-0 p-0 small">
        <ul class="list-group list-group-flush">
          <li
            class="list-group-item"
            :key="idx"
            v-for="(inst, idx) in projectStore.overview.institutions"
          >
            {{ projectStore.overview.institutions[idx] }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
