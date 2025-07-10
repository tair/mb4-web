// /**
//  * Build S3 media URL for a given project, media ID, and file size
//  * @param {number|string} projectId - The project ID
//  * @param {number|string} mediaId - The media ID
//  * @param {string} fileSize - The file size (original, large, medium, thumbnail, etc.)
//  * @returns {string} - The S3 media URL
//  */
// export const buildS3MediaUrl = (projectId, mediaId, fileSize = 'original') => {
//   return `${import.meta.env.VITE_API_URL}/public/media/${projectId}/serve/${mediaId}/${fileSize}`
// }

// /**
//  * Extract media ID from filename
//  * @param {string} filename - The filename to extract media ID from
//  * @returns {string|null} - The extracted media ID or null if not found
//  */
// export const extractMediaId = (filename) => {
//   if (!filename) {
//     return null
//   }
//   // Extract media ID from pattern: "media_files_media_482278_icon.jpg"
//   const match = filename.match(/media_files_media_(\d+)_/)
//   return match ? match[1] : null
// }

// /**
//  * Extract media ID from media object by checking various size variants
//  * @param {Object} media - The media object containing size variants
//  * @returns {string|null} - The extracted media ID or null if not found
//  */
// export const extractMediaIdFromMedia = (media) => {
//   if (!media) {
//     return null
//   }
  
//   // Try to find media ID from any of the size variants
//   const sizeVariants = ['large', 'medium', 'small', 'original', 'thumbnail', 'preview', 'icon']
  
//   for (const size of sizeVariants) {
//     if (media[size]?.FILENAME) {
//       const mediaId = extractMediaId(media[size].FILENAME)
//       if (mediaId) {
//         return mediaId
//       }
//     }
//   }
  
//   return null
// }

// /**
//  * Process items with S3 media URLs
//  * @param {Array} items - Array of items containing media objects
//  * @param {string[]} sizePreference - Array of size preferences in order of preference
//  * @returns {Array} - Processed items with S3 media URLs
//  */
// export const processItemsWithS3Media = (
//   items,
//   sizePreference = ['large', 'medium', 'small', 'original', 'thumbnail']
// ) => {
//   if (!Array.isArray(items)) {
//     return []
//   }

//   return items.map((item) => {
//     let mediaUrl = null
    
//     // Check if we have project_id and media info
//     if (item.project_id && item.media) {
//       const mediaId = extractMediaIdFromMedia(item.media)
//       if (mediaId) {
//         // Use the first available size from preferences
//         for (const size of sizePreference) {
//           if (item.media[size]) {
//             mediaUrl = buildS3MediaUrl(item.project_id, mediaId, size)
//             break
//           }
//         }
//         // If no specific size found, use original
//         if (!mediaUrl) {
//           mediaUrl = buildS3MediaUrl(item.project_id, mediaId, 'original')
//         }
//       }
//     }
    
//     return {
//       ...item,
//       media: mediaUrl
//     }
//   })
// }

// /**
//  * Get the best available media URL based on size preferences - now uses S3 endpoints
//  * @param {Object} media - Media object containing different size variants
//  * @param {string[]} sizePreference - Array of size preferences in order of preference
//  * @param {number|string} projectId - Project ID (required for S3 URLs)
//  * @param {number|string} mediaId - Media ID (required for S3 URLs)
//  * @returns {string|null} - The best available media URL or null if no media is available
//  */
// export const getBestMediaUrl = (
//   media,
//   sizePreference = ['large', 'medium', 'small', 'original', 'thumbnail'],
//   projectId,
//   mediaId
// ) => {
//   if (!media) return null

//   // If projectId and mediaId are provided, use S3 endpoint
//   if (projectId && mediaId) {
//     for (const size of sizePreference) {
//       if (media[size]) {
//         return buildS3MediaUrl(projectId, mediaId, size)
//       }
//     }
//     // If no preferred size found, try original
//     return buildS3MediaUrl(projectId, mediaId, 'original')
//   }

//   // Fallback to old method for backward compatibility
//   for (const size of sizePreference) {
//     if (media[size]) {
//       return `https://morphobank.org/media/morphobank3/images/${media[size].HASH}/${media[size].MAGIC}_${media[size].FILENAME}`
//     }
//   }

//   return null
// }

// /**
//  * Process an array of items with media objects - now uses S3 endpoints
//  * @param {Array} items - Array of items containing media objects
//  * @param {string[]} sizePreference - Array of size preferences in order of preference
//  * @param {number|string} projectId - Project ID (required for S3 URLs)
//  * @returns {Array} - Processed items with media URLs
//  */
// export const processItemsWithMedia = (
//   items,
//   sizePreference = ['large', 'medium', 'small', 'original', 'thumbnail'],
//   projectId
// ) => {
//   if (!Array.isArray(items)) return []

//   return items.map((item) => ({
//     ...item,
//     media: getBestMediaUrl(item.media, sizePreference, projectId, item.media_id),
//   }))
// }
