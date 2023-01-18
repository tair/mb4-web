<script setup>
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
const projectStore = usePublicProjectDetailsStore()
</script>

<template>
  <div>
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
          <td>{{ projectStore.overview.project_downloads['total'] }}</td>
          <td></td>
        </tr>
        <tr>
          <th scope="row">Matrix downloads</th>
          <td>{{ projectStore.overview.project_downloads['X'] }}</td>
          <td>
            <span class="badge rounded-pill bg-secondary mx-2"
              >Matrix landing page (9796 views)</span
            >
          </td>
        </tr>
        <tr>
          <th scope="row">Document downloads</th>
          <td>{{ projectStore.overview.project_downloads['D'] }}</td>
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
          <th scope="row">Media downloads</th>
          <td>{{ projectStore.overview.project_downloads['M'] }}</td>
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
          <th scope="row">Project downloads</th>
          <td>{{ projectStore.overview.project_downloads['P'] }}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
