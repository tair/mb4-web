import { defineStore } from 'pinia'

export const useFileTransferStore = defineStore({
  id: 'fileTransfer',
  state: () => ({
    mergeFile: null,
    mergeMetadata: null,
  }),
  actions: {
    setMergeFile(file, metadata = {}) {
      this.mergeFile = file
      this.mergeMetadata = metadata
    },

    getMergeFile() {
      return this.mergeFile
    },

    getMergeMetadata() {
      return this.mergeMetadata
    },

    clearMergeFile() {
      this.mergeFile = null
      this.mergeMetadata = null
    },
  },
})
