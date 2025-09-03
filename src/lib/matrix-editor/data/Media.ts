export type Media = { url: string; height: number; width: number }

/**
 * Convert a media object to a HTML image tag.
 */
export function toTag(media: Media): string {
  return `<img src='${media['url']}' width='${media['width']}' height='${media['height']}' style='max-width: 100%; max-height: 100%; object-fit: contain;' />`
}
