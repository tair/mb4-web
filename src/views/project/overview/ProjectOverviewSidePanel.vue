<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Tooltip from '@/components/main/Tooltip.vue'
import { toDMYDate, toDMYDateFromTimestamp } from '@/utils/date'
import { formatBytes } from '@/utils/format'
import { useProjectOverviewStore } from '@/stores/ProjectOverviewStore'
import { useNotifications } from '@/composables/useNotifications'

type ProjectStats = {
  timestamp: string
}

type OverviewStats = {
  created_on: number
  disk_usage: number
  stats: ProjectStats
  disk_usage_limit: number
  institutions: (string | { name: string })[]
  nsf_funded?: number
  published?: number
  partitioned_from?: number
  last_published_partition?: string
}

const props = defineProps<{
  overview: OverviewStats
  projectId: string | number
}>()

const route = useRoute()
const projectOverviewStore = useProjectOverviewStore()
const { showError, showSuccess, showInfo } = useNotifications()
const isRefreshing = ref(false)

// Computed properties for better display
const diskUsagePercentage = computed(() => {
  if (!props.overview?.disk_usage || !props.overview?.disk_usage_limit) return 0
  return (props.overview.disk_usage / props.overview.disk_usage_limit) * 100
})

const diskUsageClass = computed(() => {
  const percentage = diskUsagePercentage.value
  if (percentage >= 95) return 'text-danger'
  if (percentage >= 80) return 'text-warning'
  return 'text-success'
})

const projectStatus = computed(() => {
  if (props.overview?.published === 1) return 'Published'
  return 'Currently Editing'
})

// Refresh disk usage only (lightweight)
const isRefreshingDiskUsage = ref(false)
const refreshDiskUsage = async () => {
  if (isRefreshingDiskUsage.value) return
  
  isRefreshingDiskUsage.value = true
  try {
    await projectOverviewStore.refreshDiskUsage(props.projectId)
    showSuccess('Disk usage updated', 'Refresh Complete')
  } catch (error) {
    console.error('Error refreshing disk usage:', error)
    showError('Failed to refresh disk usage. Please try again.', 'Refresh Failed')
  } finally {
    isRefreshingDiskUsage.value = false
  }
}

// Refresh all statistics (full reload)
const refreshStatistics = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    showInfo('Refreshing project statistics...', 'Refresh Started')
    
    // Call the new refresh endpoint to regenerate cached stats
    const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${props.projectId}/refresh-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to refresh stats: ${response.statusText}`)
    }
    
    // After successful refresh, invalidate current data and re-fetch
    projectOverviewStore.invalidate()
    await projectOverviewStore.fetchProject(props.projectId)
    
    showSuccess('Project statistics refreshed successfully', 'Refresh Complete')
  } catch (error) {
    console.error('Error refreshing statistics:', error)
    showError('Failed to refresh project statistics. Please try again.', 'Refresh Failed')
  } finally {
    isRefreshing.value = false
  }
}
</script>
<template>
  <div class="mb-3">
    <div class="card shadow">
      <div class="card-header fw-bold">Project {{ projectId }}</div>
      <div class="card-body m-0 p-0 small">
        <ul class="list-group list-group-flush">
          <li class="list-group-item">
            <span class="fw-bold">
              {{ overview.published === 1 ? 'Currently Viewing:' : 'Currently Editing:' }}
            </span><br>
            MorphoBank Project {{ projectId }}
          </li>
          <li class="list-group-item">
            <span class="fw-bold">Creation Date: </span>
            {{ toDMYDate(overview.created_on) }}
          </li>
          <li v-if="overview.partitioned_from_project_id" class="list-group-item">
            <span class="fw-bold">Partitioned from project: </span>
            <RouterLink :to="`/myprojects/${overview.partitioned_from_project_id}`">
              P{{ overview.partitioned_from_project_id }}
            </RouterLink>
          </li>
          <li v-if="overview.published === 1 && overview.published_on" class="list-group-item">
            <span class="fw-bold">Publication Date: </span>
            {{ toDMYDate(overview.published_on) }}
          </li>
          <li v-if="overview.partition_published_on" class="list-group-item">
            <span class="fw-bold">Date of Last Publication of Partition: </span>
            {{ toDMYDate(overview.partition_published_on) }}
          </li>
          <li class="list-group-item">
            <span class="fw-bold">Project disk usage: </span>
            <span :class="diskUsageClass">{{ formatBytes(overview.disk_usage) }}</span>
            <br />
            <span>({{ formatBytes(overview.disk_usage_limit) }} max - {{ diskUsagePercentage.toFixed(1) }}% used)</span>
            <br />
            <button 
              class="btn btn-sm btn-link p-0 mt-1"
              @click="refreshDiskUsage"
              :disabled="isRefreshingDiskUsage"
            >
              <span v-if="isRefreshingDiskUsage" class="spinner-border spinner-border-sm me-1"></span>
              {{ isRefreshingDiskUsage ? 'Refreshing...' : '🔄 Refresh disk usage' }}
            </button>
          </li>
          <li class="list-group-item">
            <span class="fw-bold">Statistics generated: </span>
            {{ toDMYDateFromTimestamp(overview.stats.timestamp) }} <br />
            <button 
              class="btn btn-sm btn-link p-0"
              @click="refreshStatistics"
              :disabled="isRefreshing"
            >
              <span v-if="isRefreshing" class="spinner-border spinner-border-sm me-1"></span>
              {{ isRefreshing ? 'Refreshing...' : 'To see an immediate update click here.' }}
            </button>
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
              <Tooltip
                content="Member Groups allow you to limit the access for scoring a row to only certain members of a Project. First name the Member Groups for particular rows of taxa by clicking here. Then go to Manage Members - where you can add particular users to these Member Groups. Then in the Matrix Editor click on the name of the taxon in a given row and add it to the Member Group in question."
              ></Tooltip>
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

  <!-- Institution Information -->
  <div v-if="overview.institutions && overview.institutions.length > 0" class="mb-3">
    <div class="card shadow">
      <div class="card-header fw-bold">
        Authors' Institutions
        <Tooltip content="This list may not be comprehensive. Please contact us if corrections are needed."></Tooltip>
      </div>
      <div class="card-body m-0 p-0 small">
        <ul class="list-group list-group-flush">
          <li
            class="list-group-item"
            v-for="(institution, index) in overview.institutions"
            :key="index"
          >
            {{
              typeof institution === 'string' ? institution : institution.name
            }}
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
