<script setup lang="ts">
import { Modal } from 'bootstrap'
import SpecimenName from '@/components/project/SpecimenName.vue'
import SpecimenSearchInput from '@/views/project/common/SpecimenSearchInput.vue'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  projectId: number | string
  specimens: any[]
}>()

// This outlines all the usages for the given specimen. This is grouped by the
// specimen ID. The usage is outlined by:
// <specimen_number>: {
//  <table_number>: <count>
//  ...
//}
const usages = ref(null)

// A old specimen to new specimen map in which all references from the old
// specimen will be changed to the new specimen.
const remappedSpecimenIds = new Map()

onMounted(() => {
  const modalElement = document.getElementById('specimensDeleteModal')
  modalElement.addEventListener('hidden.bs.modal', () => {
    remappedSpecimenIds.clear()
    usages.value = null
  })
})

// Watch the input specimen so that we can fetch their usages when the user changes
// the specimen.
const specimensStore = useSpecimensStore()
const specimenIds = computed(() =>
  props.specimens.map((specimen) => specimen.specimen_id)
)
watch(specimenIds, async (ids) => {
  usages.value = await specimensStore.fetchSpecimensUsage(props.projectId, ids)
})

const taxaStore = useTaxaStore()

function getUsageText(usage: { [key: string]: number }): string {
  const text: string[] = []
  for (const [number, count] of Object.entries(usage)) {
    switch (number) {
      case '1':
        text.push(count + ' Media')
        break
      case '43':
        text.push(count + (count > 1 ? ' Citations' : ' Citation'))
    }
  }
  return text.join(', ')
}

function setRemappedSpecimenId(
  originalSpecimenId: number,
  remappedSpecimenId: number
) {
  if (remappedSpecimenId) {
    remappedSpecimenIds.set(originalSpecimenId, remappedSpecimenId)
  } else {
    remappedSpecimenIds.delete(originalSpecimenId)
  }
}

async function handleDelete() {
  const deleted = await specimensStore.deleteIds(
    props.projectId,
    specimenIds.value,
    Object.fromEntries(remappedSpecimenIds.entries())
  )
  if (deleted) {
    const element = document.getElementById('specimensDeleteModal')
    const modal = Modal.getInstance(element)
    modal.hide()
  } else {
    alert('Failed to delete specimens')
  }
}
</script>
<template>
  <div
    class="modal fade"
    id="specimensDeleteModal"
    data-bs-backdrop="static"
    tabindex="-1"
    aria-labelledby="staticBackdropLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Delete Specimen</h5>
        </div>
        <div class="modal-body" v-if="usages == null">Loading...</div>
        <div class="modal-body" v-else-if="specimens.length">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="specimen in specimens" :key="specimen.specimen_id">
                <td>
                  <SpecimenName
                    :specimen="specimen"
                    :taxon="taxaStore.getTaxonById(specimen.taxon_id)"
                  />
                </td>

                <td v-if="specimen.specimen_id in usages">
                  This specimen is affiliated with
                  {{ getUsageText(usages[specimen.specimen_id]) }}.
                  <button
                    type="button"
                    class="btn btn-outline-primary mt-1"
                    data-bs-toggle="collapse"
                    :data-bs-target="`#collapseTransferSpecimen-${specimen.specimen_id}`"
                  >
                    Transfer
                  </button>
                  <div
                    :id="`collapseTransferSpecimen-${specimen.specimen_id}`"
                    class="collapse mt-3"
                  >
                    <div class="card card-body">
                      <p>
                        You must move these affiliated items to another
                        specimen, start typing that specimen's name in the box
                        and choose the desired specimen from the suggested
                        matches.
                      </p>
                      <SpecimenSearchInput
                        @select="
                          (selected) =>
                            setRemappedSpecimenId(
                              specimen.specimen_id,
                              selected?.specimen_id
                            )
                        "
                      >
                        <template #item="specimen">
                          <SpecimenName
                            :specimen="specimen"
                            :taxon="taxaStore.getTaxonById(specimen.taxon_id)"
                          />
                        </template>
                      </SpecimenSearchInput>
                    </div>
                  </div>
                </td>
                <td v-else>This speciment is not associated.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-body" v-else>No selected Specimen</div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-outline-primary"
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
