import { useTaxaStore } from '@/stores/TaxaStore.js'
import { useSpecimensStore } from '@/stores/SpecimensStore.js'
import { useMediaStore } from '@/stores/MediaStore.js'
import { useMediaViewsStore } from '@/stores/MediaViewsStore.js'
import { useBibliographiesStore } from '@/stores/BibliographiesStore.js'
import { useDocumentsStore } from '@/stores/DocumentsStore.js'
import { useFoliosStore } from '@/stores/FoliosStore.js'
import { useAuthStore } from '@/stores/AuthStore.js'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore.js'
import {
  createEntityEditGuard,
  EntityType,
  AccessControlService,
} from './access-control.js'

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
 * Load a media view by ID
 */
async function loadMediaView({ projectId, entityId }) {
  const mediaViewsStore = useMediaViewsStore()

  if (!mediaViewsStore.isLoaded) {
    await mediaViewsStore.fetchMediaViews(projectId)
  }

  return mediaViewsStore.getMediaViewById(entityId)
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
 * Load a folio by ID
 */
async function loadFolio({ projectId, entityId }) {
  const foliosStore = useFoliosStore()

  if (!foliosStore.isLoaded) {
    await foliosStore.fetch(projectId)
  }

  return foliosStore.getFolioById(entityId)
}

/**
 * Load a matrix by ID
 */
async function loadMatrix({ projectId, entityId }) {
  const { useMatricesStore } = await import('@/stores/MatricesStore.js')
  const matricesStore = useMatricesStore()

  if (!matricesStore.isLoaded) {
    await matricesStore.fetchMatricesByProjectId(projectId)
  }

  const list = matricesStore.matrices || []
  return Array.isArray(list)
    ? list.find((m) => parseInt(m.matrix_id) === parseInt(entityId))
    : null
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
 * Note: Allows observers/anonymous viewers to access in read-only mode
 */
export const requireMediaEditAccess = createViewAccessGuard(
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
 * Route guard for media view edit access
 */
// Replaced below with cancel-on-deny variant

/**
 * Route guard for folio edit access
 */
export const requireFolioEditAccess = createEntityEditGuard(
  EntityType.FOLIO,
  loadFolio
)

/**
 * Route guard for matrix edit access
 */
// Replaced below with cancel-on-deny variant

/**
 * Factory for create access guard per entity type
 */
export function createEntityCreateGuard(entityType) {
  return async (to, from, next) => {
    try {
      const projectId = parseInt(to.params.id || to.params.projectId)
      if (!projectId) {
        next({ name: 'NotFoundView', query: { message: 'Invalid project' } })
        return
      }

      const result = await AccessControlService.canCreateEntity({
        entityType,
        projectId,
      })

      if (!result.canCreate) {
        // Redirect to the module list view with error message
        const listViewRouteMap = {
          [EntityType.TAXON]: 'MyProjectTaxaView',
          [EntityType.SPECIMEN]: 'MyProjectSpecimensListView',
          [EntityType.MEDIA]: 'MyProjectMediaView',
          [EntityType.MEDIA_VIEW]: 'MyProjectMediaViewsView',
          [EntityType.PROJECT_DOCUMENT]: 'MyProjectDocumentsView',
          [EntityType.PROJECT_DOCUMENT_FOLDER]: 'MyProjectDocumentsView',
          [EntityType.BIBLIOGRAPHIC_REFERENCE]: 'MyProjectBibliographyListView',
          [EntityType.FOLIO]: 'MyProjectFoliosView',
          [EntityType.MATRIX]: 'MyProjectMatrixView',
        }

        const listViewName = listViewRouteMap[entityType] || 'NotFoundView'
        if (listViewName === 'NotFoundView') {
          next({
            name: 'NotFoundView',
            query: {
              message:
                result.reason || 'You do not have permission to create here.',
            },
          })
          return
        }
        next({
          name: listViewName,
          params: { id: projectId },
          query: {
            error: result.reason || 'You do not have permission to create here.',
          },
        })
        return
      }

      next()
    } catch (error) {
      console.error('Create access control guard error:', error)
      next({ name: 'NotFoundView', query: { message: 'Error checking permissions' } })
    }
  }
}

/**
 * Guard wrapper that cancels navigation and shows toast on access denial for entity edit pages.
 * Uses the existing createEntityEditGuard under the hood but overrides redirect behavior.
 */
function createCancelOnDenyGuard(entityType, entityLoader) {
  return async (to, from, next) => {
    try {
      const projectId = parseInt(to.params.id || to.params.projectId)
      const entityIdParam =
        to.params.taxonId ||
        to.params.specimenId ||
        to.params.mediaId ||
        to.params.documentId ||
        to.params.folderId ||
        to.params.referenceId ||
        to.params.folioId ||
        to.params.entityId ||
        to.params.viewId ||
        to.params.matrixId
      const entityId = parseInt(entityIdParam)

      if (!projectId || !entityId) {
        next(false)
        return
      }

      const entity = await entityLoader({ projectId, entityId, route: to })
      if (!entity) {
        next(false)
        return
      }

      const accessResult = await AccessControlService.canEditEntity({
        entityType,
        projectId,
        entity,
      })

      if (accessResult.shouldRedirect) {
        try {
          const { useNotifications } = await import('@/composables/useNotifications.ts')
          const { showError } = useNotifications()
          const msg =
            accessResult.reason ||
            `You do not have permission to access this ${entityType.toLowerCase()}`
          showError(msg, 'Permission Denied')
        } catch (e) {}
        next(false)
        return
      }

      next()
    } catch (error) {
      console.error('Cancel-on-deny guard error:', error)
      next(false)
    }
  }
}

// Export cancel-on-deny variants for modules that should not navigate on denial
export const requireMediaViewEditAccess = createCancelOnDenyGuard(
  EntityType.MEDIA_VIEW,
  loadMediaView
)

export const requireMatrixEditAccess = createCancelOnDenyGuard(
  EntityType.MATRIX,
  loadMatrix
)

/**
 * Require the current user to be a Project Administrator for the project id in the route.
 * System curators and admins are also allowed.
 */
export async function requireProjectAdmin(to, from, next) {
  try {
    const authStore = useAuthStore()
    if (!authStore.user?.userId) {
      next({ name: 'UserLogin' })
      return
    }

    // Allow curators and system administrators
    if (authStore.isUserCurator || authStore.isUserAdministrator) {
      next()
      return
    }

    const projectId = parseInt(to.params.id || to.params.projectId)
    if (!projectId) {
      next({ name: 'NotFoundView', query: { message: 'Invalid project' } })
      return
    }

    const projectUsersStore = useProjectUsersStore()
    if (!projectUsersStore.isLoaded) {
      await projectUsersStore.fetchUsers(projectId)
    }

    const membership = projectUsersStore.getUserById(authStore.user.userId)
    if (membership?.admin === true) {
      next()
      return
    }

    // Not a project admin - redirect back to overview with error
    next({
      name: 'MyProjectOverviewView',
      params: { id: projectId },
      query: {
        error: 'Only project administrators can perform this action.',
      },
    })
  } catch (error) {
    console.error('Project admin guard error:', error)
    next({ name: 'NotFoundView', query: { message: 'Error checking permissions' } })
  }
}

/**
 * Factory for view access guard - allows anyone with project access to view the page
 * The component itself will handle read-only mode via AccessControlService
 * This is useful for pages like media edit where observers should see the page but not edit
 */
export function createViewAccessGuard(entityType, entityLoader) {
  return async (to, from, next) => {
    try {
      const projectId = parseInt(to.params.id || to.params.projectId)
      const entityIdParam =
        to.params.taxonId ||
        to.params.specimenId ||
        to.params.mediaId ||
        to.params.documentId ||
        to.params.folderId ||
        to.params.referenceId ||
        to.params.folioId ||
        to.params.entityId ||
        to.params.viewId
      const entityId = parseInt(entityIdParam)

      if (!projectId || !entityId) {
        next({
          name: 'NotFoundView',
          query: { message: 'Invalid project or entity ID' },
        })
        return
      }

      // Load the entity to ensure it exists
      const entity = await entityLoader({ projectId, entityId, route: to })
      if (!entity) {
        next({
          name: 'NotFoundView',
          query: {
            message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found`,
          },
        })
        return
      }

      // Check if user has any project access (including observers/anonymous reviewers)
      const authStore = useAuthStore()
      const projectUsersStore = useProjectUsersStore()
      
      const currentUserId = authStore.user?.userId
      if (!currentUserId) {
        next({ name: 'UserLogin' })
        return
      }

      // Ensure project users are loaded
      if (!projectUsersStore.isLoaded) {
        await projectUsersStore.fetchUsers(projectId)
      }

      // Check if user is system admin/curator (can access everything)
      if (authStore.isUserAdministrator || authStore.isUserCurator) {
        next()
        return
      }

      // Check if user is anonymous reviewer for this project
      if (authStore.isAnonymousReviewer) {
        const anonymousProjectId = authStore.getAnonymousProjectId
        if (parseInt(anonymousProjectId) === projectId) {
          next()
          return
        } else {
          next({
            name: 'NotFoundView',
            query: { message: 'You do not have access to this project' },
          })
          return
        }
      }

      // Check if user is a project member (any membership type including observer)
      const userMembership = projectUsersStore.getUserById(currentUserId)
      if (userMembership) {
        // Allow access - the component will handle read-only mode
        next()
        return
      }

      // User is not a member of this project
      next({
        name: 'NotFoundView',
        query: { message: 'You do not have access to this project' },
      })
    } catch (error) {
      console.error('View access guard error:', error)
      next({
        name: 'NotFoundView',
        query: { message: 'Error checking permissions' },
      })
    }
  }
}

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
