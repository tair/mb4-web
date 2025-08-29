import * as mb from '../../mb'
import { Modal } from '../Modal'
import { EventType } from '../Component'
import { VueMountingUtility, vueMountingRegistry } from '../VueMountingUtility'

/**
 * Advanced Media Viewer with support for images, videos, and 3D files
 *
 * @param type The type of the media to display
 * @param id The id of the media to display
 * @param projectId The project ID for building media URLs
 * @param mediaData Optional media metadata for smart URL selection
 * @param readonly Whether the image viewer should be immutable
 */
export class ImageViewerDialog extends Modal {
  /**
   * The min dialog height for simple media viewing
   */
  private static MIN_DIALOG_HEIGHT: number = 400

  /**
   * The min dialog height when annotations are enabled
   */
  private static MIN_DIALOG_HEIGHT_WITH_ANNOTATIONS: number = 700

  /**
   * The max dialog height for simple media viewing
   */
  private static MAX_DIALOG_HEIGHT: number = 800

  /**
   * The max dialog height when annotations are enabled (90% of viewport)
   */
  private static MAX_DIALOG_HEIGHT_WITH_ANNOTATIONS_RATIO: number = 0.9

  /**
   * The size of the dialog's header + borders + 2px slack
   */
  private static HEADER_PADDING: number = 60

  /**
   * Additional padding for annotation interface elements
   */
  private static ANNOTATION_UI_PADDING: number = 40

  private readonly type: string
  private readonly id: number
  private readonly projectId: number
  private mediaData: any
  private readonly readonly: boolean
  private readonly metaViewport: Element
  private currentMediaElement: HTMLElement | null = null
  
  // Annotation functionality
  private annotationMountingUtility: VueMountingUtility | null = null
  private enableAnnotations: boolean = false
  private annotationContainer: HTMLElement | null = null

  constructor(
    type: string, 
    id: number, 
    projectId: number,
    mediaData?: any,
    readonly?: boolean | null,
    enableAnnotations?: boolean
  ) {
    super()

    this.type = type
    this.id = id
    this.projectId = projectId
    this.mediaData = mediaData || {}
    this.readonly = !!readonly
    this.enableAnnotations = !!enableAnnotations && !this.readonly
    this.metaViewport = document.querySelector(
      'meta[name="viewport"]'
    ) as Element
    
    // Set appropriate title based on functionality
    const title = this.enableAnnotations ? 'Media Annotation Viewer' : 'Media Viewer'
    this.setTitle(title)
    this.setDisposeOnHide(true)
  }



  /**
   * Media type constants (matches backend media-constants.js)
   */
  private static readonly MEDIA_TYPES = {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    MODEL_3D: '3d',
    STACKS: 'stacks'
  } as const

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
    const url = ImageViewerDialog.buildMediaUrl(this.projectId, this.id, fileType)
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
    this.annotationContainer = null
  }

  /**
   * Handles events from resizing the window.
   */
  protected onHandleResize() {
    const windowDimensionHeight = document.documentElement.clientHeight
    const windowDimensionWidth = document.documentElement.clientWidth
    
    const viewer = this.getElementByClass<HTMLElement>('media-viewer-container')
    
    if (this.enableAnnotations) {
      // For annotations, the modal CSS handles the sizing using viewport units
      // We just need to ensure the container takes full available space
      if (viewer) {
        mb.setElementStyle(viewer, 'height', '100%')
        mb.setElementStyle(viewer, 'width', '100%')
      }
    } else {
      // For simple media viewing, use the original sizing logic
      const minHeight = ImageViewerDialog.MIN_DIALOG_HEIGHT
      const totalPadding = ImageViewerDialog.HEADER_PADDING
      
      const possiblePaneHeight = Math.max(
        minHeight,
        windowDimensionHeight - totalPadding
      )
      
      const maxHeight = ImageViewerDialog.MAX_DIALOG_HEIGHT
      const height = Math.min(maxHeight, possiblePaneHeight)
      
      if (viewer) {
        mb.setElementStyle(viewer, 'height', height + 'px')

        // Calculate width constraints for simple media viewer
        setTimeout(() => {
          const element = this.getElement()
          if (element && windowDimensionWidth < element.offsetWidth) {
            const width = windowDimensionWidth - (ImageViewerDialog.HEADER_PADDING + 40)
            mb.setElementStyle(viewer, 'width', width + 'px')
          }
        })
      }
    }
  }

  /**
   * Creates the media content HTML
   */
  private createMediaContent(): string {
    const annotationContainer = this.enableAnnotations 
      ? '<div class="annotation-viewer-container" style="display: none;"></div>'
      : ''
    
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
        ${annotationContainer}
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

    // Setup annotations if enabled and image viewer was created
    if (this.enableAnnotations && !this.is3DFile() && !this.isVideoFile()) {
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
      const { default: AnnotationViewer } = await import('../../../../components/media/AnnotationViewer.vue')
      
      // Create mounting utility
      this.annotationMountingUtility = new VueMountingUtility()
      vueMountingRegistry.register(this.annotationMountingUtility)

      // Build media URL for the annotation viewer
      const mediaUrl = this.getZoomDisplayUrl()
      
      // Mount the AnnotationViewer component
      await this.annotationMountingUtility.mount(this.annotationContainer, {
        component: AnnotationViewer,
        props: {
          mediaId: this.id,
          projectId: this.projectId,
          mediaUrl: mediaUrl,
          type: this.type,
          linkId: null, // Could be enhanced to support specific link contexts
          canEdit: !this.readonly,
          contextType: null,
          contextId: null
        },
        withPinia: true
      })

      // Show the annotation container
      this.annotationContainer.style.display = 'block'

      // Hide the regular media content since annotations will handle the image display
      const mediaContent = this.getElementByClass<HTMLElement>('media-content')
      if (mediaContent) {
        mediaContent.style.display = 'none'
      }

    } catch (error) {
      console.error('Failed to setup annotations:', error)
      // If annotation setup fails, just continue without annotations
    }
  }

  /**
   * Download original file
   */
  private downloadOriginalFile() {
    const downloadUrl = this.buildMediaUrl('original')
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `media_${this.id}`
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
    
    // Add annotation-specific class if annotations are enabled
    if (this.enableAnnotations) {
      contentElement.classList.add('with-annotations')
    }
    
    // Get the modal dialog element and add annotation-specific classes
    const element = this.getElement()
    const modalDialog = element.querySelector('.modal-dialog')
    
    if (modalDialog && this.enableAnnotations) {
      modalDialog.classList.add('modal-xl', 'modal-annotation-viewer')
    } else if (modalDialog) {
      modalDialog.classList.add('modal-lg')
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
   * Displays the media viewer
   * @param type The type of the media to display
   * @param id The id of the media to display
   * @param projectIdOrReadonly Project ID (new signature) or readonly flag (old signature)
   * @param mediaData Optional media metadata for smart URL selection
   * @param readonly Whether the image viewer should be immutable
   * @param enableAnnotations Whether to enable annotation functionality
   */
  static show(
    type: string, 
    id: number, 
    projectIdOrReadonly?: number | boolean | null,
    mediaData?: any,
    readonly?: boolean | null,
    enableAnnotations?: boolean
  ) {
    
    // Handle backwards compatibility with old signature: show(type, id, readonly)
    let projectId: number
    let actualReadonly: boolean
    let actualMediaData: any
    let actualEnableAnnotations: boolean
    
    if (typeof projectIdOrReadonly === 'number') {
      // New signature: show(type, id, projectId, mediaData?, readonly?, enableAnnotations?)
      projectId = projectIdOrReadonly
      actualMediaData = mediaData
      actualReadonly = !!readonly
      actualEnableAnnotations = !!enableAnnotations
    } else {
      // Old signature: show(type, id, readonly?) - need to derive projectId
      projectId = 1 // Default fallback
      actualMediaData = {}
      actualReadonly = !!projectIdOrReadonly
      actualEnableAnnotations = false // Default to false for backwards compatibility
      
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
    }
    
    const viewer = new ImageViewerDialog(type, id, projectId, actualMediaData, actualReadonly, actualEnableAnnotations)
    viewer.setVisible(true)
  }
}
