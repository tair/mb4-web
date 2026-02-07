import { apiService } from '@/services/apiService.js'

/**
 * Build S3 media URL for a given project, media ID, and file size
 * @param {number|string} projectId - The project ID
 * @param {number|string} mediaId - The media ID
 * @param {string} fileSize - The file size (original, large, medium, thumbnail, etc.)
 * @returns {string} - The S3 media URL or placeholder image URL
 */
function buildMediaUrl(projectId, mediaId, fileSize = 'original') {
  if (!projectId || !mediaId) {
    return '/public/images/image-not-found.png'
  }
  return apiService.buildUrl(`/public/media/${projectId}/serve/${mediaId}/${fileSize}`)
}

/**
 * Build S3 document URL for a given project and document ID
 * @param {number|string} projectId - The project ID
 * @param {number|string} documentId - The document ID
 * @returns {string} - The S3 document URL
 */
function buildDocumentUrl(projectId, documentId) {
  if (!projectId || !documentId) {
    return null
  }
  return apiService.buildUrl(`/public/documents/${projectId}/serve/${documentId}`)
}

/**
 * Build image URL from media object, with both S3 and legacy support
 * @param {Object|string|null} mediaObj - the media data or a raw URL string
 * @param {string} [type] - optional size/type key (original, large, etc.)
 * @param {number|string} projectId - project ID for S3 URLs
 * @param {number|string} mediaId - media ID for S3 URLs
 * @returns {string|null} - the best possible URL, or null if none
 */
function buildImageProps(mediaObj, type, projectId, mediaId) {
  // 1) If caller already passed a raw URL string, use it
  if (typeof mediaObj === 'string') {
    return mediaObj
  }

  // 2) If the API object has a full-URL field on it, use that
  //    (you may need to tweak these property names to match your payload)
  if (mediaObj && (mediaObj.url || mediaObj.fullUrl)) {
    return mediaObj.url || mediaObj.fullUrl
  }

  // 3) If we have projectId + mediaId, use your S3 helper
  if (projectId && mediaId) {
    const fileSize = type || 'large'
    return buildMediaUrl(projectId, mediaId, fileSize)
  }

  // 4) Legacy HASH/MAGIC/FILENAME method
  let media = mediaObj
  if (type) media = mediaObj[type]

  if (media && media.HASH && media.MAGIC && media.FILENAME) {
    return (
      `https://morphobank.org/media/morphobank3/images/` +
      `${media.HASH}/${media.MAGIC}_${media.FILENAME}`
    )
  }

  // 5) Try fallback sizes if the requested type doesn't exist
  if (type && mediaObj) {
    const fallbackSizes = ['original', 'large', 'medium', 'small', 'thumbnail']
    for (const fallbackSize of fallbackSizes) {
      if (
        fallbackSize !== type &&
        mediaObj[fallbackSize] &&
        mediaObj[fallbackSize].HASH &&
        mediaObj[fallbackSize].MAGIC &&
        mediaObj[fallbackSize].FILENAME
      ) {
        return (
          `https://morphobank.org/media/morphobank3/images/` +
          `${mediaObj[fallbackSize].HASH}/${mediaObj[fallbackSize].MAGIC}_${mediaObj[fallbackSize].FILENAME}`
        )
      }
    }
  }

  // 6) Give up
  return null
}

/**
 * Get the best available media URL based on size preferences
 * @param {Object} media - Media object containing different size variants
 * @param {string[]} sizePreference - Array of size preferences in order of preference
 * @param {number|string} projectId - Project ID (required for S3 URLs)
 * @param {number|string} mediaId - Media ID (required for S3 URLs)
 * @returns {string} - The best available media URL or placeholder image URL
 */
function getBestMediaUrl(
  media,
  sizePreference = ['large', 'medium', 'small', 'original', 'thumbnail'],
  projectId,
  mediaId
) {
  if (!media) return '/images/image-not-found.png'

  // Check if this is a 3D file that should use the 3D icon
  if (media.thumbnail?.USE_ICON === '3d' || media.media_type === '3d') {
    return '/images/3DImage.png'
  }

  // Check if this is a ZIP/archive file (CT scans) that should use the CT scan icon
  if (isZipMedia(media)) {
    return '/images/CTScan.png'
  }

  // For videos, we want to show generated thumbnails if they exist, 
  // only fall back to icon if no thumbnails were generated
  if ((media.thumbnail?.USE_ICON === 'video' || media.media_type === 'video') && !media.thumbnail?.s3_key) {
    // No actual thumbnail was generated, use a placeholder
    return '/images/image-not-found.png' // Generic placeholder for videos without thumbnails
  }

  // Use S3 endpoint with built-in null handling
  for (const size of sizePreference) {
    if (media[size]) {
      return buildMediaUrl(projectId, mediaId, size)
    }
  }
  // If no preferred size found, try large
  return buildMediaUrl(projectId, mediaId, 'large')
}

/**
 * Process an array of items with media objects - now uses S3 endpoints
 * @param {Array} items - Array of items containing media objects
 * @param {string[]} sizePreference - Array of size preferences in order of preference
 * @param {number|string} projectId - Project ID (required for S3 URLs)
 * @returns {Array} - Processed items with media URLs
 */
function processItemsWithMedia(
  items,
  sizePreference = ['large', 'medium', 'small', 'original', 'thumbnail']
) {
  if (!Array.isArray(items)) return []

  return items.map((item) => ({
    ...item,
    media: getBestMediaUrl(
      item.media,
      sizePreference,
      item.projectId,
      item.media_id
    ),
  }))
}

/**
 * Process an array of items with media objects using buildImageProps for maximum compatibility
 * @param {Array} items - Array of items containing media objects
 * @param {string} typeKey - Optional type/size key (e.g., 'large', 'original')
 * @returns {Array} - Processed items with media URLs
 */
function processItemsWithMediaLegacy(items, typeKey = null) {
  if (!Array.isArray(items)) return []

  return items.map((item) => ({
    ...item,
    media: buildImageProps(
      item.media,
      typeKey, // e.g. 'large' or whatever you need
      item.projectId || item.project_id,
      item.mediaId || item.media_id
    ),
  }))
}

export {
  buildMediaUrl,
  buildDocumentUrl,
  buildImageProps,
  processItemsWithMedia,
  processItemsWithMediaLegacy,
  getBestMediaUrl,
}

// ----------------------
// Additional helpers for S3 original URLs and media-type detection
// ----------------------

/**
 * Extract a lowercase file extension from a URL or path
 * @param {string} str
 * @returns {string|null}
 */
function extFromUrlOrPath(str) {
  if (!str || typeof str !== 'string') return null
  const m = str.match(/\.([a-z0-9]+)(?:\?|$)/i)
  return m ? m[1].toLowerCase() : null
}

/**
 * Determine whether media represents a 3D asset
 * @param {Object} media
 * @returns {boolean}
 */
function is3DMedia(media) {
  if (!media) return false
  const useIcon = media?.thumbnail?.USE_ICON
  const type = (media?.media_type || '').toString().toLowerCase()
  return useIcon === '3d' || type === '3d' || type.includes('model')
}

/**
 * Determine whether media represents a ZIP/archive file (CT scans, stacks)
 * These cannot be rendered in the browser and should use a static placeholder image.
 * @param {Object} media - Media object with various possible structures
 * @returns {boolean}
 */
function isZipMedia(media) {
  if (!media) return false
  
  // Check USE_ICON for archives (various nested structures)
  const useIconChecks = [
    media?.thumbnail?.USE_ICON,
    media?.original?.USE_ICON,
    media?.media?.thumbnail?.USE_ICON,
    media?.media?.original?.USE_ICON
  ]
  for (const useIcon of useIconChecks) {
    if (useIcon === 'archive') {
      return true
    }
  }
  
  // Check media_type field
  const mediaType = (media?.media_type || '').toString().toLowerCase()
  if (mediaType === 'zip' || mediaType === 'archive') {
    return true
  }
  
  // Check filename extension for .zip - check many possible locations
  // The original_filename can be at root level, in nested media object, or in original object
  const filenameChecks = [
    media?.original_filename,          // Root level (common in list views)
    media?.ORIGINAL_FILENAME,          // Root level uppercase
    media?.filename,                   // Root level
    media?.media?.ORIGINAL_FILENAME,   // Nested in media object
    media?.media?.original_filename,   // Nested in media object lowercase
    media?.media?.filename,            // Nested in media object
    media?.original?.ORIGINAL_FILENAME, // In original object
    media?.original?.FILENAME,         // In original object
    media?.media?.original?.ORIGINAL_FILENAME,  // Deep nested
    media?.media?.original?.FILENAME   // Deep nested
  ]
  
  for (const filename of filenameChecks) {
    if (filename && typeof filename === 'string') {
      const ext = filename.split('.').pop()?.toLowerCase()
      if (ext === 'zip') return true
    }
  }
  
  // Check MIME type - various nested structures
  const mimeChecks = [
    media?.original?.MIMETYPE,
    media?.MIMETYPE,
    media?.mime_type,
    media?.mimetype,
    media?.media?.original?.MIMETYPE,
    media?.media?.MIMETYPE
  ]
  
  for (const mime of mimeChecks) {
    if (mime === 'application/zip' || mime === 'application/x-zip-compressed') {
      return true
    }
  }
  
  // Check extension field
  const extChecks = [
    media?.original?.EXTENSION,
    media?.EXTENSION,
    media?.extension,
    media?.media?.original?.EXTENSION,
    media?.media?.EXTENSION
  ]
  
  for (const ext of extChecks) {
    if (ext && ext.toLowerCase() === 'zip') {
      return true
    }
  }
  
  return false
}

/**
 * Attempt to determine the original file extension from the media object
 * @param {Object|string|null} media
 * @returns {string|null}
 */
function detectOriginalExtension(media) {
  if (!media) return null
  // raw URL or maybe stringified JSON
  if (typeof media === 'string') {
    const trimmed = media.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        media = JSON.parse(trimmed)
      } catch {
        return extFromUrlOrPath(media)
      }
    } else {
      return extFromUrlOrPath(media)
    }
  }

  const orig = media.original || media.Original || null
  if (orig) {
    const s3Key = orig.s3_key || orig.S3_KEY || orig.key || orig.KEY
    if (s3Key) {
      const fromKey = extFromUrlOrPath(s3Key)
      if (fromKey) return fromKey
    }
    if (orig.FILENAME) {
      const fromFilename = extFromUrlOrPath(orig.FILENAME)
      if (fromFilename) return fromFilename
    }
    if (orig.url) {
      const fromUrl = extFromUrlOrPath(orig.url)
      if (fromUrl) return fromUrl
    }
  }

  // Fallback: sometimes only a generic url/fullUrl is present on root
  if (media.url || media.fullUrl) {
    return extFromUrlOrPath(media.url || media.fullUrl)
  }
  return null
}

function isBrowserFriendlyImageExtension(ext) {
  if (!ext) return false
  const safe = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  return safe.includes(ext.toLowerCase())
}

/**
 * Build S3 URL for the original media file following the convention:
 * /s3/media_files/images/{projectId}/{mediaId}/{projectId}_{mediaId}_original.{ext}
 * Falls back to 3D icon if media is 3D, or to JPG if extension is unknown.
 * @param {number|string} projectId
 * @param {number|string} mediaId
 * @param {Object|string|null} mediaObj - optional media JSON to infer type/extension
 * @returns {string}
 */
function buildS3OriginalImageUrl(projectId, mediaId, mediaObj = null) {
  if (!projectId || !mediaId) {
    return '/images/image-not-found.png'
  }
  if (is3DMedia(mediaObj)) {
    return '/images/3DImage.png'
  }
  if (isZipMedia(mediaObj)) {
    return '/images/CTScan.png'
  }
  const ext = detectOriginalExtension(mediaObj)
  // If original extension isn't browser-friendly (e.g., tiff), fall back to derived large JPEG
  if (!isBrowserFriendlyImageExtension(ext)) {
    return apiService.buildUrl(
      `/s3/media_files/images/${projectId}/${mediaId}/${projectId}_${mediaId}_large.jpg`
    )
  }
  const useExt = ext || 'jpg'
  return apiService.buildUrl(
    `/s3/media_files/images/${projectId}/${mediaId}/${projectId}_${mediaId}_original.${useExt}`
  )
}

export { buildS3OriginalImageUrl, is3DMedia, isZipMedia, detectOriginalExtension }
