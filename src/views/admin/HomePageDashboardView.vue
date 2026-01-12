<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { useHomePageAdminStore } from '@/stores/HomePageAdminStore.js'
import { useNotifications } from '@/composables/useNotifications.ts'
import ToolsSection from '@/components/admin/ToolsSection.vue'
import AnnouncementsSection from '@/components/admin/AnnouncementsSection.vue'
import MatrixImagesSection from '@/components/admin/MatrixImagesSection.vue'
import FeaturedProjectsSection from '@/components/admin/FeaturedProjectsSection.vue'
import PressSection from '@/components/admin/PressSection.vue'

const { showError } = useNotifications()
const store = useHomePageAdminStore()

const isLoaded = ref(false)
const activeSection = ref('tools')

const sections = [
  { id: 'tools', label: 'Tools', icon: 'fa-wrench' },
  // { id: 'announcements', label: 'Announcements', icon: 'fa-bullhorn' },
  { id: 'matrix-images', label: 'Matrix Images', icon: 'fa-image' },
  { id: 'featured-projects', label: 'Featured Projects', icon: 'fa-star' },
  { id: 'press', label: 'Press / Updates', icon: 'fa-newspaper' },
]

onMounted(async () => {
  try {
    await store.fetchAllContent()
  } catch (error) {
    showError('Failed to load homepage content')
  } finally {
    isLoaded.value = true
  }
})
</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <div class="container-fluid">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item">
                <RouterLink to="/admin">Admin</RouterLink>
              </li>
              <li class="breadcrumb-item active" aria-current="page">
                Home Page Dashboard
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div class="row mb-4">
        <div class="col-12">
          <h1>Home Page Dashboard</h1>
          <p class="text-muted">
            Manage the content displayed on the MorphoBank public homepage
          </p>
        </div>
      </div>

      <!-- Info Banner -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="alert alert-info">
            <i class="fa fa-info-circle me-2"></i>
            <strong>Note:</strong> Changes made here will be immediately
            visible on the public homepage. Statistics shown on the homepage are
            calculated for the past 30 days and update automatically.
          </div>
        </div>
      </div>

      <!-- Section Tabs -->
      <div class="row mb-4">
        <div class="col-12">
          <ul class="nav nav-tabs section-tabs">
            <li v-for="section in sections" :key="section.id" class="nav-item">
              <button
                class="nav-link"
                :class="{ active: activeSection === section.id }"
                @click="activeSection = section.id"
              >
                <i :class="['fa', section.icon, 'me-2']"></i>
                {{ section.label }}
                <span
                  v-if="section.id === 'tools'"
                  class="badge bg-secondary ms-2"
                >
                  {{ store.tools.length }}
                </span>
                <span
                  v-else-if="section.id === 'announcements'"
                  class="badge bg-secondary ms-2"
                >
                  {{ store.announcements.length }}
                </span>
                <span
                  v-else-if="section.id === 'matrix-images'"
                  class="badge bg-secondary ms-2"
                >
                  {{ store.matrixImages.length }}
                </span>
                <span
                  v-else-if="section.id === 'featured-projects'"
                  class="badge bg-secondary ms-2"
                >
                  {{ store.featuredProjects.length }}
                </span>
                <span
                  v-else-if="section.id === 'press'"
                  class="badge bg-secondary ms-2"
                >
                  {{ store.press.length }}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Section Content -->
      <div class="row">
        <div class="col-12">
          <div class="section-content">
            <ToolsSection v-if="activeSection === 'tools'" />
            <!-- <AnnouncementsSection v-else-if="activeSection === 'announcements'" /> -->
            <MatrixImagesSection v-else-if="activeSection === 'matrix-images'" />
            <FeaturedProjectsSection v-else-if="activeSection === 'featured-projects'" />
            <PressSection v-else-if="activeSection === 'press'" />
          </div>
        </div>
      </div>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin-bottom: 0;
}

.section-tabs .nav-link {
  color: #495057;
  border-radius: 0.375rem 0.375rem 0 0;
  padding: 0.75rem 1.25rem;
  font-weight: 500;
}

.section-tabs .nav-link:hover:not(.active) {
  color: #0d6efd;
  border-color: transparent transparent #dee2e6 transparent;
}

.section-tabs .nav-link.active {
  color: #0d6efd;
  background-color: #fff;
  border-color: #dee2e6 #dee2e6 #fff #dee2e6;
}

.section-content {
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-top: none;
  border-radius: 0 0 0.375rem 0.375rem;
  padding: 1.5rem;
  min-height: 400px;
}

.alert-info {
  background-color: #e7f3ff;
  border-color: #b6d4fe;
  color: #084298;
}
</style>

