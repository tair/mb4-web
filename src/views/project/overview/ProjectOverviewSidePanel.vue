<script setup lang="ts">
import { useRoute } from 'vue-router'
import Tooltip from '@/components/main/Tooltip.vue'
import { toDMYDate, toDMYDateFromTimestamp } from '@/utils/date'
import { formatBytes } from '@/utils/format'

type ProjectStats = {
  timestamp: string
}

type OverviewStats = {
  created_on: number
  disk_usage: number
  stats: ProjectStats
  disk_usage_limit: number
  institutions: string[]
}

defineProps<{
  overview: OverviewStats
}>()

const route = useRoute()
const projectId = route.params.id
</script>
<template>
  <div class="mb-3">
    <div class="card shadow">
      <div class="card-header fw-bold">Project {{ projectId }}</div>
      <div class="card-body m-0 p-0 small">
        <ul class="list-group list-group-flush">
          <li class="list-group-item">
            <span class="fw-bold">Created on: </span>
            {{ toDMYDate(overview.created_on) }}
          </li>
          <li class="list-group-item">
            <span class="fw-bold">Project disk usage: </span>
            <span>{{ formatBytes(overview.disk_usage) }}</span
            ><br />
            <span>({{ formatBytes(overview.disk_usage_limit) }} max)</span>
          </li>
          <li class="list-group-item">
            <span class="fw-bold">Statistics generated: </span>
            {{ toDMYDateFromTimestamp(overview.stats.timestamp) }} <br />
            <i>To see an immediate update click here.</i>
          </li>
          <li class="list-group-item">
            <span class="fw-bold">
              <RouterLink :to="`/myprojects/${projectId}/edit`">
                Edit project info
              </RouterLink>
            </span>
          </li>
          <li class="list-group-item">
            <span class="fw-bold">
              <RouterLink :to="`/myprojects/${projectId}/institutions`">
                Edit project institutions
              </RouterLink>
            </span>
          </li>
          <li class="list-group-item">
            <span class="fw-bold">
              <RouterLink :to="`/myprojects/${projectId}/publish`">
                Publish project
              </RouterLink>
            </span>
          </li>
          <li class="list-group-item">
            <span class="fw-bold">
              <RouterLink :to="`/myprojects/${projectId}/publish/partition`">
                Publish a partition
              </RouterLink>
            </span>
          </li>
          <li class="list-group-item">
            <span class="fw-bold">
              <RouterLink :to="`/myprojects/${projectId}/members`">
                Manage members
              </RouterLink>
            </span>
          </li>
          <li class="list-group-item">
            <span class="fw-bold">
              <RouterLink :to="`/myprojects/${projectId}/members/groups`">
                Manage members groups
              </RouterLink>
            </span>
          </li>
          <li class="list-group-item">
            <span class="fw-bold">
              <RouterLink :to="`/myprojects/${projectId}/duplication/request`">
                Request Project Duplication
              </RouterLink>
              <Tooltip
                content="Investigators can request that a published or an unpublished project be duplicated for reuse. While MorphoBank aims to meet the needs of all users, storage is finite and some projects with media are quite large. We, therefore, ask that researchers consider best practices prior to submitting a request for duplication.<br/><br/>When users edit various parts of the duplicate project the changes do not have any effect on the master project. Users will be contacted by MorphoBank once the duplication request has been fulfilled."
              ></Tooltip>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div v-if="overview.institutions && overview.institutions.length > 0">
    <div class="card shadow">
      <div class="card-header fw-bold">Authors' Institutions</div>
      <div class="card-body m-0 p-0 small">
        <ul class="list-group list-group-flush">
          <li
            class="list-group-item"
            v-for="(institution, index) in overview.institutions"
            :key="index"
          >
            {{ institution.name }}
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
