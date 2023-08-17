<script setup>
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import Tooltip from '@/components/main/Tooltip.vue'
import { toISODate } from '@/utils/date'
const projectStore = usePublicProjectDetailsStore()
</script>

<template>
  <div v-if="projectStore.overview.taxas?.length > 0">
    <div class="mb-5" v-for="item in projectStore.overview.taxas">
      <span class="h3">
        Taxonomic Overview for Matrix 'M{{ item.matrix_id }}' ({{
          item.taxonStats.length
        }}
        Taxa)
      </span>

      <table class="table table-bordered mt-2 table-striped">
        <thead>
          <tr>
            <th scope="col">Taxon</th>
            <th scope="col">Unscored cells</th>
            <th scope="col">Scored cells</th>
            <th scope="col">
              No cell support
              <Tooltip
                content="Cells that are scored (i.e., 0, 1, 2...etc... but not ?, -, NPA) that are without documentation, i.e., those that do not have any of the following notes, citations, or media."
              ></Tooltip>
            </th>
            <th scope="col">NPA cells</th>
            <th scope="col">"-" cells"</th>
            <th scope="col">Cell images</th>
            <th scope="col">Labels on cell images</th>
            <th scope="col">Member access</th>
          </tr>
        </thead>
        <tbody>
          <tr :key="n" v-for="(taxa, n) in item.taxonStats">
            <td scope="row">
              <b v-html="'[' + (n + 1) + '] ' + taxa.taxon_name"></b>
              <p>Last modified on {{ toISODate(taxa.last_modified_on) }}</p>
            </td>
            <td>{{ taxa.unscored_cells }}</td>
            <td>{{ taxa.scored_cells }}</td>
            <td>{{ taxa.cell_warnings }}</td>
            <td>{{ taxa.npa_cells }}</td>
            <td>{{ taxa.not_cells }}</td>
            <td>{{ taxa.cell_images }}</td>
            <td>{{ taxa.cell_image_labels }}</td>
            <td>
              {{ taxa.members.length }}
              <Tooltip
                :content="
                  'Project member with access: ' + taxa.members.join(', ')
                "
              ></Tooltip>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- </div> -->
    </div>
  </div>
  <div v-else>
    <span class="h4"> Project has no matrices defined. </span>
  </div>
</template>
