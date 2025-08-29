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
   * Adds an image to the renderer
   *
   * @param id the id of the image
   * @param url the url of the image
   * @param caption the caption of the image
   */
  addImage(id: number, url: string, caption?: string | null) {
    const imageUrl: ImageRendererUrl = {
      id: id,
      url: url,
      caption: caption || null,
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
    handler.listen(element, MobileFriendlyClickEventType, (e) =>
      this.onHandleClick(e)
    )

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
   * Handles events from pressing on the image
   *
   * @param e The event that triggerd this callback.
   */
  protected onHandleClick(e: Event) {
    const imageUrl = this.imageUrls[this.currentImageIndex]
    
    if (this.projectId !== null) {
      // console.log('onHandleClick', this.type, imageUrl.id, this.projectId, {}, this.isReadOnly, this.cellId)
      // Use new signature with project ID and cell ID
      ImageViewerDialog.show(this.type, imageUrl.id, this.projectId, {}, this.isReadOnly, this.cellId)
    } else {
      // Fallback to old signature - project ID will be derived from URL
      ImageViewerDialog.show(this.type, imageUrl.id, this.isReadOnly)
    }
    
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
}
