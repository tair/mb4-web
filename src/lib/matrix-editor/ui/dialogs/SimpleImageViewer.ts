/**
 * Simple fallback image viewer when AnnotationViewer fails to load
 * This provides basic image viewing functionality without annotations
 */
export class SimpleImageViewer {
  private container: HTMLElement
  private mediaUrl: string
  private mediaId: number
  private projectId: number
  
  constructor(container: HTMLElement, mediaUrl: string, mediaId: number, projectId: number) {
    this.container = container
    this.mediaUrl = mediaUrl
    this.mediaId = mediaId
    this.projectId = projectId
  }
  
  render(): void {
    this.container.innerHTML = `
      <div class="simple-image-viewer">
        <div class="simple-image-container">
          <img src="${this.mediaUrl}" alt="Media Image" class="simple-image" />
        </div>
        <div class="simple-image-info">
          <p class="simple-image-notice">
            <strong>Note:</strong> Advanced annotation features are temporarily unavailable. 
            Basic image viewing is enabled.
          </p>
          <p class="simple-image-details">
            Media ID: M${this.mediaId} | Project: ${this.projectId}
          </p>
        </div>
      </div>
    `
    
    this.addStyles()
    this.setupImageHandlers()
  }
  
  private addStyles(): void {
    const styleId = 'simple-image-viewer-styles'
    if (document.getElementById(styleId)) return
    
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .simple-image-viewer {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #f8f9fa;
      }
      
      .simple-image-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background-color: #ffffff;
      }
      
      .simple-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        cursor: zoom-in;
      }
      
      .simple-image.zoomed {
        cursor: zoom-out;
        transform: scale(2);
        transition: transform 0.3s ease;
      }
      
      .simple-image-info {
        padding: 0.75rem;
        background-color: #f8f9fa;
        border-top: 1px solid #dee2e6;
        flex-shrink: 0;
      }
      
      .simple-image-notice {
        margin: 0 0 0.5rem 0;
        padding: 0.5rem;
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #856404;
      }
      
      .simple-image-details {
        margin: 0;
        font-size: 0.8rem;
        color: #6c757d;
        text-align: center;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .simple-image-container {
          padding: 0.5rem;
        }
        
        .simple-image-info {
          padding: 0.5rem;
        }
        
        .simple-image-notice {
          font-size: 0.8rem;
        }
        
        .simple-image-details {
          font-size: 0.75rem;
        }
      }
    `
    document.head.appendChild(style)
  }
  
  private setupImageHandlers(): void {
    const img = this.container.querySelector('.simple-image') as HTMLImageElement
    if (!img) return
    
    let isZoomed = false
    
    img.addEventListener('click', () => {
      if (isZoomed) {
        img.classList.remove('zoomed')
        isZoomed = false
      } else {
        img.classList.add('zoomed')
        isZoomed = true
      }
    })
    
    // Handle image load errors
    img.addEventListener('error', () => {
      img.alt = 'Failed to load image'
      img.style.border = '2px dashed #dc3545'
      img.style.padding = '2rem'
      img.style.backgroundColor = '#f8d7da'
    })
  }
  
  dispose(): void {
    // Clean up any event listeners if needed
    const img = this.container.querySelector('.simple-image') as HTMLImageElement
    if (img) {
      img.removeEventListener('click', this.setupImageHandlers)
      img.removeEventListener('error', this.setupImageHandlers)
    }
  }
}
