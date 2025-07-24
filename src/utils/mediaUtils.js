/**
 * Build S3 media URL for a given project, media ID, and file size
 * @param {number|string} projectId - The project ID
 * @param {number|string} mediaId - The media ID
 * @param {string} fileSize - The file size (original, large, medium, thumbnail, etc.)
 * @returns {string} - The S3 media URL or placeholder image URL
 */
function buildMediaUrl(projectId, mediaId, fileSize = 'large') {
  if (!projectId || !mediaId) {
    return '/public/images/image-not-found.png'
  }
  return `${
    import.meta.env.VITE_API_URL
  }/public/media/${projectId}/serve/${mediaId}/${fileSize}`
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
  buildImageProps,
  processItemsWithMedia,
  processItemsWithMediaLegacy,
  getBestMediaUrl,
}
