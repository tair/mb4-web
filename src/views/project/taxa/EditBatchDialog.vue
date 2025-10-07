<script setup lang="ts">
import BibliographySearchInput from '@/views/project/common/BibliographySearchInput.vue'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Modal } from 'bootstrap'
import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useNotifications } from '@/composables/useNotifications'

const props = defineProps<{
  batchEdit: (formData: any) => Promise<boolean>
}>()

const route = useRoute()
const projectId = route.params.id

const bibliographiesStore = useBibliographiesStore()
const { showError, showSuccess } = useNotifications()

const menuCollapsed = ref({
  editExtinct: true,
  editBibliography: true,
})

async function handleSubmitClicked(event: Event) {
  const target = event.currentTarget as HTMLFormElement
  const formData = new FormData(target)
  const json = Object.fromEntries(formData)
  
  try {
    const success = await props.batchEdit(json)
    if (success) {
      showSuccess('Taxa updated successfully!')
      const element = document.getElementById('taxaEditModal')
      if (element) {
        const modal = Modal.getInstance(element)
        if (modal) {
          modal.hide()
        }
      }
    } else {
      showError('Failed to edit taxa')
    }
  } catch (error) {
    console.error('Error editing taxa:', error)
    showError('Failed to edit taxa. Please try again.')
  }
}

onMounted(() => {
  if (!bibliographiesStore.isLoaded) {
    bibliographiesStore.fetchBibliographies(projectId)
  }

  const values = menuCollapsed.value as any
  for (const id of Object.keys(values)) {
    const element = document.getElementById(id)
    if (element) {
      const listener = () => {
        values[id] = !element.classList.contains('show')
      }

      element.addEventListener('shown.bs.collapse', listener)
      element.addEventListener('hidden.bs.collapse', listener)
    }
  }
})
</script>
<template>
  <div
    class="modal fade"
    id="taxaEditModal"
    data-bs-backdrop="static"
    tabindex="-1"
  >
    <form @submit.prevent="handleSubmitClicked">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Applying batch changes to media search results
            </h5>
          </div>
          <div class="modal-body">
            <div class="accordion" id="accordionMediaEditModal">
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#editExtinct"
                    aria-expanded="false"
                    aria-controls="editExtinct"
                  >
                    Extinct Information
                  </button>
                </h2>
                <div id="editExtinct" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label"> Extinct </label>
                      <select
                        :disabled="menuCollapsed['editExtinct']"
                        name="is_extinct"
                      >
                        <option value="0">Living</option>
                        <option value="1">Extinct</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#editBibliography"
                    aria-expanded="false"
                    aria-controls="editBibliography"
                  >
                    Bibliography Information
                  </button>
                </h2>
                <div id="editBibliography" class="accordion-collapse collapse">
                  <div class="accordion-body">
                    <div class="form-group">
                      <label class="form-label">
                        Add a Bibliographic Reference
                      </label>
                      <component
                        :is="BibliographySearchInput"
                        :disabled="menuCollapsed['editBibliography']"
                        name="reference_id"
                      >
                      </component>
                    </div>
                  </div>
                </div>
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
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
