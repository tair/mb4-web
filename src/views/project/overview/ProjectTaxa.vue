<script setup lang="ts">
import Tooltip from '@/components/main/Tooltip.vue'
import { toISODate } from '@/utils/date'

type TaxonStat = {
  taxon_number: number
  taxon_name: string
  last_modified_on: number
  unscored_cells: number
  scored_cells: number
  cell_warnings: number
  npa_cells: number
  not_cells: number
  cell_images: number
  cell_image_labels: number
  cells_scored_no_npa_cnotes_cmedia_ccitations: number
  members: string[]
}

type TaxaStats = {
  matrix_id: number
  taxonStats: TaxonStat[]
}

const props = defineProps<{
  taxa: TaxaStats[]
  published?: number
}>()
</script>
<template>
  <div v-if="taxa?.length > 0">
    <div class="mb-5" v-for="item in taxa">
      <span class="h3">
        Taxonomic Overview for Matrix 'M{{ item.matrix_id }}' ({{
          item.taxonStats.length
        }}
        Taxa)
      </span>

      <table class="table table-bordered mt-2 table-striped table-sm small">
        <thead class="sticky-header">

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
            <th scope="col">"-" cells</th>
            <th v-if="published !== 1" scope="col">Cell warnings</th>
            <th scope="col">Cell images</th>
            <th scope="col">Labels on cell images</th>
            <th scope="col">Member access</th>
          </tr>
        </thead>
        <tbody>
          <tr :key="n" v-for="(taxon, n) in item.taxonStats">
            <td scope="row">
              <b v-html="'[' + (taxon.taxon_number || (n + 1)) + '] ' + taxon.taxon_name"></b>
              <p>Last modified on {{ toISODate(taxon.last_modified_on) }}</p>
            </td>
            <td>{{ taxon.unscored_cells }}</td>
            <td>{{ taxon.scored_cells }}</td>
            <td>{{ taxon.cells_scored_no_npa_cnotes_cmedia_ccitations }}</td>
            <td>{{ taxon.npa_cells }}</td>
            <td>{{ taxon.not_cells }}</td>
            <td v-if="published !== 1">{{ taxon.cell_warnings }}</td>
            <td>{{ taxon.cell_images }}</td>
            <td>{{ taxon.cell_image_labels }}</td>
            <td>
              {{ taxon.members.length }}
              <Tooltip
                :content="
                  'Project member with access: ' + taxon.members.join(', ')
                "
              ></Tooltip>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else>
    <span class="h4"> Project has no matrices defined. </span>
  </div>
</template>

<style scoped>
.sticky-header {
  position: sticky !important;
  top: 80px !important;
  z-index: 50 !important;
  background-color: #f8f9fa !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

.sticky-header th {
  background-color: #f8f9fa !important;
  border-top: 1px solid #dee2e6 !important;
  border-bottom: 2px solid #dee2e6 !important;
  position: sticky !important;
  top: 80px !important;
  padding: 12px 8px !important;
  font-weight: 600 !important;
}

/* Ensure the table header is always visible */
table.table thead.sticky-header th {
  background-color: #f8f9fa !important;
  color: #212529 !important;
}
</style>
