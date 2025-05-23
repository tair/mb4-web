/**
 * Get the best available media URL based on size preferences
 * @param {Object} media - Media object containing different size variants
 * @param {string[]} sizePreference - Array of size preferences in order of preference
 * @returns {string|null} - The best available media URL or null if no media is available
 */
export const getBestMediaUrl = (
  media,
  sizePreference = ['large', 'medium', 'small', 'original', 'thumbnail']
) => {
  if (!media) return null

  for (const size of sizePreference) {
    if (media[size]) {
      return `https://morphobank.org/media/morphobank3/images/${media[size].HASH}/${media[size].MAGIC}_${media[size].FILENAME}`
    }
  }

  return null
}

/**
 * Process an array of items with media objects
 * @param {Array} items - Array of items containing media objects
 * @param {string[]} sizePreference - Array of size preferences in order of preference
 * @returns {Array} - Processed items with media URLs
 */
export const processItemsWithMedia = (
  items,
  sizePreference = ['large', 'medium', 'small', 'original', 'thumbnail']
) => {
  if (!Array.isArray(items)) return []

  return items.map((item) => ({
    ...item,
    media: getBestMediaUrl(item.media, sizePreference),
  }))
}
