<script setup lang="ts">
import { ref, watch } from 'vue'
import BibliographyItem from '@/components/project/BibliographyItem.vue'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'

const props = defineProps<{
  projectId: number | string
  bibliographies: any[]
}>()

const bibliographiesStore = useBibliographiesStore()
const citationInfo = ref([])
const loading = ref(false)
const showWarning = ref(false)

// Check for citations when bibliographies change
watch(
  () => props.bibliographies,
  async (newBibliographies) => {
    if (newBibliographies && newBibliographies.length > 0) {
      await checkCitations()
    }
  },
  { immediate: true }
)

async function checkCitations() {
  if (!props.bibliographies?.length) return

  loading.value = true
  try {
    const referenceIds = props.bibliographies.map((b) => b.reference_id)
    const citations = await bibliographiesStore.checkCitations(
      props.projectId,
      referenceIds
    )
    citationInfo.value = citations
    showWarning.value = citations.some((c) => c.total_count > 0)
  } catch (error) {
    console.error('Error checking citations:', error)
    citationInfo.value = []
    showWarning.value = false
  } finally {
    loading.value = false
  }
}

function getBibliographyTitle(referenceId: number): string {
  const bibliography = props.bibliographies.find(
    (b) => b.reference_id === referenceId
  )
  if (!bibliography) return 'Unknown bibliography'

  return (
    bibliography.article_title ||
    bibliography.journal_title ||
    bibliography.monograph_title ||
    'Untitled bibliography'
  )
}

async function deleteBibliographies(referenceIds: number[]) {
  const deleted = bibliographiesStore.deleteIds(props.projectId, referenceIds)
  if (!deleted) {
    alert('Failed to delete bibliographies')
  }
}
</script>
<template>
  <div
    class="modal fade"
    id="bibliographyDeleteModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirm</h5>
        </div>
        <div class="modal-body" v-if="bibliographies.length">
          <div v-if="loading" class="text-center">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Checking for citations...
          </div>

          <div v-else>
            <!-- Warning for bibliographies with citations -->
            <div v-if="showWarning" class="alert alert-warning mb-3">
              <h6>
                <i class="fa-solid fa-triangle-exclamation"></i> Warning:
                Citations will be deleted
              </h6>
              <p class="mb-2">
                The following
                {{
                  bibliographies.length > 1
                    ? 'bibliographies have'
                    : 'bibliography has'
                }}
                associated citations that will also be deleted:
              </p>
              <ul class="mb-0">
                <li
                  v-for="citation in citationInfo.filter(
                    (c) => c.total_count > 0
                  )"
                  :key="citation.reference_id"
                >
                  <span v-if="citation.specimen_count > 0"
                    >{{ citation.specimen_count }} specimen citation{{
                      citation.specimen_count > 1 ? 's' : ''
                    }}</span
                  >
                  <span v-if="citation.media_count > 0"
                    >{{ citation.specimen_count > 0 ? ', ' : ''
                    }}{{ citation.media_count }} media citation{{
                      citation.media_count > 1 ? 's' : ''
                    }}</span
                  >
                  <span v-if="citation.taxa_count > 0"
                    >{{
                      citation.specimen_count + citation.media_count > 0
                        ? ', '
                        : ''
                    }}{{ citation.taxa_count }} taxa citation{{
                      citation.taxa_count > 1 ? 's' : ''
                    }}</span
                  >
                </li>
              </ul>
            </div>

            <!-- Standard confirmation message -->
            <p>
              Really delete
              <span v-if="bibliographies.length > 1">bibliographies</span>
              <span v-else>bibliography</span>:
            </p>
            <div
              v-for="bibliography in bibliographies"
              :key="bibliography.reference_id"
              class="mb-2"
            >
              <BibliographyItem :bibliography="bibliography" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-outline-primary"
            data-bs-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            :class="showWarning ? 'btn btn-danger' : 'btn btn-primary'"
            data-bs-dismiss="modal"
            @click="
              deleteBibliographies(bibliographies.map((b) => b.reference_id))
            "
            :disabled="loading"
          >
            <span v-if="loading">
              <i class="fa-solid fa-spinner fa-spin"></i>
              Checking...
            </span>
            <span v-else-if="showWarning">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Delete Bibliography & Citations
            </span>
            <span v-else> Delete </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
