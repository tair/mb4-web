import { useTaxaStore } from '@/stores/TaxaStore.js'
import { useSpecimensStore } from '@/stores/SpecimensStore.js'
import { useMediaStore } from '@/stores/MediaStore.js'
import { useBibliographiesStore } from '@/stores/BibliographiesStore.js'
import { useDocumentsStore } from '@/stores/DocumentsStore.js'
import { createEntityEditGuard, EntityType } from './access-control.js'

/**
 * Entity loaders for different types
 */

/**
 * Load a taxon by ID
 */
async function loadTaxon({ projectId, entityId }) {
  const taxaStore = useTaxaStore()

  // Ensure taxa are loaded for this project
  if (!taxaStore.isLoaded) {
    await taxaStore.fetch(projectId)
  }

  return taxaStore.getTaxonById(entityId)
}

/**
 * Load a specimen by ID
 */
async function loadSpecimen({ projectId, entityId }) {
  const specimensStore = useSpecimensStore()

  // Ensure specimens are loaded for this project
  if (!specimensStore.isLoaded) {
    await specimensStore.fetchSpecimens(projectId)
  }

  return specimensStore.getSpecimenById(entityId)
}

/**
 * Load a media item by ID
 */
async function loadMedia({ projectId, entityId }) {
  const mediaStore = useMediaStore()

  // Ensure media is loaded for this project
  if (!mediaStore.isLoaded) {
    await mediaStore.fetchMedia(projectId)
  }

  return mediaStore.getMediaById(entityId)
}

/**
 * Load a bibliographic reference by ID
 */
async function loadBibliographicReference({ projectId, entityId }) {
  const bibliographiesStore = useBibliographiesStore()

  // Ensure bibliographies are loaded for this project
  if (!bibliographiesStore.isLoaded) {
    await bibliographiesStore.fetchBibliographies(projectId)
  }

  return bibliographiesStore.getReferenceById(entityId)
}

/**
 * Load a document by ID
 */
async function loadDocument({ projectId, entityId }) {
  const documentsStore = useDocumentsStore()

  // Ensure documents are loaded for this project
  if (!documentsStore.isLoaded) {
    await documentsStore.fetchDocuments(projectId)
  }

  return documentsStore.getDocumentById(entityId)
}

/**
 * Load a document folder by ID
 */
async function loadDocumentFolder({ projectId, entityId }) {
  const documentsStore = useDocumentsStore()

  // Ensure documents are loaded for this project
  if (!documentsStore.isLoaded) {
    await documentsStore.fetchDocuments(projectId)
  }

  return documentsStore.getFolderById(entityId)
}

/**
 * Pre-configured route guards for different entity types
 */

/**
 * Route guard for taxon edit access
 */
export const requireTaxonEditAccess = createEntityEditGuard(
  EntityType.TAXON,
  loadTaxon
)

/**
 * Route guard for specimen edit access
 */
export const requireSpecimenEditAccess = createEntityEditGuard(
  EntityType.SPECIMEN,
  loadSpecimen
)

/**
 * Route guard for media edit access
 */
export const requireMediaEditAccess = createEntityEditGuard(
  EntityType.MEDIA,
  loadMedia
)

/**
 * Route guard for bibliographic reference edit access
 */
export const requireBibliographyEditAccess = createEntityEditGuard(
  EntityType.BIBLIOGRAPHIC_REFERENCE,
  loadBibliographicReference
)

/**
 * Route guard for document edit access
 */
export const requireDocumentEditAccess = createEntityEditGuard(
  EntityType.PROJECT_DOCUMENT,
  loadDocument
)

/**
 * Route guard for document folder edit access
 */
export const requireDocumentFolderEditAccess = createEntityEditGuard(
  EntityType.PROJECT_DOCUMENT_FOLDER,
  loadDocumentFolder
)

/**
 * Helper function to create guards for other entity types
 *
 * @param {string} entityType - Entity type from EntityType enum
 * @param {function} loader - Function to load the entity
 * @returns {function} Router guard function
 */
export function createGuardFor(entityType, loader) {
  return createEntityEditGuard(entityType, loader)
}
