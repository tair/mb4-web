import * as mb from '../../mb'
import { Modal } from '../Modal'
import { EventType } from '../Component'

/**
 * Image Viewer
 *
 * @param type The type of the media to display
 * @param id The id of the media to display
 * @param readonly Whether the image viewer should be immutable
 */
export class ImageViewerDialog extends Modal {
  /**
   * The min number of the dialog.
   */
  private static MIN_DIALOG_HEIGHT: number = 400

  /**
   * The max number of the dialog
   */
  private static MAX_DIALOG_HEIGHT: number = 600

  /**
   * The size of the dialog's header + borders  + 2px slack
   */
  private static HEADER_PADDING: number = 40

  private readonly type: string
  private readonly id: number
  private readonly readonly: boolean
  private readonly metaViewport: Element

  constructor(type: string, id: number, readonly?: boolean | null) {
    super()

    this.type = type
    this.id = id
    this.readonly = !!readonly
    this.metaViewport = document.querySelector(
      'meta[name="viewport"]'
    ) as Element
    this.setTitle('Image Viewer')
    this.setDisposeOnHide(true)
  }

  override createDom() {
    super.createDom()
    const contentElement = this.getContentElement()
    contentElement.classList.add('imageViewer')
    contentElement.innerHTML = this.htmlContent()
    this.metaViewport.setAttribute(
      'content',
      'width=device-width, minimum-scale=1.0, maximum-scale=1.0, initial-scale=1.0, user-scalable=no, shrink-to-fit=no'
    )

    // determine the max height of the character list dialog allowed
    this.onHandleResize()
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(window, EventType.RESIZE, () =>
      this.onHandleResize()
    )
  }

  override dispose() {
    this.metaViewport.setAttribute('content', '')
    super.dispose()
  }

  /**
   * Handles events from resizing the window.
   */
  protected onHandleResize() {
    const windowDimensionHeight = document.documentElement.clientHeight
    const windowDimensionWidth = document.documentElement.clientWidth
    const viewer = this.getElementByClass<HTMLElement>('viewer')
    const possiblePaneHeight = Math.max(
      ImageViewerDialog.MIN_DIALOG_HEIGHT,
      windowDimensionHeight - ImageViewerDialog.HEADER_PADDING
    )
    const height = Math.min(
      ImageViewerDialog.MAX_DIALOG_HEIGHT,
      possiblePaneHeight
    )
    mb.setElementStyle(viewer, 'height', height + 'px')

    // After the window is drawn calculate the window and stuff
    setTimeout(() => {
      const element = this.getElement()
      if (windowDimensionWidth < element.offsetWidth) {
        const width = windowDimensionWidth - ImageViewerDialog.HEADER_PADDING
        mb.setElementStyle(viewer, 'width', width + 'px')
      }
    })
  }

  /**
   * The HTML content
   * @return Returns the HTML content of this component
   */
  htmlContent(): string {
    const url = this.createUrl()
    return (
      '<iframe id="viewer" class="viewer" src="' +
      url +
      '" scrolling="no">Loading</iframe>'
    )
  }

  /**
   * Creates the URL to view the image.
   */
  createUrl() {
    if (this.readonly) {
      return (
        '/index.php/Projects/MediaViewer/matrix/1/type/' +
        this.type +
        '/id/' +
        this.id
      )
    }
    return (
      '/index.php/MyProjects/Media/View/type/' + this.type + '/id/' + this.id
    )
  }

  /**
   * Displays the image viewer
   * @param type The type of the media to display
   * @param id The id of the media to display
   * @param readonly Whether the image viewer should be immutable
   */
  static show(type: string, id: number, readonly?: boolean | null) {
    const viewer = new ImageViewerDialog(type, id, readonly)
    viewer.setVisible(true)
  }
}
