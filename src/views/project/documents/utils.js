import { useDocumentsStore } from '@/stores/DocumentsStore'

export function getFolderNames() {
  const documentsStore = useDocumentsStore()
  const folderNames = {
    NONE: 0,
  }

  for (const folder of documentsStore.folders) {
    folderNames[folder.title] = folder.folder_id
  }

  return folderNames
}
