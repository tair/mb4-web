<script setup>
import { useProjectStore } from '@/stores/storeProjectDetails.js'
const projectStore = useProjectStore()
</script>

<template>
  <div class="mb-5" v-for="item in projectStore.overview.taxas">
    <span class="h3">
      Taxonomic Overview for Matrix 'M{{ item.matrix_id }}' ({{
        item.taxa.length
      }}
      Taxa)
    </span>

    <!-- <table
      class="table table-bordered mt-2 table-scroll"
      style="max-height: 400px"
    > -->
    <table class="table table-bordered mt-2 table-striped">
      <thead>
        <tr>
          <th scope="col">Taxon</th>
          <th scope="col">Unscrored cells</th>
          <th scope="col">Scored cells</th>
          <th scope="col">No cell support</th>
          <th scope="col">NPA cells</th>
          <th scope="col">"-" cells"</th>
          <th scope="col">Cell images</th>
          <th scope="col">Labels on cell images</th>
          <th scope="col">Member access</th>
        </tr>
      </thead>
      <tbody>
        <tr :key="n" v-for="(taxa, n) in item.taxa">
          <th scope="row">
            <div v-html="taxa.taxon_name"></div>
          </th>
          <td>{{ taxa.unscored_cells }}</td>
          <td>{{ taxa.scored_cells }}</td>
          <td>{{ taxa.cell_warnings }}</td>
          <td>{{ taxa.npa_cells }}</td>
          <td>{{ taxa.not_cells }}</td>
          <td>{{ taxa.cell_images }}</td>
          <td>{{ taxa.cell_image_labels }}</td>
          <td>XX</td>
        </tr>
      </tbody>
    </table>
    <!-- </div> -->
  </div>
</template>
