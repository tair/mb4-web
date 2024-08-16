<script setup lang="ts">
import { useRoute } from 'vue-router'
import Tooltip from '@/components/main/Tooltip.vue'
import { toDMYDate } from '@/utils/date'
import { getViewStatsTooltipText } from '@/utils/util.js'

type Views = {
  total: number
}

type Downloads = {
  M: number
  X: number
}

type OverviewStats = {
  created_on: number
  published_on: number
  partition_published_on: number
  nsf_funded: boolean
  project_views: Views
  project_downloads: Downloads
  journal_url: string
  institutions: string[]
}

defineProps<{
  overview: OverviewStats
}>()

const route = useRoute()
const projectId = route.params.id

const viewTooltipText = getViewStatsTooltipText()
</script>

<template>
  <div class="mb-3">
    <div class="card shadow">
      <div class="card-header fw-bold">Project {{ projectId }}</div>
      <div class="card-body m-0 p-0 small">
        <ul class="list-group list-group-flush">
          <li class="list-group-item">
            <span class="fw-bold">Created on: </span
            >{{ toDMYDate(overview.created_on) }}
          </li>
          <li class="list-group-item">
            <span class="fw-bold">Published on: </span
            >{{ toDMYDate(overview.published_on) }}
          </li>
          <li v-if="overview.partition_published_on" class="list-group-item">
            <span class="fw-bold">Date of Last Publication of Partition: </span
            >{{ toDMYDate(overview.partition_published_on) }}
          </li>
          <li class="list-group-item">
            <router-link class="fw-bold" to="#project-view"
              >Project Views </router-link
            ><Tooltip :content="viewTooltipText"></Tooltip>:
            {{ overview.project_views.total }}
          </li>
          <li class="list-group-item" v-if="overview.project_downloads.M">
            <router-link class="fw-bold" to="#project-download"
              >Media downloads
            </router-link>
            <Tooltip :content="viewTooltipText"></Tooltip>:
            {{ overview.project_downloads.M }}
          </li>
          <li class="list-group-item" v-if="overview.project_downloads.X">
            <router-link class="fw-bold" to="#project-download"
              >Matrix downloads
            </router-link>
            <Tooltip :content="viewTooltipText"></Tooltip>:
            {{ overview.project_downloads.X }}
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div v-if="overview.nsf_funded" class="text-center mb-2">
    <span class="sm-font">This research is supported by</span>
    <img src="/nsf.jpg" />
  </div>

  <div v-if="overview.institutions && overview.institutions.length > 0">
    <div class="card shadow">
      <div class="card-header fw-bold">Authors' Institutions</div>
      <div class="card-body m-0 p-0 small">
        <ul class="list-group list-group-flush">
          <li
            class="list-group-item"
            :key="idx"
            v-for="(institution, idx) in overview.institutions"
          >
            {{ institution }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style>
.sm-font {
  font-size: 80%;
}
</style>
