/**
 * Annotation Service
 * 
 * Handles all API communication for annotation management
 * Integrates with the Node.js backend media-labels-controller
 */

import { apiService } from './apiService.js'

class AnnotationService {
  constructor() {
    this.baseUrl = '/services/projects'
  }

  /**
   * Set the base URL based on whether the project is published
   * @param {boolean} published - Whether the project is published
   */
  setPublished(published) {
    this.baseUrl = published ? '/services/public/projects' : '/services/projects'
  }

  /**
   * Get annotations for a media item
   * 
   * @param {number} projectId - Project ID
   * @param {number} mediaId - Media ID  
   * @param {string} type - Annotation type (X, M, T, C)
   * @param {number|string} linkId - Link ID for the annotation context
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of annotations
   */
  async getAnnotations(projectId, mediaId, type = 'M', linkId = null, options = {}) {
    try {
      const params = new URLSearchParams({
        type: type
      })

      // Add linkId as context_id if provided
      if (linkId) {
        params.append('link_id', linkId)
      }

      // Add optional context filters
      if (options.contextType) {
        params.append('context_type', options.contextType)
      }
      if (options.contextId) {
        params.append('context_id', options.contextId)
      }

      const url = `${this.baseUrl}/${projectId}/media/${mediaId}/labels?${params}`
      
      const response = await apiService.get(url)
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.error('API Error Response:', errorText)
        throw new Error(`Failed to load annotations: ${response.status} ${response.statusText}`)
      }

      const annotations = await response.json()
      
      // Transform server response to match our component expectations
      const transformed = this.transformAnnotationsFromServer(annotations)
      
      return transformed
      
    } catch (error) {
      console.error('Error loading annotations:', error)
      
      // Provide more specific error messages
      if (error.message.includes('Unexpected token')) {
        throw new Error('API returned HTML instead of JSON. Check if the endpoint exists and is working.')
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Check if the backend server is running.')
      } else {
        throw new Error(`Failed to load annotations: ${error.message}`)
      }
    }
  }

  /**
   * Save/create annotations
   * 
   * @param {number} projectId - Project ID
   * @param {number} mediaId - Media ID
   * @param {string} type - Annotation type (X, M, T, C)
   * @param {number} linkId - Link ID for the annotation context
   * @param {Array} annotations - Array of annotations to save
   * @returns {Promise<Object>} Save result
   */
  async saveAnnotations(projectId, mediaId, type, linkId, annotations) {
    try {
      
      const params = new URLSearchParams({ type: type })
      const url = `${this.baseUrl}/${projectId}/media/${mediaId}/labels/edit?${params}`
      
      // Transform annotations to server format
      const serverAnnotations = this.transformAnnotationsToServer(annotations)
      
      const payload = {
        linkId: linkId,
        save: serverAnnotations
      }

      const response = await apiService.post(url, payload)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        console.error('💾 Save error response:', errorData)
        throw new Error(errorData.message || 'Failed to save annotations')
      }

      const result = await response.json()
      return result
      
    } catch (error) {
      console.error('Error saving annotations:', error)
      throw new Error('Failed to save annotations. Please try again.')
    }
  }

  /**
   * Update a single annotation
   * 
   * @param {number} projectId - Project ID
   * @param {number} mediaId - Media ID
   * @param {string} type - Annotation type
   * @param {number} linkId - Link ID
   * @param {Object} annotation - Annotation to update
   * @returns {Promise<Object>} Update result
   */
  async updateAnnotation(projectId, mediaId, type, linkId, annotation) {
    // For updates, we use the same save endpoint with the annotation ID
    return this.saveAnnotations(projectId, mediaId, type, linkId, [annotation])
  }

  /**
   * Delete annotations
   * 
   * @param {number} projectId - Project ID
   * @param {number} mediaId - Media ID
   * @param {Array<number>} annotationIds - Array of annotation IDs to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteAnnotations(projectId, mediaId, annotationIds) {
    try {
      
      const url = `${this.baseUrl}/${projectId}/media/${mediaId}/labels/delete`
      
      const payload = {
        annotationIds: Array.isArray(annotationIds) ? annotationIds : [annotationIds]
      }

      // Backend expects POST request to /labels/delete (not DELETE)
      const response = await apiService.post(url, payload)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(errorData.message || 'Failed to delete annotations')
      }

      const result = await response.json()
      return result
      
    } catch (error) {
      console.error('Error deleting annotations:', error)
      throw new Error('Failed to delete annotations. Please try again.')
    }
  }

  /**
   * Export annotations in various formats
   * 
   * @param {number} projectId - Project ID
   * @param {number} mediaId - Media ID
   * @param {string} format - Export format (json, csv)
   * @param {Object} options - Export options
   * @returns {Promise<string>} Exported data
   */
  async exportAnnotations(projectId, mediaId, format = 'json', options = {}) {
    try {
      const params = new URLSearchParams({
        format: format,
        type: options.type || 'M'
      })

      if (options.contextType) {
        params.append('context_type', options.contextType)
      }
      if (options.contextId) {
        params.append('context_id', options.contextId)
      }

      const url = `${this.baseUrl}/${projectId}/media/${mediaId}/labels/export?${params}`
      const response = await apiService.get(url)
      
      if (!response.ok) {
        throw new Error(`Failed to export annotations: ${response.statusText}`)
      }

      // For JSON, parse and re-stringify for formatting
      if (format === 'json') {
        const data = await response.json()
        return JSON.stringify(data, null, 2)
      }
      
      // For CSV and other formats, return as text
      return await response.text()
      
    } catch (error) {
      console.error('Error exporting annotations:', error)
      throw new Error('Failed to export annotations. Please try again.')
    }
  }

  /**
   * Get annotation statistics for a media item
   * 
   * @param {number} projectId - Project ID
   * @param {number} mediaId - Media ID
   * @param {string} type - Annotation type
   * @returns {Promise<Object>} Statistics object
   */
  async getAnnotationStats(projectId, mediaId, type = 'M') {
    try {
      const annotations = await this.getAnnotations(projectId, mediaId, type)
      
      const stats = {
        total: annotations.length,
        byType: {},
        byUser: {},
        hasUnsaved: 0
      }

      annotations.forEach(annotation => {
        // Count by type
        const annotationType = annotation.type || 'unknown'
        stats.byType[annotationType] = (stats.byType[annotationType] || 0) + 1

        // Count by user
        const user = annotation.user_name || 'Unknown'
        stats.byUser[user] = (stats.byUser[user] || 0) + 1

        // Count unsaved
        if (!annotation.annotation_id) {
          stats.hasUnsaved++
        }
      })

      return stats
      
    } catch (error) {
      console.error('Error getting annotation stats:', error)
      return {
        total: 0,
        byType: {},
        byUser: {},
        hasUnsaved: 0
      }
    }
  }

  /**
   * Transform annotations from server format to component format
   * 
   * @param {Array} serverAnnotations - Annotations from server
   * @returns {Array} Transformed annotations
   */
  transformAnnotationsFromServer(serverAnnotations) {
    if (!Array.isArray(serverAnnotations)) {
      return []
    }

    return serverAnnotations.map(annotation => ({
      // Core annotation data
      annotation_id: annotation.annotation_id,
      label: annotation.label || '',
      description: annotation.description || '',
      type: annotation.type || 'rect',
      
      // Geometry properties
      x: Number(annotation.x) || 0,
      y: Number(annotation.y) || 0,
      w: Number(annotation.w) || 1,
      h: Number(annotation.h) || 1,
      points: annotation.points || null,
      
      // Text positioning
      tx: Number(annotation.tx) || Number(annotation.x) + 10 || 10,
      ty: Number(annotation.ty) || Number(annotation.y) - 10 || 10,
      tw: Number(annotation.tw) || 1,
      th: Number(annotation.th) || 1,
      
      // Display properties
      showDefaultText: annotation.showDefaultText ?? 1,
      locked: annotation.locked || 0,
      
      // Metadata
      user_name: annotation.user_name,
      created_on: annotation.created_on,
      updated_on: annotation.updated_on,
      
      // Link information (preserve original link_id for updates)
      link_id: annotation.link_id,
      
      // Context
      contextType: annotation.context_type,
      contextId: annotation.context_id
    }))
  }

  /**
   * Transform annotations from component format to server format
   * 
   * @param {Array} componentAnnotations - Annotations from component
   * @returns {Array} Transformed annotations
   */
  transformAnnotationsToServer(componentAnnotations) {
    if (!Array.isArray(componentAnnotations)) {
      return []
    }

    return componentAnnotations.map(annotation => {
      const serverAnnotation = {
        annotation_id: annotation.annotation_id || null,
        label: annotation.label || '',
        type: annotation.type || 'rect',
        x: Number(annotation.x) || 0,
        y: Number(annotation.y) || 0,
        tx: Number(annotation.tx) || Number(annotation.x) + 10 || 10,
        ty: Number(annotation.ty) || Number(annotation.y) - 10 || 10,
        tw: Number(annotation.tw) || 1,
        th: Number(annotation.th) || 1,
        showDefaultText: annotation.showDefaultText ?? 1,
        locked: annotation.locked || 0
      }

      // Add type-specific properties
      switch (annotation.type) {
        case 'rect':
          serverAnnotation.w = Number(annotation.w) || 1
          serverAnnotation.h = Number(annotation.h) || 1
          break
          
        case 'point':
          // Points don't need width/height, but server expects them
          serverAnnotation.w = 1
          serverAnnotation.h = 1
          break
          
        case 'poly':
          if (annotation.points && Array.isArray(annotation.points)) {
            serverAnnotation.points = annotation.points.map(Number)
          }
          serverAnnotation.w = 1
          serverAnnotation.h = 1
          break
      }

      return serverAnnotation
    })
  }

  /**
   * Validate annotation data
   * 
   * @param {Object} annotation - Annotation to validate
   * @returns {Object} Validation result
   */
  validateAnnotation(annotation) {
    const errors = []
    const warnings = []

    // Required fields
    if (!annotation.label || annotation.label.trim().length === 0) {
      errors.push('Label is required')
    }

    if (!annotation.type) {
      errors.push('Annotation type is required')
    }

    // Type-specific validations
    switch (annotation.type) {
      case 'rect':
        if (typeof annotation.x !== 'number' || annotation.x < 0) {
          errors.push('Invalid X coordinate for rectangle')
        }
        if (typeof annotation.y !== 'number' || annotation.y < 0) {
          errors.push('Invalid Y coordinate for rectangle')
        }
        if (typeof annotation.w !== 'number' || annotation.w <= 0) {
          errors.push('Invalid width for rectangle')
        }
        if (typeof annotation.h !== 'number' || annotation.h <= 0) {
          errors.push('Invalid height for rectangle')
        }
        break

      case 'point':
        if (typeof annotation.x !== 'number' || annotation.x < 0) {
          errors.push('Invalid X coordinate for point')
        }
        if (typeof annotation.y !== 'number' || annotation.y < 0) {
          errors.push('Invalid Y coordinate for point')
        }
        break

      case 'poly':
        if (!annotation.points || !Array.isArray(annotation.points)) {
          errors.push('Polygon must have points array')
        } else if (annotation.points.length < 6) {
          errors.push('Polygon must have at least 3 points (6 coordinates)')
        } else if (annotation.points.length % 2 !== 0) {
          errors.push('Polygon points must be in x,y pairs')
        }
        break

      default:
        warnings.push('Unknown annotation type')
    }

    // Label length validation
    if (annotation.label && annotation.label.length > 255) {
      warnings.push('Label is very long and may be truncated')
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings
    }
  }

  /**
   * Get default annotation properties for a given type
   * 
   * @param {string} type - Annotation type
   * @param {Object} position - Starting position {x, y}
   * @returns {Object} Default annotation properties
   */
  getDefaultAnnotation(type, position = { x: 0, y: 0 }) {
    const base = {
      annotation_id: null,
      label: '',
      description: '',
      type: type,
      x: position.x,
      y: position.y,
      tx: position.x + 10,
      ty: position.y - 10,
      tw: 1,
      th: 1,
      showDefaultText: 1,
      locked: 0
    }

    switch (type) {
      case 'rect':
        return {
          ...base,
          w: 100,
          h: 50
        }

      case 'point':
        return {
          ...base,
          w: 1,
          h: 1
        }

      case 'poly':
        return {
          ...base,
          w: 1,
          h: 1,
          points: [
            position.x, position.y,
            position.x + 50, position.y,
            position.x + 25, position.y + 50
          ]
        }

      default:
        return base
    }
  }
}

// Create and export singleton instance
export const annotationService = new AnnotationService()

// Also export the class for testing
export { AnnotationService }

// Default export for easier importing
export default annotationService
