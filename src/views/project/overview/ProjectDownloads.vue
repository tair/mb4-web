<script setup>
import { reactive } from 'vue'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
const projectStore = usePublicProjectDetailsStore()
const folded = reactive({
  mediaDownloads: true,
  documentDownloads: true,
  matrixDownloads: true,
})

// Define the toggleFold method
const toggleFold = (section) => {
  folded[section] = !folded[section]
}

const foldThreshold = 20
</script>

<template>
  <div id="project-download">
    <h3>Project Downloads</h3>

    <table class="table table-bordered table-striped">
      <thead>
        <tr>
          <th scope="col">Type</th>
          <th scope="col">Number of downloads</th>
          <th scope="col">Individual items downloaded (where applicable)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Total downloads from project</th>
          <td>{{ projectStore.stats.project_downloads['total'] }}</td>
          <td></td>
        </tr>
        <tr>
          <th scope="row">Media downloads</th>
          <td>{{ projectStore.stats.project_downloads['M'] }}</td>
          <td>
            <div v-if="projectStore.stats.project_downloads.details['M']">
              <span
                v-for="(item, index) in projectStore.stats.project_downloads
                  .details['M']"
                :class="{
                  badge: true,
                  'rounded-pill': true,
                  'bg-secondary': true,
                  'spaced-span': true,
                  folded: index > foldThreshold && folded.mediaDownloads,
                }"
                >{{ item.name }} ({{ item.val }})</span
              >
              <button
                v-if="
                  projectStore.stats.project_downloads.details['M'].length >
                  foldThreshold
                "
                class="btn btn-link"
                @click="toggleFold('mediaDownloads')"
              >
                {{ folded.mediaDownloads ? 'Show more' : 'Show less' }}
              </button>
            </div>
          </td>
        </tr>
        <tr>
          <th scope="row">Matrix downloads</th>
          <td>{{ projectStore.stats.project_downloads['X'] }}</td>
          <td>
            <div v-if="projectStore.stats.project_downloads.details['X']">
              <span
                v-for="(item, index) in projectStore.stats.project_downloads
                  .details['X']"
                :class="{
                  badge: true,
                  'rounded-pill': true,
                  'bg-secondary': true,
                  'spaced-span': true,
                  folded: index > foldThreshold && folded.matrixDownloads,
                }"
                >{{ item.name }} ({{ item.val }})</span
              >
              <button
                v-if="
                  projectStore.stats.project_downloads.details['X'].length >
                  foldThreshold
                "
                class="btn btn-link"
                @click="toggleFold('matrixDownloads')"
              >
                {{ folded.matrixDownloads ? 'Show more' : 'Show less' }}
              </button>
            </div>
          </td>
        </tr>
        <tr>
          <th scope="row">Project downloads</th>
          <td>{{ projectStore.stats.project_downloads['P'] }}</td>
          <td></td>
        </tr>
        <tr>
          <th scope="row">Document downloads</th>
          <td>{{ projectStore.stats.project_downloads['D'] }}</td>
          <td>
            <div v-if="projectStore.stats.project_downloads.details['D']">
              <span
                v-for="(item, index) in projectStore.stats.project_downloads
                  .details['D']"
                :class="{
                  badge: true,
                  'rounded-pill': true,
                  'bg-secondary': true,
                  'spaced-span': true,
                  folded: index > foldThreshold && folded.documentDownloads,
                }"
                >{{ item.name }} ({{ item.val }})</span
              >
              <button
                v-if="
                  projectStore.stats.project_downloads.details['D'].length >
                  foldThreshold
                "
                class="btn btn-link"
                @click="toggleFold('documentDownloads')"
              >
                {{ folded.documentDownloads ? 'Show more' : 'Show less' }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
.spaced-span {
  margin-right: 5px;
}

.spaced-span.folded {
  display: none;
}

.btn-link {
  padding: 0;
}
</style>
