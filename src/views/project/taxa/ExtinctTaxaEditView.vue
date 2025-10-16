<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useNotifications } from '@/composables/useNotifications'
import LoadingIndicator from '@/components/project/LoadingIndicator.vue'
import { getTaxonName, sortTaxaAlphabetically, TaxaColumns } from '@/utils/taxa'
import { useAuthStore } from '@/stores/AuthStore'
import { AccessControlService, EntityType } from '@/lib/access-control.js'
import { apiService } from '@/services/apiService.js'

const route = useRoute()
const projectId = parseInt(route.params.id)
const taxaStore = useTaxaStore()
const authStore = useAuthStore()
const projectUsersStore = useProjectUsersStore()
const { showError, showSuccess } = useNotifications()

const isLoaded = computed(() => taxaStore.isLoaded && projectUsersStore.isLoaded)

// Cache for access control results
const accessCache = ref(new Map())
const accessCheckInProgress = ref(new Set())

// Helper function to get access synchronously from cache or trigger async check
function getTaxonEditability(taxon) {
  if (accessCache.value.has(taxon.taxon_id)) {
    return accessCache.value.get(taxon.taxon_id)
  }
  
  // If not in cache and not already checking, start async check
  if (!accessCheckInProgress.value.has(taxon.taxon_id)) {
    accessCheckInProgress.value.add(taxon.taxon_id)
    canEditTaxon(taxon).then((canEdit) => {
      accessCheckInProgress.value.delete(taxon.taxon_id)
      // Force reactivity update
      accessCache.value = new Map(accessCache.value)
    })
  }
  
  // Return false while checking (safe default)
  return false
}

// Enhanced taxa lists with access control info, sorted like taxa list page
const livingTaxa = computed(() =>
  sortTaxaAlphabetically(
    taxaStore.taxa
      .filter(taxon => !taxon.is_extinct)
      .map(taxon => ({
        ...taxon,
        canEdit: getTaxonEditability(taxon),
      })),
    TaxaColumns.GENUS
  )
)

const extinctTaxa = computed(() =>
  sortTaxaAlphabetically(
    taxaStore.taxa
      .filter(taxon => taxon.is_extinct)
      .map(taxon => ({
        ...taxon,
        canEdit: getTaxonEditability(taxon),
      })),
    TaxaColumns.GENUS
  )
)

// Selection state for multi-select
const selectedLiving = ref(new Set())
const selectedExtinct = ref(new Set())
const dragInProgress = ref(false)

// Drag and drop functionality
const dragStartLiving = ref(null)
const dragStartExtinct = ref(null)

onMounted(async () => {
  // Ensure auth store is loaded from localStorage
  if (!authStore.user?.access) {
    authStore.fetchLocalStore()
  }

  const promises = []
  if (!taxaStore.isLoaded) {
    promises.push(taxaStore.fetch(projectId))
  }
  if (!projectUsersStore.isLoaded) {
    promises.push(projectUsersStore.fetchUsers(projectId))
  }
  
  await Promise.all(promises)
})

function displayNotification(message, type = 'success') {
  if (type === 'error') {
    showError(message)
  } else {
    showSuccess(message)
  }
}

function handleItemClick(taxonId, isExtinctList) {
  const selectedSet = isExtinctList ? selectedExtinct : selectedLiving
  const otherSet = isExtinctList ? selectedLiving : selectedExtinct
  
  // Clear selections from the other list
  otherSet.value.clear()
  
  // Toggle selection in current list
  if (selectedSet.value.has(taxonId)) {
    selectedSet.value.delete(taxonId)
  } else {
    selectedSet.value.add(taxonId)
  }
}

function handleShiftClick(taxonId, isExtinctList, event) {
  event.preventDefault()
  
  const taxaList = isExtinctList ? extinctTaxa.value : livingTaxa.value
  const selectedSet = isExtinctList ? selectedExtinct : selectedLiving
  
  // Find first and last selected items for range selection
  const selectedItems = Array.from(selectedSet.value)
  if (selectedItems.length === 0) {
    selectedSet.value.add(taxonId)
    return
  }
  
  const currentIndex = taxaList.findIndex(t => t.taxon_id === taxonId)
  const firstSelectedIndex = Math.min(...selectedItems.map(id => 
    taxaList.findIndex(t => t.taxon_id === id)
  ))
  const lastSelectedIndex = Math.max(...selectedItems.map(id => 
    taxaList.findIndex(t => t.taxon_id === id)
  ))
  
  // Select range
  const startIndex = Math.min(firstSelectedIndex, currentIndex)
  const endIndex = Math.max(lastSelectedIndex, currentIndex)
  
  for (let i = startIndex; i <= endIndex; i++) {
    if (taxaList[i]) {
      selectedSet.value.add(taxaList[i].taxon_id)
    }
  }
}

function onDragStart(event, taxonId, isExtinctList) {
  const taxaList = isExtinctList ? extinctTaxa.value : livingTaxa.value
  const taxon = taxaList.find(t => t.taxon_id === taxonId)
  
  // Don't allow drag if user can't edit this taxon
  if (!taxon || !taxon.canEdit) {
    event.preventDefault()
    return
  }
  
  dragInProgress.value = true
  const selectedSet = isExtinctList ? selectedExtinct : selectedLiving
  
  // If the dragged item isn't selected, select only it
  if (!selectedSet.value.has(taxonId)) {
    selectedSet.value.clear()
    selectedSet.value.add(taxonId)
  }
  
  // Store drag context
  if (isExtinctList) {
    dragStartExtinct.value = Array.from(selectedExtinct.value)
  } else {
    dragStartLiving.value = Array.from(selectedLiving.value)
  }
  
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', JSON.stringify({
    taxonIds: Array.from(selectedSet.value),
    fromExtinct: isExtinctList
  }))
}

function onDragEnd() {
  dragInProgress.value = false
  dragStartLiving.value = null
  dragStartExtinct.value = null
}

function onDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

async function onDrop(event, toExtinct) {
  event.preventDefault()
  
  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    const { taxonIds, fromExtinct } = data
    
    // Don't do anything if dropping in the same list
    if (fromExtinct === toExtinct) {
      return
    }
    
    await updateExtinctStatus(taxonIds, toExtinct)
    
    // Clear selections after successful move
    selectedLiving.value.clear()
    selectedExtinct.value.clear()
    
  } catch (error) {
    console.error('Drop error:', error)
    displayNotification('Failed to move taxa', 'error')
  } finally {
    dragInProgress.value = false
  }
}

async function updateExtinctStatus(taxonIds, extinct) {
  try {
    const response = await apiService.post(`/projects/${projectId}/taxa/extinct/batch`,
      {
        ids: taxonIds,
        extinct: extinct ? 1 : 0
      }
    )
    
    const responseData = await response.json()
    
    if (responseData.status === 'ok') {
      // Update local store
      for (const taxonId of taxonIds) {
        const taxon = taxaStore.taxa.find(t => t.taxon_id === taxonId)
        if (taxon) {
          taxon.is_extinct = extinct ? 1 : 0
        }
      }
      
      const count = taxonIds.length
      const action = extinct ? 'marked as extinct' : 'marked as living'
      displayNotification(`Successfully ${action} ${count} taxa`)
    } else {
      throw new Error(responseData.errors?.[0] || 'Update failed')
    }
  } catch (error) {
    console.error('Error updating extinct status:', error)
    displayNotification(
      error.response?.data?.message || 'Failed to update taxa status',
      'error'
    )
  }
}

async function canEditTaxon(taxon) {
  // Return cached result if available
  if (accessCache.value.has(taxon.taxon_id)) {
    return accessCache.value.get(taxon.taxon_id)
  }

  try {
    const accessResult = await AccessControlService.canEditEntity({
      entityType: EntityType.TAXON,
      projectId,
      entity: taxon,
    })
    
    const canEdit = accessResult.canEdit
    accessCache.value.set(taxon.taxon_id, canEdit)
    return canEdit
  } catch (error) {
    console.error('Error checking taxon access:', error)
    // Default to false for safety
    accessCache.value.set(taxon.taxon_id, false)
    return false
  }
}


</script>

<template>
  <LoadingIndicator :isLoaded="isLoaded">
    <RouterLink
      :to="`/myprojects/${projectId}/taxa`"
      class="mb-3 d-inline-block"
    >
      <i class="fa fa-arrow-left"></i>
      Back to Taxa
    </RouterLink>
    <div class="extinct-taxa-editor">
      <header>
        <h2>Edit Extinct Taxa</h2>
        
        <p class="instructions">
            Drag taxa from one list to the other to add or remove them from the extinct species. Taxa that are grayed out cannot be edited because you do not have permission to do so.
        </p>
      </header>


      <!-- Main editor interface -->
      <div class="taxa-editor-container">
        <!-- Living Taxa -->
        <div class="taxa-list-box">
          <div class="box-title">
            Living Taxa ({{ livingTaxa.length }})
          </div>
          <ol 
            class="taxa-list"
            @dragover="onDragOver"
            @drop="onDrop($event, false)"
          >
            <li
              v-for="taxon in livingTaxa"
              :key="taxon.taxon_id"
              :class="[
                'taxon-item',
                { 
                  'disabled': !taxon.canEdit,
                  'grouped': selectedLiving.has(taxon.taxon_id)
                }
              ]"
              :draggable="taxon.canEdit"
              @click="handleItemClick(taxon.taxon_id, false)"
              @click.shift="handleShiftClick(taxon.taxon_id, false, $event)"
              @dragstart="onDragStart($event, taxon.taxon_id, false)"
              @dragend="onDragEnd"
            >
              {{ getTaxonName(taxon) }}
            </li>
          </ol>
        </div>

        <!-- Extinct Taxa -->
        <div class="taxa-list-box">
          <div class="box-title">
            Extinct Taxa ({{ extinctTaxa.length }})
          </div>
          <ol 
            class="taxa-list"
            @dragover="onDragOver"
            @drop="onDrop($event, true)"
          >
            <li
              v-for="taxon in extinctTaxa"
              :key="taxon.taxon_id"
              :class="[
                'taxon-item',
                { 
                  'disabled': !taxon.canEdit,
                  'grouped': selectedExtinct.has(taxon.taxon_id)
                }
              ]"
              :draggable="taxon.canEdit"
              @click="handleItemClick(taxon.taxon_id, true)"
              @click.shift="handleShiftClick(taxon.taxon_id, true, $event)"
              @dragstart="onDragStart($event, taxon.taxon_id, true)"
              @dragend="onDragEnd"
            >
              {{ getTaxonName(taxon) }}
            </li>
          </ol>
        </div>
      </div>
    </div>
  </LoadingIndicator>
</template>

<style scoped>
.extinct-taxa-editor {
  padding: 20px;
}

.instructions {
  color: #666;
  margin-bottom: 20px;
  font-style: italic;
}


.taxa-editor-container {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.taxa-list-box {
  width: 400px;
  padding: 5px;
  border: double #e67a28;
  min-height: 150px;
  margin: 0px;
}

.box-title {
  padding: 5px;
  font-size: 16px;
  background-color: #e67a28;
  color: #FFF;
  margin: 0px 0px 5px 0px;
  text-align: center;
  font-weight: bold;
}

.taxa-list {
  width: 400px;
  height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  user-select: none;
  margin: 0;
  padding: 0;
  list-style: none;
}

.taxon-item {
  list-style: none;
  border: 1px solid #CCC;
  background: #F6F6F6;
  color: #1C94C4;
  margin: 5px;
  padding: 5px;
  height: auto;
  min-height: 22px;
  width: 370px;
  cursor: pointer;
  transition: all 0.2s ease;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.3;
}

.taxon-item:hover:not(.disabled) {
  background: #E8F4FD;
  transform: translateY(-1px);
}

.taxon-item.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.taxon-item.grouped {
  background: #FFE000;
  color: #000;
}

.taxon-item[draggable="true"] {
  cursor: move;
}

.taxon-item:active {
  transform: scale(0.98);
}

/* Drag states */
.taxa-list {
  transition: background-color 0.2s ease;
}

.taxa-list:hover {
  background-color: rgba(230, 122, 40, 0.1);
}
</style> 