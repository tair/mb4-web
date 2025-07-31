import { useAuthStore } from '@/stores/AuthStore.js'
import { useProjectUsersStore } from '@/stores/ProjectUsersStore.js'

/**
 * Membership types in projects
 */
export const MembershipType = {
  ADMIN: 0, // Full membership (can edit everything)
  OBSERVER: 1, // Observer (cannot edit)
  CHARACTER_ANNOTATOR: 2, // Character annotator (can edit everything but characters and states)
  BIBLIOGRAPHY_MAINTAINER: 3, // Bibliography maintainer (can edit bibliography only)
}

/**
 * Item access levels
 */
export const AccessLevel = {
  PROJECT_EDITABLE: 0, // Anyone in project with proper permissions may edit
  OWNER_ONLY: 1, // Only the owner may edit
}

/**
 * Entity types for access control
 */
export const EntityType = {
  TAXON: 'taxon',
  SPECIMEN: 'specimen',
  MEDIA: 'media',
  MEDIA_VIEW: 'media_view',
  MATRIX: 'matrix',
  BIBLIOGRAPHIC_REFERENCE: 'bibliographic_reference',
  PROJECT_DOCUMENT: 'project_document',
  PROJECT_DOCUMENT_FOLDER: 'project_document_folder',
  FOLIO: 'folio',
}

/**
 * Access control service for determining user permissions
 */
export class AccessControlService {
  /**
   * Check if user can edit a specific entity
   *
   * @param {Object} params - Parameters object
   * @param {string} params.entityType - Type of entity (from EntityType enum)
   * @param {number} params.projectId - ID of the project
   * @param {Object} params.entity - The entity object to check access for
   * @param {number} params.userId - ID of the current user (optional, will get from auth store)
   * @returns {Promise<{canEdit: boolean, shouldRedirect: boolean, reason?: string, level?: string}>}
   */
  static async canEditEntity({ entityType, projectId, entity, userId = null }) {
    const authStore = useAuthStore()
    const projectUsersStore = useProjectUsersStore()

    // Get current user ID
    const currentUserId = userId || authStore.user?.userId
    if (!currentUserId) {
      return {
        canEdit: false,
        shouldRedirect: true,
        reason: 'User not authenticated',
        level: 'authentication',
      }
    }

    // Wait for auth store to be properly loaded
    if (!authStore.user?.access) {
      authStore.fetchLocalStore()

      // If still no access data, user needs to re-authenticate
      if (!authStore.user?.access) {
        return {
          canEdit: false,
          shouldRedirect: true,
          reason: 'User authentication data incomplete',
          level: 'authentication',
        }
      }
    }

    // Ensure project users are loaded
    if (!projectUsersStore.isLoaded) {
      await projectUsersStore.fetchUsers(projectId)
    }

    // Get user's project membership
    const userMembership = projectUsersStore.getUserById(currentUserId)

    // Check system-level permissions (highest priority)
    const systemAccess = this._checkSystemAccess(authStore)
    if (systemAccess.canEdit) {
      return systemAccess
    }

    // Check project-level permissions
    if (userMembership) {
      const projectAccess = this._checkProjectAccess(userMembership)
      if (projectAccess.canEdit) {
        return projectAccess
      }
    }

    // If not a project member, deny access
    if (!userMembership) {
      return {
        canEdit: false,
        shouldRedirect: true,
        reason: 'User is not a member of this project',
        level: 'project_membership',
      }
    }

    // Check membership type permissions for this entity type
    const membershipAccess = this._checkMembershipAccess(
      userMembership.membership_type,
      entityType
    )
    if (!membershipAccess.canEdit) {
      return membershipAccess
    }

    // Check item-level access restrictions
    const itemAccess = this._checkItemAccess(entity, currentUserId)
    return itemAccess
  }

  /**
   * Check system-level access (curators and system admins)
   * @private
   */
  static _checkSystemAccess(authStore) {
    if (authStore.isUserCurator) {
      return {
        canEdit: true,
        shouldRedirect: false,
        level: 'system_curator',
      }
    }

    if (authStore.isUserAdministrator) {
      return {
        canEdit: true,
        shouldRedirect: false,
        level: 'system_admin',
      }
    }

    return { canEdit: false }
  }

  /**
   * Check project-level access (project administrators)
   * @private
   */
  static _checkProjectAccess(userMembership) {
    if (userMembership.admin === true) {
      return {
        canEdit: true,
        shouldRedirect: false,
        level: 'project_admin',
      }
    }

    return { canEdit: false }
  }

  /**
   * Check membership type permissions for entity type
   * @private
   */
  static _checkMembershipAccess(membershipType, entityType) {
    switch (membershipType) {
      case MembershipType.ADMIN:
        // Full membership - can edit everything
        return { canEdit: true, shouldRedirect: false, level: 'full_member' }

      case MembershipType.OBSERVER:
        // Observer - cannot edit anything and should be redirected
        return {
          canEdit: false,
          shouldRedirect: false,
          reason: 'Observer members cannot edit any content',
          level: 'observer',
        }

      case MembershipType.CHARACTER_ANNOTATOR:
        // Character annotator - can edit everything except characters and states
        // Taxa, specimens, media, etc. are allowed
        if (
          entityType === EntityType.TAXON ||
          entityType === EntityType.SPECIMEN ||
          entityType === EntityType.MEDIA ||
          entityType === EntityType.MEDIA_VIEW ||
          entityType === EntityType.PROJECT_DOCUMENT ||
          entityType === EntityType.PROJECT_DOCUMENT_FOLDER ||
          entityType === EntityType.FOLIO
        ) {
          return {
            canEdit: true,
            shouldRedirect: false,
            level: 'character_annotator',
          }
        } else {
          return {
            canEdit: false,
            shouldRedirect: false, // Show read-only form with explanation
            reason: 'Character annotators cannot edit this type of content',
            level: 'character_annotator_restricted',
          }
        }

      case MembershipType.BIBLIOGRAPHY_MAINTAINER:
        // Bibliography maintainer - can only edit bibliography
        if (entityType === EntityType.BIBLIOGRAPHIC_REFERENCE) {
          return {
            canEdit: true,
            shouldRedirect: false,
            level: 'bibliography_maintainer',
          }
        } else {
          return {
            canEdit: false,
            shouldRedirect: false, // Show read-only form with explanation
            reason:
              'Bibliography maintainers can only edit bibliographic references',
            level: 'bibliography_maintainer_restricted',
          }
        }

      default:
        return {
          canEdit: false,
          shouldRedirect: true, // Unknown state - redirect for safety
          reason: 'Unknown membership type',
          level: 'unknown_membership',
        }
    }
  }

  /**
   * Check item-level access restrictions
   * @private
   */
  static _checkItemAccess(entity, currentUserId) {
    // If access field is not defined, default to project editable
    const accessLevel = entity?.access ?? AccessLevel.PROJECT_EDITABLE

    if (accessLevel === AccessLevel.OWNER_ONLY) {
      // Only owner can edit
      if (entity.user_id === currentUserId) {
        return {
          canEdit: true,
          shouldRedirect: false,
          level: 'item_owner',
        }
      } else {
        return {
          canEdit: false,
          shouldRedirect: false, // Show read-only form with owner restriction message
          reason: 'This item is restricted to owner-only editing',
          level: 'owner_restricted',
        }
      }
    } else {
      // Project editable - anyone with proper membership can edit
      return {
        canEdit: true,
        shouldRedirect: false,
        level: 'project_editable',
      }
    }
  }

  /**
   * Get restricted fields for an entity type based on user permissions
   *
   * @param {string} entityType - Type of entity
   * @param {Object} accessResult - Result from canEditEntity
   * @returns {string[]} Array of field names that should be restricted
   */
  static getRestrictedFields(entityType, accessResult) {
    const restrictedFields = []

    // Always restrict sensitive fields for non-admins/curators
    if (
      !['system_curator', 'system_admin', 'project_admin'].includes(
        accessResult.level
      )
    ) {
      restrictedFields.push('access', 'user_id')
    }

    // Add entity-specific restrictions if needed
    switch (entityType) {
      case EntityType.TAXON:
        // Taxonomy-specific restrictions could go here
        break
      case EntityType.SPECIMEN:
        // Specimen-specific restrictions could go here
        break
      // Add other entity types as needed
    }

    return restrictedFields
  }

  /**
   * Get user-friendly access message
   *
   * @param {Object} accessResult - Result from canEditEntity
   * @param {string} entityType - Type of entity
   * @returns {Object|null} Message object or null
   */
  static getAccessMessage(accessResult, entityType) {
    if (accessResult.canEdit) {
      // Informational messages for special cases
      if (accessResult.level === 'item_owner') {
        return {
          type: 'info',
          message: `This ${entityType} is restricted to owner-only editing. You can edit it because you are the owner.`,
        }
      }
      return null
    } else {
      // Error messages for various restriction types
      const entityName = entityType.replace('_', ' ')

      switch (accessResult.level) {
        case 'authentication':
          return {
            type: 'error',
            message: 'You must be logged in to edit content.',
          }
        case 'project_membership':
          return {
            type: 'error',
            message: 'You must be a member of this project to edit content.',
          }
        case 'observer':
          return {
            type: 'error',
            message:
              'You have Observer status and cannot edit any content in this project.',
          }
        case 'character_annotator_restricted':
          return {
            type: 'error',
            message:
              'You have Character Annotator status and cannot edit this type of content.',
          }
        case 'bibliography_maintainer_restricted':
          return {
            type: 'error',
            message:
              'You have Bibliography Maintainer status and can only edit bibliographic references.',
          }
        case 'owner_restricted':
          return {
            type: 'error',
            message: `This ${entityName} is restricted to owner-only editing. You do not have permission to modify it.`,
          }
        default:
          return {
            type: 'error',
            message: `You do not have permission to edit this ${entityName}.`,
          }
      }
    }
  }
}

/**
 * Vue Router guard factory for entity edit access control
 *
 * @param {string} entityType - Type of entity to check access for
 * @param {function} entityLoader - Function to load the entity (receives { projectId, entityId, route })
 * @returns {function} Vue Router guard function
 */
export function createEntityEditGuard(entityType, entityLoader) {
  return async (to, from, next) => {
    try {
      const projectId = parseInt(to.params.id)
      const entityIdParam =
        to.params.taxonId ||
        to.params.specimenId ||
        to.params.mediaId ||
        to.params.documentId ||
        to.params.folderId ||
        to.params.referenceId ||
        to.params.folioId ||
        to.params.entityId
      const entityId = parseInt(entityIdParam)

      if (!projectId || !entityId) {
        next({
          name: 'NotFoundView',
          query: { message: 'Invalid project or entity ID' },
        })
        return
      }

      // Load the entity
      const entity = await entityLoader({ projectId, entityId, route: to })
      if (!entity) {
        next({
          name: 'NotFoundView',
          query: {
            message: `${
              entityType.charAt(0).toUpperCase() + entityType.slice(1)
            } not found`,
          },
        })
        return
      }

      // Check access permissions
      const accessResult = await AccessControlService.canEditEntity({
        entityType,
        projectId,
        entity,
      })

      if (accessResult.shouldRedirect) {
        // Redirect for serious access violations (observers, non-members, auth issues)
        // Map entity types to their correct list view route names
        const listViewRouteMap = {
          [EntityType.TAXON]: 'MyProjectTaxaView',
          [EntityType.SPECIMEN]: 'MyProjectSpecimensListView',
          [EntityType.MEDIA]: 'MyProjectMediaView',
          [EntityType.MEDIA_VIEW]: 'MyProjectMediaViewsView',
          [EntityType.PROJECT_DOCUMENT]: 'MyProjectDocumentsView',
          [EntityType.PROJECT_DOCUMENT_FOLDER]: 'MyProjectDocumentsView',
          [EntityType.BIBLIOGRAPHIC_REFERENCE]: 'MyProjectBibliographyListView',
          [EntityType.FOLIO]: 'MyProjectFoliosView',
        }

        const listViewName = listViewRouteMap[entityType]
        if (!listViewName) {
          // Fallback to a generic error page if mapping is missing
          next({
            name: 'NotFoundView',
            query: {
              message: `You do not have permission to access this ${entityType.toLowerCase()}`,
            },
          })
          return
        }

        // Redirect to list view with error message
        next({
          name: listViewName,
          params: { id: projectId }, // Include the required project ID
          query: {
            error:
              accessResult.reason ||
              `You do not have permission to access this ${entityType.toLowerCase()}`,
          },
        })
        return
      }

      // Allow access to edit page - component will handle read-only display
      // for owner-restricted items and membership-based restrictions
      next()
    } catch (error) {
      console.error('Access control guard error:', error)
      next({
        name: 'NotFoundView',
        query: { message: 'Error checking permissions' },
      })
    }
  }
}
