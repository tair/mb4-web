import axios from 'axios'
import { defineStore } from 'pinia'

export const useDocumentsStore = defineStore({
  id: 'documents',
  state: () => ({
    isLoaded: false,
    documents: null,
    folders: null,
  }),
  getters: {
    uncategorizedDocuments() {
      return this.getDocumentsForFolder(null)
    },
  },
  actions: {
    async fetchDocuments(projectId) {
      const url = `${
        import.meta.env.VITE_API_URL
      }/projects/${projectId}/documents`
      const response = await axios.get(url)
      this.documents = response.data.documents
      this.folders = response.data.folders
      this.isLoaded = true
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
      this.documents = null
      this.folders = null
      this.isLoaded = false
    },
  },
})