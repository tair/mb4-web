<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Tooltip from '@/components/main/Tooltip.vue'
import ConfirmModal from '@/components/media/ConfirmModal.vue'
import { toDMYDate } from '@/utils/date'
import { getViewStatsTooltipText } from '@/utils/util.js'
import { useAuthStore } from '@/stores/AuthStore'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import { apiService } from '@/services/apiService.js'

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

type Institution = {
  name: string
}

type OverviewStats = {
  created_on: number
  published_on: number
  partition_published_on: number
  nsf_funded: boolean
  project_views: Views
  project_downloads: Downloads
  journal_url: string
  institutions: (string | Institution)[]
  members?: Member[]
}

const props = defineProps<{
  overview: OverviewStats
}>()

const route = useRoute()
const router = useRouter()
const projectId = route.params.id
const authStore = useAuthStore()
const projectStore = usePublicProjectDetailsStore()

const viewTooltipText = getViewStatsTooltipText()

// Unpublish state
const showUnpublishModal = ref(false)
const isUnpublishing = ref(false)

const isLoggedIn = computed(() => !!authStore.user?.userId)
const isCurator = computed(() => authStore.isUserCurator)
const isAdmin = computed(() => authStore.isUserAdministrator)

const isMember = computed(() => {
  if (!authStore.user?.userId || !props.overview?.members) return false
  return props.overview.members.some((member: Member) => member.user_id === authStore.user.userId)
})

const canEditProjectInfo = computed(() => isCurator.value || isAdmin.value)
const canEditInstitutions = computed(() => isCurator.value || isAdmin.value)

const canRequestDuplication = computed(() => {
  // Curators and admins can always request duplication
  if (isCurator.value || isAdmin.value) return true
  // Members can also request duplication
  return isLoggedIn.value && isMember.value
})

// Prefer published stats JSON only; show 'unavailable' if missing
const projectViewsDisplay = computed(() => {
  const total = projectStore?.stats?.project_views?.total
  return typeof total === 'number' ? total : 'N/A'
})

const downloadsMDisplay = computed(() => {
  const val = projectStore?.stats?.project_downloads?.M
  return typeof val === 'number' ? val : 'N/A'
})

const downloadsXDisplay = computed(() => {
  const val = projectStore?.stats?.project_downloads?.X
  return typeof val === 'number' ? val : 'N/A'
})

// Check if project is published
const isProjectPublished = computed(() => {
  return props.overview?.published_on && props.overview.published_on > 0
})

// Unpublish functions
const handleUnpublishClick = () => {
  showUnpublishModal.value = true
}

const cancelUnpublish = () => {
  showUnpublishModal.value = false
}

const confirmUnpublish = async () => {
  isUnpublishing.value = true
  try {
    const response = await apiService.post(
      `/projects/${projectId}/publishing/unpublish`
    )
    if (response.ok) {
      // Redirect to the unpublished project overview page
      router.push(`/myprojects/${projectId}/overview`)
    } else {
      const error = await response.json()
      alert(`Failed to unpublish project: ${error.message || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Error unpublishing project:', error)
    alert('An error occurred while unpublishing the project.')
  } finally {
    isUnpublishing.value = false
    showUnpublishModal.value = false
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
            {{ projectViewsDisplay }}
          </li>
          <li class="list-group-item">
            <router-link class="fw-bold" to="#project-download"
              >Media downloads
            </router-link>
            <Tooltip :content="viewTooltipText"></Tooltip>:
            {{ downloadsMDisplay }}
          </li>
          <li class="list-group-item">
            <router-link class="fw-bold" to="#project-download"
              >Matrix downloads
            </router-link>
            <Tooltip :content="viewTooltipText"></Tooltip>:
            {{ downloadsXDisplay }}
          </li>
          <li v-if="canEditProjectInfo" class="list-group-item">
            <span class="fw-bold">
              <RouterLink :to="`/project/${projectId}/edit`">
                Edit project info
              </RouterLink>
            </span>
          </li>
          <li v-if="canEditInstitutions" class="list-group-item">
            <span class="fw-bold">
              <RouterLink :to="`/project/${projectId}/institutions`">
                Edit project institutions
              </RouterLink>
            </span>
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
          <li v-if="canEditProjectInfo && isProjectPublished" class="list-group-item">
            <span class="fw-bold">
              <a href="javascript:void(0)" @click="handleUnpublishClick" class="text-danger">
                Unpublish Project
              </a>
              <Tooltip
                content="Only curators and administrators can unpublish a project. This action will make the project private and remove it from public view. Use this with caution."
              ></Tooltip>
            </span>
          </li>
          <li v-if="canEditProjectInfo" class="list-group-item">
            <span class="fw-bold">
              <RouterLink :to="`/project/${projectId}/admin/assign`">
                Assign Project Administrator
              </RouterLink>
              <Tooltip
                content="Select a new project administrator from the existing project members. The new administrator will have full control over the project."
              ></Tooltip>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Unpublish Confirmation Modal -->
  <ConfirmModal
    v-if="showUnpublishModal"
    title="Unpublish Project"
    message="Are you sure you want to unpublish this project? This will make the project private and remove it from public view. This action should be done with caution."
    confirmText="Unpublish"
    cancelText="Cancel"
    :loading="isUnpublishing"
    @confirm="confirmUnpublish"
    @cancel="cancelUnpublish"
  />

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
