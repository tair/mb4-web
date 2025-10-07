export type Media = { url: string; height: number; width: number }

/**
 * Convert a media object to a HTML image tag.
 */
export function toTag(media: Media, type: 'thumbnail' | 'large' = 'thumbnail'): string {
  const cssClass = type === 'large' ? 'large-media-image' : 'thumbnail-media-image'
  return `<img src='${media['url']}' width='${media['width']}' height='${media['height']}' class='${cssClass}' style='object-fit: contain;' />`
}
