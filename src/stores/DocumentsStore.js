import { defineStore } from 'pinia'
import { apiService } from '@/services/apiService.js'

export const useDocumentsStore = defineStore({
  id: 'documents',
  state: () => ({
    isLoaded: false,
    documents: [],
    folders: [],
  }),
  getters: {
    uncategorizedDocuments() {
      return this.getDocumentsForFolder(null)
    },
  },
  actions: {
    async fetchDocuments(projectId, forceRefresh = false) {
      // If force refresh is requested, reset the loaded state
      if (forceRefresh) {
        this.isLoaded = false
      }
      
      const response = await apiService.get(`/projects/${projectId}/documents`)
      const responseData = await response.json()
      this.documents = responseData.documents
      this.folders = responseData.folders
      this.isLoaded = true
    },
    
    // Method to force refresh documents
    async refreshDocuments(projectId) {
      return this.fetchDocuments(projectId, true)
    },
    async create(projectId, documentFormData) {
      try {
        const response = await apiService.post(`/projects/${projectId}/documents/create`, documentFormData)
        
        if (response.ok) {
          // Invalidate cache so next list view shows fresh data
          this.isLoaded = false
          return { success: true }
        }
        return { success: false, error: 'Unexpected response status' }
      } catch (error) {
        console.error('Error creating document:', error)
        // Prioritize the specific error field over the generic message field
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create document'
        return { success: false, error: errorMessage }
      }
    },
    async edit(projectId, documentId, documentFormData) {
      try {
        const response = await apiService.post(`/projects/${projectId}/documents/${documentId}/edit`, documentFormData)
        
        if (response.ok) {
          // Invalidate cache so next list view shows fresh data
          this.isLoaded = false
          return { success: true }
        }
        return { success: false, error: 'Unexpected response status' }
      } catch (error) {
        console.error('Error editing document:', error)
        // Prioritize the specific error field over the generic message field
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to edit document'
        return { success: false, error: errorMessage }
      }
    },
    async deleteDocuments(projectId, documentIds) {
      try {
        const response = await apiService.post(`/projects/${projectId}/documents/delete`, {
          document_ids: documentIds,
        })
        
        if (response.ok) {
          // Invalidate cache so next list view shows fresh data
          this.isLoaded = false
          
          // Check for S3 cleanup warnings
          const result = { success: true }
          const responseData = await response.json()
          if (responseData.warnings) {
            result.warnings = responseData.warnings
          }
          return result
        }
        return { success: false, error: 'Unexpected response status' }
      } catch (error) {
        console.error('Error deleting documents:', error)
        // Prioritize the specific error field over the generic message field
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete documents'
        return { success: false, error: errorMessage }
      }
    },
    async deleteFolder(projectId, folderId) {
      try {
        const response = await apiService.post(`/projects/${projectId}/documents/folder/${folderId}/delete`)
        
        if (response.ok) {
          // Invalidate cache so next list view shows fresh data
          this.isLoaded = false
          
          // Check for S3 cleanup warnings
          const result = { success: true }
          const responseData = await response.json()
          if (responseData.warnings) {
            result.warnings = responseData.warnings
          }
          return result
        }
        return { success: false, error: 'Unexpected response status' }
      } catch (error) {
        console.error('Error deleting folder:', error)
        // Prioritize the specific error field over the generic message field
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete folder'
        return { success: false, error: errorMessage }
      }
    },
    getDocumentById(documentId) {
      for (const document of this.documents) {
        if (document.document_id == documentId) {
          return document
        }
      }
      return null
    },
    getDocumentsForFolder(folderId) {
      const documents = []
      for (const document of this.documents) {
        if (document.folder_id == folderId) {
          documents.push(document)
        }
      }
      return documents
    },
    removeDocumentById(documentIds) {
      for (let x = 0; x < this.documents.length; ++x) {
        if (documentIds.includes(this.documents[x].document_id)) {
          this.documents.splice(x, 1)
          break
        }
      }
    },
    removeFolderById(folderId) {
      for (let x = 0; x < this.folders.length; ++x) {
        const folder = this.folders[x]
        if (folder.folder_id == folderId) {
          this.folders.splice(x, 1)
          break
        }
      }
    },
    getFolderById(folderId) {
      for (const folder of this.folders) {
        if (folder.folder_id == folderId) {
          return folder
        }
      }
      return null
    },
    invalidate() {
      this.documents = []
      this.folders = []
      this.isLoaded = false
    },
  },
})
