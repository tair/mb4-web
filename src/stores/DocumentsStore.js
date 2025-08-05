import axios from 'axios'
import { defineStore } from 'pinia'

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
      
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/documents`
      const response = await axios.get(url)
      this.documents = response.data.documents
      this.folders = response.data.folders
      this.isLoaded = true
    },
    
    // Method to force refresh documents
    async refreshDocuments(projectId) {
      return this.fetchDocuments(projectId, true)
    },
    async create(projectId, documentFormData) {
      try {
        const url = `${
          import.meta.env.VITE_API_URL
        }/projects/${projectId}/documents/create`
        const response = await axios.post(url, documentFormData)
        
        if (response.status == 200) {
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
        const url = `${
          import.meta.env.VITE_API_URL
        }/projects/${projectId}/documents/${documentId}/edit`
        const response = await axios.post(url, documentFormData)
        
        if (response.status == 200) {
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
        const url = `${
          import.meta.env.VITE_API_URL
        }/projects/${projectId}/documents/delete`
        const response = await axios.post(url, {
          document_ids: documentIds,
        })
        
        if (response.status == 200) {
          // Invalidate cache so next list view shows fresh data
          this.isLoaded = false
          
          // Check for S3 cleanup warnings
          const result = { success: true }
          if (response.data.warnings) {
            result.warnings = response.data.warnings
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
        const url = `${
          import.meta.env.VITE_API_URL
        }/projects/${projectId}/documents/folder/${folderId}/delete`
        const response = await axios.post(url)
        
        if (response.status == 200) {
          // Invalidate cache so next list view shows fresh data
          this.isLoaded = false
          
          // Check for S3 cleanup warnings
          const result = { success: true }
          if (response.data.warnings) {
            result.warnings = response.data.warnings
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
