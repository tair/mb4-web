<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Tooltip from '@/components/main/Tooltip.vue'
import { toDMYDate } from '@/utils/date'
import { getViewStatsTooltipText } from '@/utils/util.js'
import { useAuthStore } from '@/stores/AuthStore'

type Views = {
  total: number
}

type Downloads = {
  M: number
  X: number
}

type Member = {
  user_id: number
  fname: string
  lname: string
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
  members?: Member[]
}

const props = defineProps<{
  overview: OverviewStats
}>()

const route = useRoute()
const projectId = route.params.id
const authStore = useAuthStore()

const viewTooltipText = getViewStatsTooltipText()

const isLoggedIn = computed(() => !!authStore.user?.userId)

const isMember = computed(() => {
  if (!authStore.user?.userId || !props.overview?.members) return false
  return props.overview.members.some((member: Member) => member.user_id === authStore.user.userId)
})

const canRequestDuplication = computed(() => isLoggedIn.value && isMember.value)
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
            {{ overview.project_views?.total || 0 }}
          </li>
          <li class="list-group-item" v-if="overview.project_downloads?.M">
            <router-link class="fw-bold" to="#project-download"
              >Media downloads
            </router-link>
            <Tooltip :content="viewTooltipText"></Tooltip>:
            {{ overview.project_downloads.M }}
          </li>
          <li class="list-group-item" v-if="overview.project_downloads?.X">
            <router-link class="fw-bold" to="#project-download"
              >Matrix downloads
            </router-link>
            <Tooltip :content="viewTooltipText"></Tooltip>:
            {{ overview.project_downloads.X }}
          </li>
          <li v-if="canRequestDuplication" class="list-group-item">
            <span class="fw-bold">
              <RouterLink :to="`/project/${projectId}/duplication/request`">
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
