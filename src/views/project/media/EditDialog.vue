<script setup lang="ts">
import BibliographySearchInput from '@/views/project/common/BibliographySearchInput.vue'
import { onMounted} from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import { schema } from '@/views/project/media/schema.js'

import { useBibliographiesStore } from '@/stores/BibliographiesStore'

const route = useRoute()
const projectId = route.params.id

const bibliographiesStore = useBibliographiesStore()


const props = defineProps<{
  count: number
  delete: () => Promise<boolean>
}>()

async function handleSubmitClicked() {
  const deleted = await props.delete()
  if (!deleted) {
    alert('Failed to Delete')
  }

  const element = document.getElementById('mediaEditModal')
  if (!element) {
    return
  }

  const modal = Modal.getInstance(element)
  if (modal) {
    modal.hide()
  }
}

onMounted(() => {
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }
})
</script>
<template>
  <div class="modal fade" id="mediaEditModal" data-bs-backdrop="static" tabindex="-1">
    <form @submit.prevent="handleSubmitClicked">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Applying batch changes to {{ count }} media search results.
            </h5>
          </div>
          <div class="modal-body">
            <div class="accordion" id="accordionMediaEditModal">
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                    data-bs-target="#mediaEditCopyright" aria-expanded="false" aria-controls="mediaEditCopyright">
                    Copyright Information
                  </button>
                </h2>
                <div id="mediaEditCopyright" class="accordion-collapse collapse">
                  <div class="form-group">
                    <label class="form-label">
                      {{ schema.is_copyrighted.label }}
                    </label>
                    <component :is="schema.is_copyrighted.view" name="is_copyrighted">
                    </component>
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      {{ schema.copyright_permission.label }}
                    </label>
                    <component :is="schema.copyright_permission.view" name="copyright_permission"
                      v-bind="schema.copyright_permission.args">
                    </component>
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      {{ schema.copyright_license.label }}
                    </label>
                    <component :is="schema.copyright_license.view" name="copyright_license"
                      v-bind="schema.copyright_license.args">
                    </component>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      {{ schema.copyright_info.label }}
                    </label>
                    <component :is="schema.copyright_info.view" name="copyright_info"></component>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                    data-bs-target="#mediaEditView" aria-expanded="false" aria-controls="mediaEditView">
                    View Information
                  </button>
                </h2>
                <div id="mediaEditView" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        {{ schema.view_id.label }}
                      </label>
                      <component :is="schema.view_id.view" name="view_id">
                      </component>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                    data-bs-target="#mediaEditSide" aria-expanded="false" aria-controls="mediaEditSide">
                    Side Information
                  </button>
                </h2>
                <div id="mediaEditSide" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        {{ schema.is_sided.label }}
                      </label>
                      <component :is="schema.is_sided.view" name="is_sided" v-bind="schema.is_sided.args">
                      </component>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                    data-bs-target="#mediaEditSpecimen" aria-expanded="false" aria-controls="mediaEditSpecimen">
                    Specimen Information
                  </button>
                </h2>
                <div id="mediaEditSpecimen" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        {{ schema.specimen_id.label }}
                      </label>
                      <component :is="schema.specimen_id.view" name="specimen_id">
                      </component>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                    data-bs-target="#mediaEditBibliography" aria-expanded="false" aria-controls="mediaEditBibliography">
                    Bibliography Information
                  </button>
                </h2>
                <div id="mediaEditBibliography" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        Add a Bibliographic Reference
                      </label>
                      <component :is="BibliographySearchInput" name="reference_id">
                      </component>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                    data-bs-target="#mediaEditModalPublication" aria-expanded="false"
                    aria-controls="mediaEditModalPublication">
                    Publication Preference
                  </button>
                </h2>
                <div id="mediaEditModalPublication" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        {{ schema.published.label }}
                      </label>
                      <component :is="schema.published.view" name="status" v-bind="schema.published.args">
                      </component>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" data-bs-dismiss="modal">
              Save
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
