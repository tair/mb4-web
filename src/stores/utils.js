import { useBibliographiesStore } from '@/stores/BibliographiesStore'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useFoliosStore } from '@/stores/FoliosStore'
import { useFolioMediaStore } from '@/stores/FolioMediaStore'
import { useMatricesStore } from '@/stores/MatricesStore'
import { useMediaStore } from '@/stores/MediaStore'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore'
import { useSpecimenCitationsStore } from '@/stores/SpecimenCitationsStore'
import { useSpecimensStore } from '@/stores/SpecimensStore'
import { useTaxaCitationsStore } from '@/stores/TaxaCitationsStore'
import { useTaxaStore } from '@/stores/TaxaStore'
import { useMediaViewsStore } from '@/stores/MediaViewsStore'

export function invalidateAll() {
  const bibliographiesStore = useBibliographiesStore()
  const documentsStore = useDocumentsStore()
  const foliosStore = useFoliosStore()
  const folioMediaStore = useFolioMediaStore()
  const matricesStore = useMatricesStore()
  const mediaStore = useMediaStore()
  const mediaViewsStore = useMediaViewsStore()
  const projectUsersStore = useProjectUsersStore()
  const specimenCitationsStore = useSpecimenCitationsStore()
  const specimensStore = useSpecimensStore()
  const taxaCitationStore = useTaxaCitationsStore()
  const taxaStore = useTaxaStore()

  bibliographiesStore.invalidate()
  documentsStore.invalidate()
  foliosStore.invalidate()
  folioMediaStore.invalidate()
  matricesStore.invalidate()
  mediaStore.invalidate()
  mediaViewsStore.invalidate()
  projectUsersStore.invalidate()
  specimenCitationsStore.invalidate()
  specimensStore.invalidate()
  taxaCitationStore.invalidate()
  taxaStore.invalidate()
}
