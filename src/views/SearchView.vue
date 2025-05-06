<script setup>
import { computed, onMounted } from 'vue'
import { useSearchResultsStore } from '@/stores/SearchResultsStore'
import { useRoute } from 'vue-router'

const searchResultsStore = useSearchResultsStore()
const route = useRoute()

onMounted(() => {
  if (!searchResultsStore.isLoaded) {
    const searchTerm = route.query.searchTerm || ''
    const query = { searchTerm }
    searchResultsStore.fetchResults(query)
  }
})

const projectMembers = computed(
  () => searchResultsStore.results.projectMembers || []
)
const projects = computed(() => searchResultsStore.results.projects || [])
const media = computed(() => searchResultsStore.results.media || [])
</script>

<template>
  <div>
    <h1>Search</h1>
    <div class="mb-3">
      <template v-if="route.query.searchTerm">
        You searched for <i>{{ route.query.searchTerm }}</i> in all
        <b>published</b> projects.
      </template>
      <template v-else> Please enter a search term to see results. </template>
    </div>

    <!-- Project Members Section -->
    <div class="bg-light p-2 mb-2">
      <b>Project members ({{ projectMembers.length }})</b>
    </div>
    <div class="border p-2 mb-3">
      <div v-if="!projectMembers.length">No project members were found</div>
      <div v-else>
        <!-- List project members here -->
      </div>
    </div>

    <!-- Projects Section -->
    <div class="bg-light p-2 mb-2">
      <b>Projects ({{ projects.length }})</b>
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <div v-if="!projects.length">No projects were found</div>
      <div v-else>
        <div v-for="project in projects" :key="project.code" class="mb-2">
          <span class="text-danger fw-bold">{{ project.code }}</span> -
          {{ project.title }}
        </div>
      </div>
    </div>

    <!-- Media Section -->
    <div class="bg-light p-2 mb-2">
      <b>Media ({{ media.length }})</b>
    </div>
    <div class="border p-2 mb-3" style="max-height: 180px; overflow-y: auto">
      <div v-if="!media.length">No media were found</div>
      <div v-else>
        <div
          v-for="item in media"
          :key="item.code"
          class="d-flex align-items-center mb-2"
        >
          <img
            :src="item.img"
            alt="thumb"
            class="me-2"
            style="width: 60px; height: 40px; object-fit: cover"
          />
          <div>
            <div class="fw-bold">{{ item.code }}</div>
            <div>
              <i>{{ item.name }}</i>
            </div>
            <div class="text-muted small">{{ item.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
