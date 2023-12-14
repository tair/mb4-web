<script setup lang="ts">
import { Modal } from 'bootstrap'
import TaxonomicName from '@/components/project/TaxonomicName.vue'
import TaxaSearchInput from '@/views/project/taxa/TaxaSearchInput.vue'
import { useTaxaStore } from '@/stores/TaxaStore'
import { computed, onMounted, onUpdated, reactive, ref, watch } from 'vue'

const remappedTaxonIds = new Map()
const props = defineProps<{
  projectId: number | string
  taxa: any[]
  deleteTaxa: (taxonIds: number[], map: Map<number, number>) => Promise<boolean>
  searchTaxa: (text: string) => Promise<any[]>
}>()

const usages = ref(null)
onMounted(() => {
  const modalElement = document.getElementById('taxaDeleteModal')
  modalElement.addEventListener('hidden.bs.modal', () => {
    remappedTaxonIds.clear()
    usages.value = null
  })
})

// Watch the input taxa so that we can fetch their usages when the user changes
// the taxa.
const taxaStore = useTaxaStore()
const taxonIds = computed(() => props.taxa.map((taxon) => taxon.taxon_id))
watch(taxonIds, async (ids) => {
  usages.value = await taxaStore.fetchTaxaUsage(props.projectId, ids)
})

function getUsageText(usage: { [key: string]: number }): string {
  const text: string[] = []
  for (const [number, count] of Object.entries(usage)) {
    switch (number) {
      case '1':
        text.push(count + ' Media')
        break
      case '2':
        text.push(count + (count > 1 ? ' Specimens' : ' Specimen'))
        break
      case '24':
        text.push(count + (count > 1 ? ' Matrices' : ' Matrix'))
        break
      case '61':
        text.push(count + (count > 1 ? ' Partitions' : ' Partition'))
        break
    }
  }
  return text.join(', ')
}

function setRemappedTaxonId(originalTaxonId: number, remappedTaxonId: number) {
  if (remappedTaxonId) {
    remappedTaxonIds.set(originalTaxonId, remappedTaxonId)
  } else {
    remappedTaxonIds.delete(originalTaxonId)
  }
}

async function handleDelete() {
  const deleted = await props.deleteTaxa(
    props.taxa.map((taxon) => taxon.taxon_id),
    remappedTaxonIds
  )
  if (deleted) {
    const element = document.getElementById('taxaDeleteModal')
    const modal = Modal.getInstance(element)
    modal.hide()
  }
}
</script>
<template>
  <div
    class="modal fade"
    id="taxaDeleteModal"
    data-bs-backdrop="static"
    tabindex="-1"
    aria-labelledby="staticBackdropLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Delete taxa</h5>
        </div>
        <div class="modal-body" v-if="usages == null">Loading...</div>
        <div class="modal-body" v-else-if="taxa.length">
          <section>
            The deletion of a taxon removes it everywhere it is in use -
            INCLUDING FROM MATRICES - permanently.
          </section>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="taxon in taxa" :key="taxon.taxon_id">
                <td>
                  <TaxonomicName :showExtinctMarker="true" :taxon="taxon" />
                </td>

                <td v-if="taxon.taxon_id in usages">
                  This taxon is affiliated with
                  {{ getUsageText(usages[taxon.taxon_id]) }}.
                  <button
                    type="button"
                    class="btn btn-sm btn-secondary"
                    data-bs-toggle="collapse"
                    :data-bs-target="`#collapseTransferTaxon-${taxon.taxon_id}`"
                  >
                    Transfer
                  </button>
                  <div
                    :id="`collapseTransferTaxon-${taxon.taxon_id}`"
                    class="collapse"
                  >
                    <div class="card card-body">
                      <p>
                        You must move these affiliated items to another taxon,
                        start typing that taxon's name in the box and choose the
                        desired taxon from the suggested matches.
                      </p>
                      <TaxaSearchInput
                        :search="searchTaxa"
                        @select="
                          (t) => setRemappedTaxonId(taxon.taxon_id, t?.taxon_id)
                        "
                      >
                        <template #item="taxon">
                          <TaxonomicName
                            :showExtinctMarker="true"
                            :taxon="taxon"
                          />
                        </template>
                      </TaxaSearchInput>
                    </div>
                  </div>
                </td>
                <td v-else>This taxon is not associated.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-body" v-else>No selected Taxa</div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="handleDelete">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
