import { Component } from './Component'
import { VueMountingUtility, vueMountingRegistry } from './VueMountingUtility'
import { ImageViewerDialog } from './dialogs/ImageViewerDialog'

/**
 * Lazy-loading image renderer that uses Vue's v-lazy-image component
 * for efficient loading of matrix cell thumbnails
 */
export class LazyImageRenderer extends Component {
  private readonly type: string
  private projectId: number | null = null
  private cellId: number | null = null
  private isReadOnly: boolean = false
  private isPublished: boolean = false
  private imageUrls: ImageRendererUrl[] = []
  private vueMountingUtility: VueMountingUtility | null = null

  constructor(type: string) {
    super()
    this.type = type
  }

  /**
   * Sets the project ID for proper media URL building
   * @param projectId The project ID
   */
  setProjectId(projectId: number) {
    this.projectId = projectId
  }

  /**
   * Sets the cell ID for annotation context
   * @param cellId The cell/link ID
   */
  setCellId(cellId: number | null) {
    this.cellId = cellId
  }

  /**
   * Sets the image as readonly
   * @param readonly The boolean which indicates whether this image render is readonly
   */
  setReadOnly(isReadOnly: boolean) {
    this.isReadOnly = isReadOnly
  }

  /**
   * Sets whether this is a published project
   * @param published Whether the project is published
   */
  setPublished(published: boolean) {
    this.isPublished = published
  }

  /**
   * Adds an image to the renderer
   *
   * @param id the id of the image
   * @param url the url of the image
   * @param caption the caption of the image
   * @param mediaData the full media object data for TIFF detection
   */
  addImage(id: number, url: string, caption?: string | null, mediaData?: any) {
    const imageUrl: ImageRendererUrl = {
      id: id,
      url: url,
      caption: caption || null,
      mediaData: mediaData || null,
    }

    this.imageUrls.push(imageUrl)
    return this
  }

  /**
   * Get all image URLs
   */
  getImageUrls(): ImageRendererUrl[] {
    return this.imageUrls
  }

  /**
   * Clear all images
   */
  clearImages() {
    this.imageUrls = []
  }

  override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('imageThumbnail', 'lazy-image-container')

    // Create initial placeholder content immediately (synchronously)
    if (this.imageUrls.length > 0) {
      element.innerHTML = '<div class="initial-loading-placeholder">Loading...</div>'
      // Mount Vue component asynchronously after DOM is ready
      setTimeout(() => this.mountVueComponent(), 0)
    } else {
      // Show empty state
      element.innerHTML = '<div class="no-images-placeholder"></div>'
    }
  }

  /**
   * Mount the Vue lazy image component
   */
  private async mountVueComponent() {
    try {
      const element = this.getElement()
      
      if (!element) {
        console.error('LazyImageRenderer: Element not found during Vue component mounting')
        return
      }

      // Clear the initial loading placeholder
      element.innerHTML = ''
      
      // Dynamic import of the LazyMatrixImage component
      const { default: LazyMatrixImage } = await import('../../../components/matrix/LazyMatrixImage.vue')
      
      // Create mounting utility
      this.vueMountingUtility = new VueMountingUtility()
      vueMountingRegistry.register(this.vueMountingUtility)

      // Mount the Vue component with props and event handlers
      await this.vueMountingUtility.mount(element, {
        component: LazyMatrixImage,
        props: {
          imageUrls: this.imageUrls,
          type: this.type,
          projectId: this.projectId,
          cellId: this.cellId,
          readonly: this.isReadOnly,
          published: this.isPublished,
          placeholderImage: '/images/loading-placeholder.svg',
          onImageClick: this.handleVueImageClick.bind(this)
        }
      })

      console.log('LazyMatrixImage Vue component mounted successfully')

    } catch (error) {
      console.error('Failed to mount LazyMatrixImage component:', error)
      // Fallback to basic display
      this.createFallbackDisplay()
    }
  }

  /**
   * Handle image click events from Vue component
   */
  private handleVueImageClick(imageId: number, type: string, projectId: number | null, readonly: boolean, cellId: number | null, published: boolean) {
    // Find the media data for the clicked image
    const imageUrl = this.imageUrls.find(img => img.id === imageId)
    const mediaData = imageUrl?.mediaData || {}
    
    ImageViewerDialog.show(type, imageId, projectId, mediaData, readonly, cellId, published)
  }

  /**
   * Handle image click events (fallback for non-Vue scenarios)
   */
  private onImageClick(event: Event) {
    // Fallback - use first available image
    if (this.imageUrls.length === 0) return
    
    const imageUrl = this.imageUrls[0]
    const mediaData = imageUrl.mediaData || {}
    
    ImageViewerDialog.show(
      this.type, 
      imageUrl.id, 
      this.projectId, 
      mediaData, 
      this.isReadOnly, 
      this.cellId, 
      this.isPublished
    )

    event.stopPropagation()
    event.preventDefault()
  }

  /**
   * Create fallback display when Vue component fails to load
   */
  private createFallbackDisplay() {
    const element = this.getElement()
    
    if (this.imageUrls.length === 0) {
      element.innerHTML = '<div class="no-images-placeholder"></div>'
      return
    }

    // Use first image as fallback with traditional loading
    const firstImage = this.imageUrls[0]
    element.innerHTML = `
      <div class="fallback-image-container" style="
        background-image: url(${firstImage.url});
        background-size: cover;
        background-position: center;
        width: 100%;
        height: 100%;
        min-height: 40px;
        border-radius: 4px;
        cursor: pointer;
      ">
        ${firstImage.caption ? `<div class="image-caption">${firstImage.caption}</div>` : ''}
      </div>
    `

    // Add click handler for fallback
    const fallbackContainer = element.querySelector('.fallback-image-container')
    if (fallbackContainer) {
      fallbackContainer.addEventListener('click', this.onImageClick.bind(this))
    }
  }

  override dispose() {
    // Clean up Vue component
    if (this.vueMountingUtility) {
      vueMountingRegistry.unregister(this.vueMountingUtility)
      this.vueMountingUtility.unmount()
      this.vueMountingUtility = null
    }

    super.dispose()
  }

  /**
   * Update images after component is created
   * Useful for dynamic content updates
   */
  async updateImages(newImageUrls: ImageRendererUrl[]) {
    this.imageUrls = newImageUrls

    if (this.vueMountingUtility && this.getElement()) {
      // Remount with new data
      this.vueMountingUtility.unmount()
      await this.mountVueComponent()
    }
  }

  /**
   * Check if component has images
   */
  hasImages(): boolean {
    return this.imageUrls.length > 0
  }

  /**
   * Get the number of images
   */
  getImageCount(): number {
    return this.imageUrls.length
  }
}

interface ImageRendererUrl {
  url: string
  id: number
  caption: string | null
  mediaData?: any // Store the full media object data for TIFF detection
}

export { ImageRendererUrl }
