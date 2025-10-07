import * as mb from '../mb'
import { Component, EventType, MobileFriendlyClickEventType } from './Component'
import { ImageViewerDialog } from './dialogs/ImageViewerDialog'

/**
 * The component that renders a series of scrollable images.
 *
 * @param type The type of the image
 */
export class ImageRenderer extends Component {
  private static readonly ARROW_UP_TEXT: string = '\u25b2'
  private static readonly ARROW_DOWN_TEXT: string = '\u25bc'

  private readonly type: string
  private projectId: number | null = null
  private cellId: number | null = null
  private isPublished: boolean = false

  private imageUrls: ImageRendererUrl[]
  private currentImageIndex: number
  private isReadOnly: boolean

  constructor(type: string) {
    super()

    this.type = type
    this.imageUrls = []
    this.currentImageIndex = 0
    this.isReadOnly = false
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
   * @param characterName optional character name for annotation context
   * @param stateName optional state name for annotation context
   * @param stateNumber optional state number for annotation context
   */
  addImage(id: number, url: string, caption?: string | null, mediaData?: any, characterName?: string | null, stateName?: string | null, stateNumber?: number | null) {
    const imageUrl: ImageRendererUrl = {
      id: id,
      url: url,
      caption: caption || null,
      mediaData: mediaData || null,
      characterName: characterName ?? null,
      stateName: stateName ?? null,
      stateNumber: stateNumber ?? null,  // Use ?? instead of || to preserve 0 values
    }

    this.imageUrls.push(imageUrl)
    return this
  }

  override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('imageThumbnail')
    element.innerHTML = this.htmlContent()
    if (this.imageUrls.length > 0) {
      const imageUrl = this.imageUrls[this.currentImageIndex]
      this.updateImage(imageUrl)
    }
    if (this.imageUrls.length > 1) {
      const downArrowElement =
        this.getElementByClass<HTMLElement>('imageArrowDown')
      downArrowElement.title = ImageRenderer.ARROW_DOWN_TEXT
      const upArrowElement =
        this.getElementByClass<HTMLDivElement>('imageArrowUp')
      upArrowElement.title = ImageRenderer.ARROW_UP_TEXT
    }
  }

  override enterDocument() {
    super.enterDocument()
    if (this.imageUrls.length <= 0) {
      return
    }

    const element = this.getElement()
    const handler = this.getHandler()
    handler.listen(element, MobileFriendlyClickEventType, (e) => {
      const target = e.target as HTMLElement
      // If click is on an arrow or within an arrow element, do not open dialog
      if (
        target?.classList?.contains('imageArrowUp') ||
        target?.classList?.contains('imageArrowDown') ||
        target?.closest('.imageArrowUp') ||
        target?.closest('.imageArrowDown')
      ) {
        e.stopPropagation()
        e.preventDefault()
        return false
      }
      this.onHandleClick(e)
    })

    if (this.imageUrls.length <= 1) {
      return
    }

    const downArrowElement = this.getElementByClass('imageArrowDown')
    const upArrowElement = this.getElementByClass('imageArrowUp')
    handler
      .listen(upArrowElement, EventType.MOUSEDOWN, (e: Event) =>
        this.onHandleUpClick(e)
      )
      .listen(downArrowElement, EventType.MOUSEDOWN, (e: Event) =>
        this.onHandleDownClick(e)
      )
      // Add keyboard navigation for arrow keys
      .listen(element, EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.onHandleKeyDown(e)
      )
    
    // Make the element focusable so it can receive keyboard events
    element.setAttribute('tabindex', '0')
  }

  /**
   * Update the image and set the caption.
   * @param imageUrl The image to render
   */
  protected updateImage(imageUrl: ImageRendererUrl) {
    const element = this.getElement()
    mb.setElementStyle(
      element,
      'background',
      'url(' + imageUrl.url + ') center center no-repeat'
    )
    const captionDiv = this.getElementByClass('imageCaption')
    captionDiv.textContent = imageUrl.caption || ''
  }

  /**
   * Handles events from mouse downing on the up button.
   * @param e The event that triggerd this callback.
   */
  protected onHandleUpClick(e: Event) {
    if (this.currentImageIndex > 0) {
      const imageUrl = this.imageUrls[--this.currentImageIndex]
      this.updateImage(imageUrl)
    }
    if (this.currentImageIndex === 0) {
      const upArrowElement = this.getElementByClass('imageArrowUp')
      upArrowElement.classList.add('imageArrowDim')
    }
    if (this.currentImageIndex < this.imageUrls.length - 1) {
      const downArrowElement = this.getElementByClass('imageArrowDown')
      downArrowElement.classList.remove('imageArrowDim')
    }
    e.stopPropagation()
    return true
  }

  /**
   * Handles events from mouse downing on the down button.
   * @param e The event that triggerd this callback.
   */
  protected onHandleDownClick(e: Event) {
    if (this.currentImageIndex < this.imageUrls.length - 1) {
      const imageUrl = this.imageUrls[++this.currentImageIndex]
      this.updateImage(imageUrl)
    }
    if (this.currentImageIndex > 0) {
      const upArrowElement = this.getElementByClass('imageArrowUp')
      upArrowElement.classList.remove('imageArrowDim')
    }
    if (this.currentImageIndex === this.imageUrls.length - 1) {
      const downArrowElement = this.getElementByClass('imageArrowDown')
      downArrowElement.classList.add('imageArrowDim')
    }
    e.stopPropagation()
    e.preventDefault()
    return true
  }

  /**
   * Handles keyboard events for arrow key navigation
   * @param e The keyboard event
   */
  protected onHandleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      this.onHandleUpClick(e)
      return true
    } else if (e.key === 'ArrowDown') {
      this.onHandleDownClick(e)
      return true
    }
    return false
  }

  /**
   * Handles events from pressing on the image
   *
   * @param e The event that triggerd this callback.
   */
  protected onHandleClick(e: Event) {
    const imageUrl = this.imageUrls[this.currentImageIndex]
    
    // Use actual media data from the stored mediaData for TIFF detection
    const mediaData = imageUrl.mediaData || {}
    
    // Extract character/state info if available
    const characterId = mediaData?.character_id ?? null
    const stateId = mediaData?.state_id ?? null
    const characterName = imageUrl.characterName ?? null
    const stateName = imageUrl.stateName ?? null
    const stateNumber = imageUrl.stateNumber ?? null  // Use ?? to preserve 0 values
    
    ImageViewerDialog.show(
      this.type, 
      imageUrl.id, 
      this.projectId, 
      mediaData, 
      this.isReadOnly, 
      this.cellId, 
      this.isPublished,
      characterId,
      stateId,
      characterName,
      stateName,
      stateNumber
    )
    
    e.stopPropagation()
    e.preventDefault()
    return true
  }

  /**
   * The HTML content
   * @return Returns the HTML content of this component
   */
  htmlContent(): string {
    if (this.imageUrls.length === 0) {
      return ''
    }
    if (this.imageUrls.length === 1) {
      // Single image: no arrows
      return '<div class="imageCaption"></div>'
    }
    // Multiple images: show arrows
    return (
      '<div class="imageArrowUp imageArrowDim"></div>' +
      '<div class="imageCaption"></div>' +
      '<div class="imageArrowDown"></div>'
    )
  }
}

interface ImageRendererUrl {
  url: string
  id: number
  caption: string | null
  mediaData?: any // Store the full media object data for TIFF detection
  characterName?: string | null // Character name for annotation context
  stateName?: string | null // State name for annotation context
  stateNumber?: number | null // State number for annotation context
}
