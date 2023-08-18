<script setup>
import { reactive } from 'vue'
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
const projectStore = usePublicProjectDetailsStore()
const folded = reactive({
  mediaViews: true,
  folioViews: true,
  matrixViews: true,
})

// Define the toggleFold method
const toggleFold = (section) => {
  folded[section] = !folded[section]
}

const foldThreshold = 20
</script>

<template>
  <div id="project-view">
    <h3>Project Views</h3>
    <!-- {{ projectStore.overview.project_views[0]["hit_type"] }} -->
    <table class="table table-bordered table-striped">
      <thead>
        <tr>
          <th scope="col">Type</th>
          <th scope="col">Number of views</th>
          <th scope="col">Individual items viewed (where applicable)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Total project views</th>
          <td>{{ projectStore.overview.project_views['total'] }}</td>
          <td></td>
        </tr>
        <tr>
          <th scope="row">Project overview</th>
          <td>{{ projectStore.overview.project_views['P'] }}</td>
          <td></td>
        </tr>
        <tr v-if="projectStore.overview.project_views['M']">
          <th scope="row">Media views</th>
          <td>{{ projectStore.overview.project_views['M'] }}</td>
          <td>
            <div v-if="projectStore.overview.project_views.details['M']">
              <span
                v-for="(item, index) in projectStore.overview.project_views
                  .details['M']"
                :class="{
                  badge: true,
                  'rounded-pill': true,
                  'bg-secondary': true,
                  'spaced-span': true,
                  folded: index > foldThreshold && folded.mediaViews,
                }"
                >{{ item.name }} ({{ item.val }})</span
              >
              <button
                v-if="
                  projectStore.overview.project_views.details['M'].length >
                  foldThreshold
                "
                class="btn btn-link"
                @click="toggleFold('mediaViews')"
              >
                {{ folded.mediaViews ? 'Show more' : 'Show less' }}
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="projectStore.overview.project_views['T']">
          <th scope="row">Taxon list</th>
          <td>{{ projectStore.overview.project_views['T'] }}</td>
          <td></td>
        </tr>
        <tr v-if="projectStore.overview.project_views['S']">
          <th scope="row">Specimen list</th>
          <td>{{ projectStore.overview.project_views['S'] }}</td>
          <td></td>
        </tr>
        <tr v-if="projectStore.overview.project_views['F']">
          <th scope="row">Folio views</th>
          <td>{{ projectStore.overview.project_views['F'] }}</td>
          <td>
            <div v-if="projectStore.overview.project_views.details['F']">
              <span
                v-for="(item, index) in projectStore.overview.project_views
                  .details['F']"
                :class="{
                  badge: true,
                  'rounded-pill': true,
                  'bg-secondary': true,
                  'spaced-span': true,
                  folded: index > 20 && folded.folioViews,
                }"
                >{{ item.name }} ({{ item.val }})</span
              >
              <button
                v-if="
                  projectStore.overview.project_views.details['F'].length >
                  foldThreshold
                "
                class="btn btn-link"
                @click="toggleFold('folioViews')"
              >
                {{ folded.folioViews ? 'Show more' : 'Show less' }}
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="projectStore.overview.project_views['V']">
          <th scope="row">Views for media list</th>
          <td>{{ projectStore.overview.project_views['V'] }}</td>
          <td></td>
        </tr>
        <tr v-if="projectStore.overview.project_views['B']">
          <th scope="row">Bibliography</th>
          <td>{{ projectStore.overview.project_views['B'] }}</td>
          <td></td>
        </tr>
        <tr v-if="projectStore.overview.project_views['D']">
          <th scope="row">Documents list</th>
          <td>{{ projectStore.overview.project_views['D'] }}</td>
          <td></td>
        </tr>
        <tr v-if="projectStore.overview.project_views['X']">
          <th scope="row">Matrix views</th>
          <td>{{ projectStore.overview.project_views['X'] }}</td>
          <td>
            <div v-if="projectStore.overview.project_views.details['X']">
              <span
                v-for="(item, index) in projectStore.overview.project_views
                  .details['X']"
                :class="{
                  badge: true,
                  'rounded-pill': true,
                  'bg-secondary': true,
                  'spaced-span': true,
                  folded: index > 20 && folded.matrixViews,
                }"
                >{{ item.name }} ({{ item.val }})</span
              >
              <button
                v-if="
                  projectStore.overview.project_views.details['X'].length >
                  foldThreshold
                "
                class="btn btn-link"
                @click="toggleFold('matrixViews')"
              >
                {{ folded.matrixViews ? 'Show more' : 'Show less' }}
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
