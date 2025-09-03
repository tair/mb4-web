import * as mb from '../../mb'
import { Modal } from '../Modal'
import { EventType } from '../Component'
import { VueMountingUtility, vueMountingRegistry } from '../VueMountingUtility'
import { getCopyrightImageHtml, getCopyrightImagePath, getCopyrightTitle } from '../../../../utils/copyright'
import { SimpleImageViewer } from './SimpleImageViewer'

/**
 * Advanced Media Viewer with support for images, videos, and 3D files
 * Automatically enables annotation viewer for all 2D images (readonly mode shows labels but disables editing)
 *
 * @param type The type of the media to display
 * @param mediaId The id of the media to display
 * @param projectId The project ID for building media URLs
 * @param mediaData Optional media metadata for smart URL selection
 * @param readonly Whether the image viewer should be immutable (affects editing, not viewing)
 * @param linkId Optional matrix cell link ID for annotation context
 */
export class ImageViewerDialog extends Modal {


  private readonly type: string
  private readonly mediaId: number
  private readonly projectId: number
  private mediaData: any
  private readonly readonly: boolean
  private readonly linkId: number | null
  private readonly published: boolean
  private readonly metaViewport: Element
  private currentMediaElement: HTMLElement | null = null
  
  // Annotation functionality
  private annotationMountingUtility: VueMountingUtility | null = null
  private annotationContainer: HTMLElement | null = null
  private simpleImageViewer: SimpleImageViewer | null = null

  constructor(
    type: string, 
    mediaId: number, 
    projectId: number,
    mediaData?: any,
    readonly?: boolean | null,
    linkId?: number | null,
    published?: boolean
  ) {
    super()

    this.type = type
    this.mediaId = mediaId
    this.projectId = projectId
    this.mediaData = mediaData || {}
    this.readonly = !!readonly
    this.linkId = linkId || null
    this.published = !!published
    this.metaViewport = document.querySelector(
      'meta[name="viewport"]'
    ) as Element
    
    // Always use annotation viewer title since annotations are always enabled
    this.setTitle('Media Annotation Viewer')
    this.setDisposeOnHide(true)
  }

  /**
   * Check if the media file is a 3D file
   */
  private is3DFile(): boolean {
    // Check Vue frontend media structure first
    if (this.mediaData?.media?.thumbnail?.USE_ICON === '3d' || 
        this.mediaData?.media?.original?.USE_ICON === '3d') {
      console.log('Detected 3D file from Vue media structure')
      return true
    }
    
    // Check matrix editor media structure
    if (this.mediaData?.media_type === '3d' || this.mediaData?.type === '3d') {
      console.log('Detected 3D file from matrix editor media structure')
      return true
    }
    
    // Default to false if no clear indicators
    return false
  }

  /**
   * Check if the media file is a video file
   */
  private isVideoFile(): boolean {
    // Check Vue frontend media structure first
    if (this.mediaData?.media?.thumbnail?.USE_ICON === 'video' || 
        this.mediaData?.media?.original?.USE_ICON === 'video') {
      console.log('Detected video file from Vue media structure')
      return true
    }
    
    // Check matrix editor media structure
    if (this.mediaData?.media_type === 'video' || this.mediaData?.type === 'video') {
      console.log('Detected video file from matrix editor media structure')
      return true
    }
    
    // Default to false if no clear indicators
    return false
  }

  /**
   * Check if the original file is a TIFF file (for smart URL selection)
   */
  private isOriginalTiffFile(): boolean {
    // Check Vue frontend media structure first
    const originalMedia = this.mediaData?.media?.original
    if (originalMedia && (originalMedia.MIMETYPE === 'image/tiff' || originalMedia.MIMETYPE === 'image/tif')) {
      return true
    }
    
    // Check matrix editor media structure
    if (this.mediaData?.mimetype === 'image/tiff' || this.mediaData?.mimetype === 'image/tif') {
      return true
    }
    
    // No filename fallback needed
    return false
  }

  /**
   * Build media URL for different file sizes using the static utility method
   */
  private buildMediaUrl(fileType: string = 'original'): string {
    const url = ImageViewerDialog.buildMediaUrl(this.projectId, this.mediaId, fileType)
    return url
  }



  /**
   * Get the zoom display URL for the modal
   */
  private getZoomDisplayUrl(): string {
    if (this.is3DFile()) {
      return this.buildMediaUrl('original')
    }
    if (this.isVideoFile()) {
      return this.buildMediaUrl('original')
    }
    
          // For zoom modal, prefer original quality unless it's TIFF
      if (this.isOriginalTiffFile()) {
        // For TIFF files, use 'large' which should be converted to JPEG
        return this.buildMediaUrl('large')
      }
    
    // For non-TIFF images, use original quality
    return this.buildMediaUrl('original')
  }

  /**
   * Get the video MIME type (default to mp4 as it's most common)
   */
  private getVideoMimeType(): string {
    return 'video/mp4'
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(window, EventType.RESIZE, () =>
      this.onHandleResize()
    )
    
    // Setup media element after the dialog is in the document
    this.setupMediaElement()
  }

  override dispose() {
    this.metaViewport.setAttribute('content', '')
    this.cleanupMediaElement()
    this.cleanupAnnotations()
    super.dispose()
  }



  /**
   * Cleanup current media element
   */
  private cleanupMediaElement() {
    if (this.currentMediaElement) {
      if (this.currentMediaElement.tagName === 'VIDEO') {
        const video = this.currentMediaElement as HTMLVideoElement
        video.pause()
        video.src = ''
        video.load()
      }
      this.currentMediaElement = null
    }
  }

  /**
   * Cleanup annotation component
   */
  private cleanupAnnotations() {
    if (this.annotationMountingUtility) {
      vueMountingRegistry.unregister(this.annotationMountingUtility)
      this.annotationMountingUtility.unmount()
      this.annotationMountingUtility = null
    }
    
    // Clean up simple image viewer
    if (this.simpleImageViewer) {
      this.simpleImageViewer.dispose()
      this.simpleImageViewer = null
    }
    
    // Clean up metadata container that's inside the annotation container
    if (this.annotationContainer) {
      const metadataContainer = this.annotationContainer.querySelector('.media-metadata-container') as HTMLElement
      if (metadataContainer) {
        this.annotationContainer.removeChild(metadataContainer)
      }
    }
    
    this.annotationContainer = null
  }

  /**
   * Handles events from resizing the window.
   */
  protected onHandleResize() {
    const windowDimensionHeight = document.documentElement.clientHeight
    const windowDimensionWidth = document.documentElement.clientWidth
    
    const viewer = this.getElementByClass<HTMLElement>('media-viewer-container')
    
    // For annotations, the modal CSS handles the sizing using viewport units
    // We just need to ensure the container takes full available space
    if (viewer) {
      mb.setElementStyle(viewer, 'height', '100%')
      mb.setElementStyle(viewer, 'width', '100%')
    }
  }

  /**
   * Creates the media content HTML
   */
  private createMediaContent(): string {
    return `
      <div class="media-viewer-container">
        <div class="loading-overlay" style="display: flex;">
          <div class="loading-spinner"></div>
          <p>Loading media...</p>
        </div>
        <div class="error-overlay" style="display: none;">
          <div class="error-content">
            <p class="error-message">Failed to load media</p>
            <button class="btn btn-primary retry-btn">Retry</button>
          </div>
        </div>
        <div class="media-content" style="display: none;"></div>
        <div class="annotation-viewer-container" style="display: none;">
          <!-- AnnotationViewer component will be mounted here first -->
          <!-- Metadata container will be dynamically appended at the bottom -->
          <!-- Structure: [AnnotationViewer Component] [Metadata Container] -->
        </div>
      </div>
    `
  }

  /**
   * Setup the appropriate media element after DOM creation
   */
  private setupMediaElement() {
    try {
      // Use getElementByClass to follow matrix editor patterns
      const container = this.getElementByClass<HTMLElement>('media-content')
      const loadingOverlay = this.getElementByClass<HTMLElement>('loading-overlay')
      const errorOverlay = this.getElementByClass<HTMLElement>('error-overlay')
      const retryBtn = this.getElementByClass<HTMLElement>('retry-btn')

      if (!container || !loadingOverlay || !errorOverlay) {
        console.error('Required DOM elements not found', {
          container: !!container,
          loadingOverlay: !!loadingOverlay,
          errorOverlay: !!errorOverlay
        })
        return
      }

      // Setup retry button
      if (retryBtn) {
        retryBtn.onclick = () => {
          this.setupMediaElement()
        }
      }

      // Clean up any existing media element
      this.cleanupMediaElement()
      container.innerHTML = ''

      // Create the media viewer - the server will handle file serving

      // Create the viewer regardless of metadata availability
      this.createMediaViewer(container, loadingOverlay, errorOverlay)

    } catch (error) {
      console.error('Failed to setup media element:', error)
      this.showError('Failed to load media: ' + (error as Error).message)
    }
  }

  /**
   * Create the appropriate media viewer based on detected type
   */
  private createMediaViewer(container: HTMLElement, loadingOverlay: HTMLElement, errorOverlay: HTMLElement) {
  
    if (this.is3DFile()) {
      this.create3DViewer(container)
    } else if (this.isVideoFile()) {
      this.createVideoPlayer(container)
    } else {
      this.createImageViewer(container)
    }

    // Show content, hide loading
    loadingOverlay.style.display = 'none'
    errorOverlay.style.display = 'none'
    container.style.display = 'flex'

    // Setup annotations for image viewers (not for 3D files or videos)
    if (!this.is3DFile() && !this.isVideoFile()) {
      this.setupAnnotations()
    }
  }



  /**
   * Create 3D file viewer (placeholder with icon)
   */
  private create3DViewer(container: HTMLElement) {
    const viewer = document.createElement('div')
    viewer.className = 'threejs-viewer-placeholder'
    viewer.innerHTML = `
      <div class="threejs-content">
        <img src="/images/3DImage.png" alt="3D Model" class="threejs-icon" />
        <p>3D Model</p>
        <p class="format-info">Format: 3D</p>
        <button class="btn btn-secondary download-btn">Download Original File</button>
      </div>
    `

    const downloadBtn = viewer.querySelector('.download-btn') as HTMLButtonElement
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        this.downloadOriginalFile()
      }
    }

    container.appendChild(viewer)
    this.currentMediaElement = viewer
  }

  /**
   * Create video player
   */
  private createVideoPlayer(container: HTMLElement) {
    const videoContainer = document.createElement('div')
    videoContainer.className = 'video-player-container'

    const video = document.createElement('video')
    video.className = 'video-player'
    video.controls = true
    video.preload = 'auto'
    video.crossOrigin = 'anonymous'
    video.muted = false
    video.playsInline = true

    const source = document.createElement('source')
    source.src = this.getZoomDisplayUrl()
    source.type = this.getVideoMimeType()

    const fallbackText = document.createElement('p')
    fallbackText.textContent = "Your browser doesn't support video playback."

    video.appendChild(source)
    video.appendChild(fallbackText)
    videoContainer.appendChild(video)

    // Add event listeners
    video.onerror = (event) => {
      const videoUrl = this.getZoomDisplayUrl()
      console.error('Video failed to load:', videoUrl, event)
      this.showError(`Failed to load video: ${videoUrl}`)
    }

    video.onloadedmetadata = () => {
      const videoUrl = this.getZoomDisplayUrl()
    }

    container.appendChild(videoContainer)
    this.currentMediaElement = video
  }

  /**
   * Create image viewer
   */
  private createImageViewer(container: HTMLElement) {
    const imgContainer = document.createElement('div')
    imgContainer.className = 'image-viewer-container'

    const img = document.createElement('img')
    img.className = 'image-viewer'
    img.src = this.getZoomDisplayUrl()
    img.alt = 'Media Image'

    img.onerror = (event) => {
      const imageUrl = this.getZoomDisplayUrl()
      console.error('Image failed to load:', imageUrl, event)
      this.showError(`Failed to load image: ${imageUrl}`)
    }

    img.onload = () => {
      const imageUrl = this.getZoomDisplayUrl()
    }

    imgContainer.appendChild(img)
    container.appendChild(imgContainer)
    this.currentMediaElement = img
  }

  /**
   * Show error state
   */
  private showError(message: string) {
    const loadingOverlay = this.getElementByClass<HTMLElement>('loading-overlay')
    const errorOverlay = this.getElementByClass<HTMLElement>('error-overlay')
    const errorMessage = this.getElementByClass<HTMLElement>('error-message')
    const mediaContent = this.getElementByClass<HTMLElement>('media-content')

    if (loadingOverlay) loadingOverlay.style.display = 'none'
    if (mediaContent) mediaContent.style.display = 'none'
    if (errorMessage) errorMessage.textContent = message
    if (errorOverlay) errorOverlay.style.display = 'flex'
  }

  /**
   * Setup annotations for image viewer
   */
  private async setupAnnotations() {
    try {
      // Get the annotation container
      this.annotationContainer = this.getElementByClass<HTMLElement>('annotation-viewer-container')
      
      if (!this.annotationContainer) {
        console.error('Annotation container not found')
        return
      }

      // Dynamic import of the AnnotationViewer component
      let AnnotationViewer
      try {
        // First try the relative path
        const module = await import('../../../../components/media/AnnotationViewer.vue')
        AnnotationViewer = module.default
      } catch (importError) {
        console.error('Failed to import AnnotationViewer component via relative path:', importError)
        // Try alternative import paths in case of build/path issues
        try {
          const altModule = await import('@/components/media/AnnotationViewer.vue')
          AnnotationViewer = altModule.default
        } catch (altImportError) {
          console.error('Alternative @ alias import also failed:', altImportError)
          throw new Error('Could not load AnnotationViewer component - both import methods failed')
        }
      }

      if (!AnnotationViewer) {
        throw new Error('AnnotationViewer component is null or undefined after import')
      }
      
      // Create mounting utility
      this.annotationMountingUtility = new VueMountingUtility()
      vueMountingRegistry.register(this.annotationMountingUtility)

      // Build media URL for the annotation viewer
      const mediaUrl = this.getZoomDisplayUrl()
      
      // Mount the AnnotationViewer component
      await this.annotationMountingUtility.mount(this.annotationContainer, {
        component: AnnotationViewer,
        props: {
          mediaId: this.mediaId,
          projectId: this.projectId,
          mediaUrl: mediaUrl,
          type: this.type,
          linkId: this.linkId, // Pass the cell link_id for matrix cells
          canEdit: !this.readonly,
          contextType: null,
          contextId: null,
          published: this.published // Pass published state to AnnotationViewer
        },
        withPinia: true
      })

      // Show the annotation container
      this.annotationContainer.style.display = 'flex'

      // Hide the regular media content since annotations will handle the image display
      const mediaContent = this.getElementByClass<HTMLElement>('media-content')
      if (mediaContent) {
        mediaContent.style.display = 'none'
      }

      // Setup media metadata section at the bottom of the annotation viewer
      // Add a small delay to ensure AnnotationViewer has fully mounted
      setTimeout(async () => {
        // Only setup metadata if we have the full AnnotationViewer (not SimpleImageViewer)
        if (this.annotationMountingUtility && !this.simpleImageViewer) {
          await this.setupMediaMetadata()
        }
      }, 100)

    } catch (error) {
      console.error('Failed to setup annotations:', error)
      
      // If annotation setup fails, use SimpleImageViewer as fallback
      const mediaContent = this.getElementByClass<HTMLElement>('media-content')
      if (this.annotationContainer) {
        
        try {
          // Use the SimpleImageViewer as a fallback
          const mediaUrl = this.getZoomDisplayUrl()
          this.simpleImageViewer = new SimpleImageViewer(
            this.annotationContainer, 
            mediaUrl, 
            this.mediaId, 
            this.projectId
          )
          this.simpleImageViewer.render()
          
          // Show the annotation container (which now contains the simple viewer)
          this.annotationContainer.style.display = 'flex'
          
          // Hide the regular media content
          if (mediaContent) {
            mediaContent.style.display = 'none'
          }
          
        } catch (fallbackError) {
          console.error('SimpleImageViewer fallback also failed:', fallbackError)
          
          // Last resort: show regular image viewer
          if (mediaContent && this.annotationContainer) {
            mediaContent.style.display = 'flex'
            this.annotationContainer.style.display = 'none'
          }
        }
      }
      
      // Clean up any partially created annotation resources
      if (this.annotationMountingUtility) {
        try {
          vueMountingRegistry.unregister(this.annotationMountingUtility)
          this.annotationMountingUtility.unmount()
        } catch (cleanupError) {
          console.warn('Error cleaning up annotation mounting utility:', cleanupError)
        }
        this.annotationMountingUtility = null
      }
    }
  }

  /**
   * Setup media metadata section at the bottom of the annotation viewer
   * Creates a metadata container as a child of the annotation-viewer-container
   * so it appears below the AnnotationViewer component using flexbox layout
   */
  private async setupMediaMetadata() {
    try {
      // Create metadata container as a child of the annotation viewer container
      const annotationContainer = this.getElementByClass<HTMLElement>('annotation-viewer-container')
      
      if (!annotationContainer) {
        console.error('Annotation container not found for metadata')
        return
      }

      // Create the metadata container element
      const metadataContainer = document.createElement('div')
      metadataContainer.className = 'media-metadata-container'
      
      metadataContainer.innerHTML = `
        <div class="media-metadata-content">
          <div class="metadata-loading">Loading metadata...</div>
          <div class="metadata-info" style="display: none;"></div>
        </div>
      `
      
      // Append to the annotation container so it appears at the bottom
      annotationContainer.appendChild(metadataContainer)

      // Get the newly created elements
      const metadataLoading = metadataContainer.querySelector('.metadata-loading') as HTMLElement
      const metadataInfo = metadataContainer.querySelector('.metadata-info') as HTMLElement

      if (!metadataLoading || !metadataInfo) {
        console.error('Failed to create metadata elements')
        return
      }

      // Fetch metadata
      const metadata = await this.fetchMediaMetadata()
      
      // Generate metadata HTML
      const metadataHtml = this.generateMetadataHtml(metadata)
      
      // Update content
      metadataInfo.innerHTML = metadataHtml
      metadataLoading.style.display = 'none'
      metadataInfo.style.display = 'flex'
      
    } catch (error) {
      console.error('Failed to setup media metadata:', error)
      // On error, try to remove any partially created metadata container
      const annotationContainer = this.getElementByClass<HTMLElement>('annotation-viewer-container')
      if (annotationContainer) {
        const metadataContainer = annotationContainer.querySelector('.media-metadata-container') as HTMLElement
        if (metadataContainer) {
          annotationContainer.removeChild(metadataContainer)
        }
      }
    }
  }

  /**
   * Fetch detailed media metadata using the new comprehensive details API
   */
  private async fetchMediaMetadata(): Promise<any> {
    try {
      // Use the correct API endpoint based on whether the project is published
      const baseUrl = this.published 
        ? `${(import.meta as any).env.VITE_API_URL}/public/projects/${this.projectId}/media/${this.mediaId}/details`
        : `${(import.meta as any).env.VITE_API_URL}/projects/${this.projectId}/media/${this.mediaId}/details`
      
      // Add linkId as query parameter if available for character information
      let mediaUrl = baseUrl
      if (this.linkId) {
        mediaUrl += `?link_id=${this.linkId}`
      }

      const response = await fetch(mediaUrl, {
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'same-origin'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch media details: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // The new API returns comprehensive data including:
      // - view_name: actual view name instead of just view_id
      // - specimen_display: proper specimen information built from database fields
      // - copyright_holder: resolved copyright holder name
      // - character_info: character and state details when linkId is provided
      const metadata = {
        ...this.mediaData,
        ...data.media,
        mediaId: this.mediaId,
        projectId: this.projectId,
        linkId: this.linkId
      }
      
      return metadata
    } catch (error) {
      console.error('Error fetching detailed media metadata:', error)
      
      // Fallback to basic API if detailed API fails
      try {
        const basicUrl = `${(import.meta as any).env.VITE_API_URL}/projects/${this.projectId}/media/${this.mediaId}`
        const basicResponse = await fetch(basicUrl, {
          headers: { 'Accept': 'application/json' },
          credentials: 'same-origin'
        })
        
        if (basicResponse.ok) {
          const basicData = await basicResponse.json()
          return {
            ...this.mediaData,
            ...basicData.media,
            mediaId: this.mediaId,
            projectId: this.projectId,
            linkId: this.linkId
          }
        }
      } catch (fallbackError) {
        console.warn('Fallback API also failed:', fallbackError)
      }
      
      // Return basic metadata even on error
      return {
        mediaId: this.mediaId,
        projectId: this.projectId,
        linkId: this.linkId,
        ...this.mediaData
      }
    }
  }

  /**
   * Generate HTML for metadata display with explicit 2-column layout
   */
  private generateMetadataHtml(metadata: any): string {
    const leftColumnItems: string[] = []
    const rightColumnItems: string[] = []
    
    // LEFT COLUMN: Basic media information
    
    // Media ID
    leftColumnItems.push(`<div class="metadata-item">
      <strong>Media #:</strong> M${metadata.mediaId}
    </div>`)

    // Media View
    if (metadata.view_name) {
      leftColumnItems.push(`<div class="metadata-item">
        <strong>View:</strong> ${this.escapeHtml(metadata.view_name)}
      </div>`)
    } else if (metadata.view_id) {
      leftColumnItems.push(`<div class="metadata-item">
        <strong>View:</strong> View ID ${metadata.view_id}
      </div>`)
    }

    let isCopyrighted = metadata.is_copyrighted === 1 || metadata.is_copyrighted === true
    
    const copyrightImageHtml = getCopyrightImageHtml(
      metadata.copyright_permission,
      metadata.copyright_license,
      isCopyrighted
    )
    leftColumnItems.push(`<div class="metadata-item">
      <strong>Copyright:</strong> ${copyrightImageHtml}
    </div>`)
    
    if (isCopyrighted) {
      if (metadata.copyright_holder) {
        leftColumnItems.push(`<div class="metadata-item">
            <strong>Copyright holder:</strong> ${this.escapeHtml(metadata.copyright_holder)}
          </div>`)
      }
    }
    
    // RIGHT COLUMN: Specimen and context information
    
    // Specimen information - using the complete specimen name from enhanced API
    if (metadata.specimen_display) {
      // Use the complete specimen name (taxon name + institutional identifier)
      // Don't escape HTML for specimen display since it contains intentional scientific name formatting
      rightColumnItems.push(`<div class="metadata-item">
        <strong>Specimen:</strong> ${this.sanitizeScientificHtml(metadata.specimen_display)}
      </div>`)
    } else if (metadata.specimen_id) {
      // Final fallback to specimen ID
      rightColumnItems.push(`<div class="metadata-item">
        <strong>Specimen:</strong> S${metadata.specimen_id}
      </div>`)
    }
    
    // Specimen notes - additional description if available
    // if (metadata.specimen_notes) {
    //   rightColumnItems.push(`<div class="metadata-item">
    //     <strong>Specimen Notes:</strong> ${this.escapeHtml(metadata.specimen_notes)}
    //   </div>`)
    // }
    
    // Character information - using the pre-formatted display from backend
    if (metadata.character_display) {
      const characterText = metadata.character_display
      rightColumnItems.push(`<div class="metadata-item">
        <strong>Character:</strong> ${this.escapeHtml(characterText)}
      </div>`)
    }
    
    // Direct taxon context - when media is associated with a taxon outside character context
    if (metadata.taxon_display) {
      rightColumnItems.push(`<div class="metadata-item">
        <strong>Taxon:</strong> ${this.sanitizeScientificHtml(metadata.taxon_display)}
      </div>`)
    }
    
    // Media notes - additional notes about the specific media file
    if (metadata.media_notes) {
      rightColumnItems.push(`<div class="metadata-item">
        <strong>Media Notes:</strong> ${this.escapeHtml(metadata.media_notes)}
      </div>`)
    }
    
    // Create the 2-column layout HTML structure
    return `
      <div class="metadata-column metadata-column-left">
        ${leftColumnItems.join('')}
      </div>
      <div class="metadata-column metadata-column-right">
        ${rightColumnItems.join('')}
      </div>
    `
  }

  /**
   * Generate public copyright image HTML for non-copyrighted content
   */
  private generatePublicCopyrightImageHtml(): string {
    return `<img src="/images/CC-0.png" title="Public Domain" style="max-width: 88px; height: auto; object-fit: contain; vertical-align: middle;" alt="Public Domain" />`
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * Sanitize HTML while preserving safe scientific formatting tags
   * Allows <i>, <em>, <b>, <strong> for scientific names but escapes everything else
   */
  private sanitizeScientificHtml(text: string): string {
    if (!text) return ''
    
    // First escape all HTML
    let sanitized = this.escapeHtml(text)
    
    // Then selectively unescape safe scientific formatting tags
    sanitized = sanitized
      .replace(/&lt;i&gt;/g, '<i>')
      .replace(/&lt;\/i&gt;/g, '</i>')
      .replace(/&lt;em&gt;/g, '<em>')
      .replace(/&lt;\/em&gt;/g, '</em>')
      .replace(/&lt;b&gt;/g, '<b>')
      .replace(/&lt;\/b&gt;/g, '</b>')
      .replace(/&lt;strong&gt;/g, '<strong>')
      .replace(/&lt;\/strong&gt;/g, '</strong>')
    
    return sanitized
  }

  /**
   * Download original file
   */
  private downloadOriginalFile() {
    const downloadUrl = this.buildMediaUrl('original')
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `media_${this.mediaId}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Inject CSS styles for the media viewer
   */
  private injectStyles() {
    const styleId = 'media-viewer-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      /* Annotation Viewer Modal Size Overrides */
      .modal-annotation-viewer {
        --bs-modal-width: 95vw;
        max-width: 95vw;
      }
      
      .modal-annotation-viewer .modal-content {
        height: 90vh;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
      }
      
      .modal-annotation-viewer .modal-body {
        flex: 1;
        overflow: hidden;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
      
      .modal-annotation-viewer .modal-header {
        flex-shrink: 0;
        border-bottom: 1px solid #dee2e6;
        padding: 1rem 1.5rem;
      }
      
      .modal-annotation-viewer .modal-footer {
        flex-shrink: 0;
        display: none; /* Hide footer for annotation viewer */
      }
      
      /* Ensure fullscreen-like experience on smaller screens */
      @media (max-width: 992px) {
        .modal-annotation-viewer {
          --bs-modal-width: 100vw;
          max-width: 100vw;
          margin: 0;
        }
        
        .modal-annotation-viewer .modal-content {
          height: 100vh;
          max-height: 100vh;
          border-radius: 0;
        }
        
        .modal-annotation-viewer .modal-header {
          padding: 0.75rem 1rem;
        }
      }

      .mediaViewer .media-viewer-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        position: relative;
        background: #f8f9fa;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .mediaViewer.with-annotations .media-viewer-container {
        min-height: 100%;
        height: 100%;
        align-items: stretch;
        flex: 1;
        border-radius: 0;
      }

      .mediaViewer .loading-overlay,
      .mediaViewer .error-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: rgba(248, 249, 250, 0.95);
        z-index: 10;
      }

      .mediaViewer .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .mediaViewer .error-overlay {
        color: #dc3545;
      }

      .mediaViewer .error-content {
        text-align: center;
      }

      .mediaViewer .media-content {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .mediaViewer .annotation-viewer-container {
        width: 100%;
        height: 100%;
        min-height: 700px;
        position: relative;
        display: flex;
        flex-direction: column;
      }
      
      .mediaViewer.with-annotations .annotation-viewer-container {
        flex: 1;
        min-height: 100%;
        height: 100%;
      }

      /* Ensure the AnnotationViewer component takes available space */
      .mediaViewer .annotation-viewer-container > :first-child:not(.media-metadata-container) {
        flex: 1;
        min-height: 0; /* Allow shrinking */
      }

      /* Media metadata section styles - positioned at bottom of annotation viewer */
      .mediaViewer .media-metadata-container {
        width: 100%;
        border-top: 2px solid #dee2e6;
        background-color: #f1f3f4;
        padding: 0.6rem 0.75rem;
        flex-shrink: 0; /* Don't shrink */
        order: 999; /* Always appear at the bottom */
        position: relative;
        z-index: 10;
        box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.05);
      }

      .mediaViewer .media-metadata-content {
        max-width: 100%;
      }

      .mediaViewer .metadata-loading {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        font-size: 0.75rem;
      }

      .mediaViewer .metadata-info {
        display: flex;
        gap: 1rem;
      }

      .mediaViewer .metadata-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .mediaViewer .metadata-column-left {
        /* Left column for basic media info */
      }

      .mediaViewer .metadata-column-right {
        /* Right column for specimen and character info */
      }

      .mediaViewer .metadata-item {
        display: flex;
        align-items: flex-start;
        gap: 0.25rem;
        font-size: 0.75rem;
        line-height: 1.3;
      }

      .mediaViewer .metadata-item strong {
        min-width: 75px;
        flex-shrink: 0;
        color: #495057;
        font-weight: 600;
        font-size: 0.72rem;
      }

      .mediaViewer .metadata-item > :not(strong) {
        color: #212529;
        word-break: break-word;
        font-size: 0.73rem;
      }

      /* Copyright icon styling */
      .mediaViewer .metadata-item img {
        vertical-align: middle;
        margin-left: 0.25rem;
        border: 1px solid #dee2e6;
        border-radius: 3px;
        background-color: white;
      }

      /* Scientific name (taxonomic) styling */
      .mediaViewer .metadata-item em {
        font-style: italic;
        color: #495057;
        font-weight: normal;
      }

      /* Responsive metadata layout - stack columns on small screens */
      @media (max-width: 480px) {
        .mediaViewer .metadata-info {
          flex-direction: column;
          gap: 0.4rem;
        }

        .mediaViewer .metadata-column {
          gap: 0.4rem;
        }

        .mediaViewer .metadata-item {
          flex-direction: column;
          gap: 0.1rem;
          font-size: 0.7rem;
        }

        .mediaViewer .metadata-item strong {
          min-width: auto;
        }

        .mediaViewer .media-metadata-container {
          padding: 0.5rem;
        }
      }

      /* Image viewer styles */
      .mediaViewer .image-viewer-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
      }

      .mediaViewer .image-viewer {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 4px;
      }

      /* Video player styles */
      .mediaViewer .video-player-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        background-color: #000;
        border-radius: 8px;
      }

      .mediaViewer .video-player {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        border-radius: 4px;
      }

      /* 3D viewer placeholder styles */
      .mediaViewer .threejs-viewer-placeholder {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
      }

      .mediaViewer .threejs-content {
        text-align: center;
        padding: 2rem;
      }

      .mediaViewer .threejs-icon {
        width: 80px;
        height: 80px;
        margin-bottom: 1rem;
        filter: brightness(0) invert(1);
      }

      .mediaViewer .format-info {
        margin: 0.5rem 0;
        opacity: 0.8;
        font-size: 0.9rem;
      }

      .mediaViewer .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        margin-top: 1rem;
      }

      .mediaViewer .btn-primary {
        background-color: #007bff;
        color: white;
      }

      .mediaViewer .btn-secondary {
        background-color: #6c757d;
        color: white;
      }

      .mediaViewer .btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .mediaViewer .media-viewer-container {
          min-height: 300px;
        }
        
        .mediaViewer.with-annotations .media-viewer-container {
          min-height: 500px;
        }
        
        .mediaViewer .annotation-viewer-container {
          min-height: 500px;
        }
        
        .mediaViewer.with-annotations .annotation-viewer-container {
          min-height: 450px;
        }
        
        .mediaViewer .threejs-content {
          padding: 1rem;
        }
        
        .mediaViewer .threejs-icon {
          width: 60px;
          height: 60px;
        }
      }
      
      @media (max-width: 480px) {
        .mediaViewer.with-annotations .media-viewer-container {
          min-height: 400px;
        }
        
        .mediaViewer.with-annotations .annotation-viewer-container {
          min-height: 350px;
        }
      }
    `
    document.head.appendChild(style)
  }

  override createDom() {
    super.createDom()
    
    // Inject styles first
    this.injectStyles()
    
    const contentElement = this.getContentElement()
    contentElement.classList.add('mediaViewer')
    
    // Always add annotation-specific class since annotations are always enabled
    contentElement.classList.add('with-annotations')
    
    // Get the modal dialog element and add annotation-specific classes
    const element = this.getElement()
    const modalDialog = element.querySelector('.modal-dialog')
    
    if (modalDialog) {
      modalDialog.classList.add('modal-xl', 'modal-annotation-viewer')
    }
    
    contentElement.innerHTML = this.createMediaContent()
    this.metaViewport.setAttribute(
      'content',
      'width=device-width, minimum-scale=1.0, maximum-scale=1.0, initial-scale=1.0, user-scalable=no, shrink-to-fit=no'
    )

    // determine the max height of the dialog allowed
    this.onHandleResize()
  }

  /**
   * Static utility method to build media URLs (matches Vue frontend buildMediaUrl)
   * Can be used by other matrix editor components
   */
  static buildMediaUrl(projectId: number | string, mediaId: number | string, fileType: string = 'original'): string {
    if (!projectId || !mediaId) {
      return '/public/images/image-not-found.png'
    }
    
    // Get the API URL base
    return `${
      (import.meta as any).env.VITE_API_URL
    }/public/media/${projectId}/serve/${mediaId}/${fileType}`
  }

  /**
   * Static utility method to extract project ID from URL or global context
   * @returns The derived project ID or default fallback (1)
   */
  static deriveProjectId(): number {
    let projectId = 1 // Default fallback
    
    // Try multiple URL patterns to extract project ID
    const currentUrl = window.location.pathname + window.location.search + window.location.hash
    
    // Pattern 1: /projects/{id} (standard)
    let urlMatch = currentUrl.match(/\/projects\/(\d+)/)
    if (urlMatch) {
      projectId = parseInt(urlMatch[1], 10)
    } else {
      // Pattern 2: matrix editor URLs might have projectId in query params
      urlMatch = currentUrl.match(/[?&]project[_-]?id=(\d+)/i)
      if (urlMatch) {
        projectId = parseInt(urlMatch[1], 10)
      } else {
        // Pattern 3: check for any numeric ID in the URL that could be project ID
        const allNumbers = currentUrl.match(/\d+/g)
        if (allNumbers && allNumbers.length > 0) {
          // Try to find a reasonable project ID (usually 3-4 digits)
          const potentialProjectIds = allNumbers.filter(num => num.length >= 2 && num.length <= 5)
          if (potentialProjectIds.length > 0) {
            projectId = parseInt(potentialProjectIds[0], 10)
          }
        }
      }
    }
    
    // Additional check: try to get from matrix model or global context
    if (projectId === 1 && typeof window !== 'undefined') {
      // Check if there's a global project ID available
      if ((window as any).PROJECT_ID) {
        projectId = (window as any).PROJECT_ID
      } else if ((window as any).mb && (window as any).mb.projectId) {
        projectId = (window as any).mb.projectId
      }
    }
    
    return projectId
  }



  /**
   * Displays the media viewer
   * @param type The type of the media to display
   * @param id The id of the media to display
   * @param projectIdOrReadonly Project ID (new signature) or readonly flag (old signature)
   * @param mediaData Optional media metadata for smart URL selection
   * @param readonly Whether the image viewer should be immutable
   * @param linkId Optional link ID for matrix cell context
   * @param published Whether the project is published (for correct API endpoint)
   */
  static show(
    type: string, 
    id: number, 
    projectIdOrReadonly?: number | boolean | null,
    mediaData?: any,
    readonly?: boolean | null,
    linkId?: number | null,
    published?: boolean
  ) {
    // Handle backwards compatibility with old signature: show(type, id, readonly)
    let projectId: number
    let actualReadonly: boolean
    let actualMediaData: any
    
    let actualLinkId: number | null
    let actualPublished: boolean
    
    if (typeof projectIdOrReadonly === 'number' || projectIdOrReadonly === null) {
      // New signature: show(type, id, projectId, mediaData?, readonly?, linkId?, published?)
      // projectId can be a number or null (null means derive from URL)
      if (projectIdOrReadonly === null) {
        // Derive project ID from URL when null is passed
        projectId = ImageViewerDialog.deriveProjectId()
      } else {
        projectId = projectIdOrReadonly as number
      }
      actualMediaData = mediaData
      actualReadonly = !!readonly
      actualLinkId = linkId || null
      actualPublished = !!published
    } else {
      // Old signature: show(type, id, readonly?) - need to derive projectId
      projectId = ImageViewerDialog.deriveProjectId()
      actualMediaData = {}
      actualReadonly = !!projectIdOrReadonly
      actualLinkId = null // Old signature doesn't support linkId
      actualPublished = false // Old signature defaults to false
    }
    
    const viewer = new ImageViewerDialog(type, id, projectId, actualMediaData, actualReadonly, actualLinkId, actualPublished)
    viewer.setVisible(true)
  }
}
