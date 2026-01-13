<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { apiService } from '@/services/apiService.js'

const props = defineProps({
  mediaId: {
    type: [Number, String],
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:documentId', 'document-linked', 'document-unlinked'])

const route = useRoute()
const projectId = computed(() => route.params.id)
const documentsStore = useDocumentsStore()

// State
const isLoading = ref(false)
const selectedDocumentId = ref(null)
const linkedDocument = ref(null)
const showSelector = ref(false)
const error = ref(null)

// Computed
const availableDocuments = computed(() => {
  return documentsStore.documents || []
})

const hasDocuments = computed(() => {
  return availableDocuments.value.length > 0
})

const selectedDocument = computed(() => {
  if (!selectedDocumentId.value) return null
  return documentsStore.getDocumentById(selectedDocumentId.value)
})

// Fetch linked document on mount
async function fetchLinkedDocument() {
  if (!props.mediaId) return
  
  isLoading.value = true
  error.value = null
  
  try {
    const response = await apiService.get(
      `/projects/${projectId.value}/media/${props.mediaId}/document`
    )
    const data = await response.json()
    
    if (data.document) {
      linkedDocument.value = data.document
      selectedDocumentId.value = data.document.document_id
      emit('update:documentId', data.document.document_id)
    } else {
      linkedDocument.value = null
      selectedDocumentId.value = null
      emit('update:documentId', null)
    }
  } catch (err) {
    console.error('Error fetching linked document:', err)
    error.value = 'Failed to load linked document'
  } finally {
    isLoading.value = false
  }
}

// Link document to media
async function linkDocument() {
  if (!selectedDocumentId.value || !props.mediaId) return
  
  isLoading.value = true
  error.value = null
  
  try {
    const response = await apiService.post(
      `/projects/${projectId.value}/media/${props.mediaId}/document`,
      { document_id: selectedDocumentId.value }
    )
    const data = await response.json()
    
    if (data.document) {
      linkedDocument.value = data.document
      emit('update:documentId', data.document.document_id)
      emit('document-linked', data.document)
      showSelector.value = false
    }
  } catch (err) {
    console.error('Error linking document:', err)
    error.value = 'Failed to link document'
  } finally {
    isLoading.value = false
  }
}

// Remove document link
async function unlinkDocument() {
  if (!props.mediaId) return
  
  isLoading.value = true
  error.value = null
  
  try {
    await apiService.delete(
      `/projects/${projectId.value}/media/${props.mediaId}/document`
    )
    
    const oldDocument = linkedDocument.value
    linkedDocument.value = null
    selectedDocumentId.value = null
    emit('update:documentId', null)
    emit('document-unlinked', oldDocument)
  } catch (err) {
    console.error('Error unlinking document:', err)
    error.value = 'Failed to remove document link'
  } finally {
    isLoading.value = false
  }
}

// Toggle selector visibility
function toggleSelector() {
  showSelector.value = !showSelector.value
  if (showSelector.value && !documentsStore.isLoaded) {
    documentsStore.fetchDocuments(projectId.value)
  }
}

// Cancel selection
function cancelSelection() {
  showSelector.value = false
  selectedDocumentId.value = linkedDocument.value?.document_id || null
}

// Watch for mediaId changes
watch(() => props.mediaId, (newId) => {
  if (newId) {
    fetchLinkedDocument()
  }
})

onMounted(() => {
  // Fetch linked document if mediaId is available
  if (props.mediaId) {
    fetchLinkedDocument()
  }
  
  // Ensure documents are loaded
  if (!documentsStore.isLoaded && projectId.value) {
    documentsStore.fetchDocuments(projectId.value)
  }
})
</script>

<template>
  <div class="copyright-document-selector">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <i class="fa fa-spinner fa-spin me-2"></i>
      Loading...
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger py-2">
      <i class="fa-solid fa-exclamation-circle me-2"></i>
      {{ error }}
      <button type="button" class="btn-close btn-sm ms-2" @click="error = null"></button>
    </div>
    
    <!-- Linked document display -->
    <div v-else-if="linkedDocument && !showSelector" class="linked-document">
      <div class="document-info">
        <i class="fa-solid fa-file-alt me-2 text-muted"></i>
        <span class="document-title">{{ linkedDocument.title || linkedDocument.filename }}</span>
        <span v-if="linkedDocument.description" class="document-description text-muted ms-2">
          - {{ linkedDocument.description }}
        </span>
      </div>
      <div class="document-actions mt-2" v-if="!disabled">
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary me-2"
          @click="toggleSelector"
          title="Change document"
        >
          <i class="fa-solid fa-exchange-alt me-1"></i>
          Change
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-danger"
          @click="unlinkDocument"
          title="Remove document link"
        >
          <i class="fa-solid fa-unlink me-1"></i>
          Remove
        </button>
      </div>
    </div>
    
    <!-- Document selector -->
    <div v-else-if="showSelector || !linkedDocument" class="document-selector">
      <div v-if="!hasDocuments" class="alert alert-info py-2 mb-2">
        <i class="fa-solid fa-info-circle me-2"></i>
        No documents in this project. 
        <RouterLink :to="`/myprojects/${projectId}/documents/create`" class="alert-link">
          Upload a document
        </RouterLink> 
        first.
      </div>
      
      <div v-else>
        <select
          class="form-select mb-2"
          v-model="selectedDocumentId"
          :disabled="disabled"
        >
          <option :value="null">-- Select a document --</option>
          <option
            v-for="doc in availableDocuments"
            :key="doc.document_id"
            :value="doc.document_id"
          >
            {{ doc.title || doc.filename }}
            <template v-if="doc.description"> - {{ doc.description }}</template>
          </option>
        </select>
        
        <div class="selector-actions">
          <button
            type="button"
            class="btn btn-sm btn-primary me-2"
            :disabled="!selectedDocumentId || disabled || isLoading"
            @click="linkDocument"
          >
            <i class="fa-solid fa-link me-1"></i>
            Link Document
          </button>
          <button
            v-if="linkedDocument"
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="cancelSelection"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <small class="text-muted d-block mt-2">
        <i class="fa-solid fa-info-circle me-1"></i>
        Attach a document such as a permission letter or signed agreement to prove 
        copyright permission was granted.
      </small>
    </div>
  </div>
</template>

<style scoped>
.copyright-document-selector {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.loading-state {
  color: #6c757d;
  font-style: italic;
}

.linked-document {
  padding: 0.5rem 0;
}

.document-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.document-title {
  font-weight: 500;
}

.document-description {
  font-size: 0.875rem;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
}

.selector-actions {
  display: flex;
  gap: 0.5rem;
}
</style>

