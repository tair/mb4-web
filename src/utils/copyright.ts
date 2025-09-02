/**
 * Shared copyright utility functions for image paths and titles
 * Used by both CopyrightIcon.vue component and matrix editor dialogs
 */

/**
 * Get the copyright image filename (without extension) based on permission and license
 * @param copyrightPermission - The copyright permission value
 * @param copyrightLicense - The copyright license value
 * @returns The image filename (e.g., 'CC-BY', 'PDM', etc.)
 */
export function getCopyrightImagePath(copyrightPermission: number, copyrightLicense: number): string {
  // Public domain - apply PDM (Public Domain Mark)
  if (copyrightPermission === 4) {
    return 'PDM'
  }

  switch (copyrightLicense) {
    case 1:
      return 'CC-0'
    case 2:
      return 'CC-BY'
    case 3:
      return 'CC-BY-NC'
    case 4:
      return 'CC-BY-SA'
    case 5:
      return 'CC-BY-NC-SA'
    case 6:
      return 'CC-BY-ND'
    case 7:
      return 'CC-BY-NC-ND'
    default:
      return 'CC-0_gray'
  }
}

/**
 * Get the copyright title/tooltip text based on permission and license
 * @param copyrightPermission - The copyright permission value
 * @param copyrightLicense - The copyright license value
 * @returns The descriptive title text for the copyright
 */
export function getCopyrightTitle(copyrightPermission: number, copyrightLicense: number): string {
  // Handle public domain first
  if (copyrightPermission === 4) {
    return 'Public Domain Mark - no copyright restrictions'
  }
  
  switch (copyrightLicense) {
    case 0:
      return 'Media reuse policy not set'
    case 1:
      return 'CC0 - relinquish copyright'
    case 2:
      return 'Attribution CC BY - reuse with attribution'
    case 3:
      return 'Attribution-NonCommercial CC BY-NC - reuse but noncommercial'
    case 4:
      return 'Attribution-ShareAlike CC BY-SA - reuse here and applied to future uses'
    case 5:
      return 'Attribution- CC BY-NC-SA - reuse here and applied to future uses but noncommercial'
    case 6:
      return 'Attribution-NoDerivs CC BY-ND - reuse but no changes'
    case 7:
      return 'Attribution-NonCommercial-NoDerivs CC BY-NC-ND - reuse noncommercial no changes'
    case 8:
      return 'Media released for onetime use, no reuse without permission'
    case 20:
    default:
      return 'Unknown - Will set before project publication'
  }
}

/**
 * Generate complete HTML for copyright icon with image and title
 * @param copyrightPermission - The copyright permission value
 * @param copyrightLicense - The copyright license value
 * @returns HTML string with img tag
 */
export function getCopyrightImageHtml(
  copyrightPermission: number, 
  copyrightLicense: number,
  isCopyrighted: true
): string {
  const imagePath = isCopyrighted ? getCopyrightImagePath(copyrightPermission, copyrightLicense) : getPublicCopyrightImagePath()
  const title = isCopyrighted ? getCopyrightTitle(copyrightPermission, copyrightLicense) : getPublicCopyrightTitle()
  
  // Escape HTML in title for safety
  const escapedTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  
  return `<img src="/images/${imagePath}.png" title="${escapedTitle}" style="max-width: 88px; height: auto; object-fit: contain; vertical-align: middle;" alt="${escapedTitle}" />`
}

function getPublicCopyrightImagePath(): string {
  return 'CC-0'
}

function getPublicCopyrightTitle(): string {
  return 'Copyright license for future use: Media released for onetime use, no reuse without permission'
}