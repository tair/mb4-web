import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useCharactersStore } from './CharactersStore'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useFoliosStore } from '@/stores/FoliosStore'
import { useFolioMediaStore } from '@/stores/FolioMediaStore'
import { useMatricesStore } from '@/stores/MatricesStore'
import { useMediaCitationsStore } from './MediaCitationsStore'
import { useMediaStore } from '@/stores/MediaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimenCitationsStore } from '@/stores/SpecimenCitationsStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaCitationsStore } from '@/stores/TaxaCitationsStore'
import { useTaxaStore } from '@/stores/TaxaStore'

// Track the current project ID to avoid unnecessary invalidation
let currentProjectId = null

export function invalidateAll() {
  const bibliographiesStore = useBibliographiesStore()
  const characterStore = useCharactersStore()
  const documentsStore = useDocumentsStore()
  const foliosStore = useFoliosStore()
  const folioMediaStore = useFolioMediaStore()
  const matricesStore = useMatricesStore()
  const mediaStore = useMediaStore()
  const mediaCitationStore = useMediaCitationsStore()
  const mediaViewsStore = useMediaViewsStore()
  const projectUsersStore = useProjectUsersStore()
  const specimenCitationsStore = useSpecimenCitationsStore()
  const specimensStore = useSpecimensStore()
  const taxaCitationStore = useTaxaCitationsStore()
  const taxaStore = useTaxaStore()

  bibliographiesStore.invalidate()
  characterStore.invalidate()
  documentsStore.invalidate()
  foliosStore.invalidate()
  folioMediaStore.invalidate()
  matricesStore.invalidate()
  mediaStore.invalidate()
  mediaCitationStore.invalidate()
  mediaViewsStore.invalidate()
  projectUsersStore.invalidate()
  specimenCitationsStore.invalidate()
  specimensStore.invalidate()
  taxaCitationStore.invalidate()
  taxaStore.invalidate()
}

// Smart invalidation that only clears stores when switching projects
export function invalidateOnProjectChange(to, from, next) {
  const newProjectId = to.params.id
  
  // Only invalidate if we're switching to a different project
  if (currentProjectId !== null && currentProjectId !== newProjectId) {
    invalidateAll()
  } else if (currentProjectId === null) {
    invalidateAll()
  }
  
  currentProjectId = newProjectId
  next()
}
