<script setup>
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
const projectStore = usePublicProjectDetailsStore()
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
        <tr>
          <th scope="row">Matrix views</th>
          <td>{{ projectStore.overview.project_views['X'] }}</td>
          <td>
            <span class="badge rounded-pill bg-secondary mx-2"
              >Matrix landing page (9796 views)</span
            >
            <span class="badge rounded-pill bg-secondary mx-2"
              >Matrix landing page (9796 views)</span
            >
          </td>
        </tr>
        <tr>
          <th scope="row">Media views</th>
          <td>{{ projectStore.overview.project_views['M'] }}</td>
          <td>
            <span class="badge rounded-pill bg-secondary mx-2"
              >M130184 (2 views)</span
            >
            <span class="badge rounded-pill bg-secondary mx-2"
              >M135220 (3 views)</span
            >
            <span class="badge rounded-pill bg-secondary mx-2"
              >M135220 (3 views)</span
            >
            <span class="badge rounded-pill bg-secondary mx-2"
              >M135220 (3 views)</span
            >
            <span class="badge rounded-pill bg-secondary mx-2"
              >M135220 (3 views)</span
            ><span class="badge rounded-pill bg-secondary mx-2"
              >M135220 (3 views)</span
            >
            <span class="badge rounded-pill bg-secondary mx-2"
              >M135220 (3 views)</span
            >
            <span class="badge rounded-pill bg-secondary mx-2"
              >M135220 (3 views)</span
            >
          </td>
        </tr>

        <tr>
          <th scope="row">Views for media list</th>
          <td>{{ projectStore.overview.project_views['V'] }}</td>
          <td></td>
        </tr>
        <tr>
          <th scope="row">Specimen list</th>
          <td>{{ projectStore.overview.project_views['S'] }}</td>
          <td></td>
        </tr>
        <tr>
          <th scope="row">Taxon list</th>
          <td>{{ projectStore.overview.project_views['T'] }}</td>
          <td></td>
        </tr>
        <tr>
          <th scope="row">Bibliography</th>
          <td>{{ projectStore.overview.project_views['B'] }}</td>
          <td></td>
        </tr>
        <tr>
          <th scope="row">Documents list</th>
          <td>{{ projectStore.overview.project_views['D'] }}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
