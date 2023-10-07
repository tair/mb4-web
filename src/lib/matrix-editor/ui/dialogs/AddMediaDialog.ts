import { Dialog } from '../Dialog'
import { MediaGrid, MediaGridItem, MediaGridItemEvent } from '../MediaGrid'
import { ImageViewerDialog } from './ImageViewerDialog'
import { Component, EventType, KeyCodes } from '../Component'
import { ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'

/**
 * The add media dialog which adds media to a given source
 * @param mediaLoadFunction function to load media
 * @param mediaSelectFunction function to invoke with selected media
 */
export class AddMediaDialog extends Dialog {
  /**
   * The keys used to identify additional buttons in events.
   */
  private static readonly ButtonKeys = { ADD: 'Add', REFRESH: 'Refresh' }

  /**
   * The keys used to identify additional buttons in events.
   */
  private static readonly ButtonLabels = { ADD: 'Add', REFRESH: 'Refresh' }

  /**
   * The standard buttons (keys associated with captions).
   */
  private static readonly Buttons = {
    ADD: {
      text: AddMediaDialog.ButtonLabels.ADD,
      key: AddMediaDialog.ButtonKeys.ADD,
      dismissable: false,
    },
    REFRESH: {
      text: AddMediaDialog.ButtonLabels.REFRESH,
      key: AddMediaDialog.ButtonKeys.REFRESH,
      dismissable: false,
    },
  }

  private mediaSelectFunction: (p1: number[]) => any
  private mediaGrid: MediaGrid
  private loadingElement: Element

  constructor(
    private readonly mediaLoadFunction: () => Promise<MediaGridItem[]>,
    mediaSelectFunction: (p1: number[]) => Promise<void>
  ) {
    super()
    this.mediaSelectFunction = mediaSelectFunction
    this.mediaGrid = new MediaGrid()
    this.mediaGrid.setEmptyMediaLabel('No media available')
    this.mediaGrid.setSelectable(true)
    this.registerDisposable(this.mediaGrid)
    this.loadingElement = this.getLoadingElement()
    this.setTitle('Add Media')
    this.setDisposeOnHide(true)
    this.addButton(ModalDefaultButtons.DONE)
    this.addButton(AddMediaDialog.Buttons.ADD)
    this.addButton(AddMediaDialog.Buttons.REFRESH)
  }

  override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('addMediaDialog')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = AddMediaDialog.htmlContent()
    const mediaPane = this.getElementByClass('addMedia')
    this.mediaGrid.render(mediaPane)
    this.refreshGrid()
    this.onGridSelectChange()
  }

  override enterDocument() {
    super.enterDocument()

    this.getHandler()
      .listen(this, EventType.SELECT, (e: CustomEvent<any>) =>
        this.onHandleSelect(e)
      )
      .listen(this.mediaGrid, EventType.SELECT, () => this.onGridSelectChange())
      .listen(
        this.mediaGrid,
        EventType.DBLCLICK,
        (e: CustomEvent<MediaGridItemEvent>) => this.onGridDoubleClick(e)
      )
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleSelect(e: CustomEvent) {
    switch (e.detail.key) {
      case AddMediaDialog.ButtonKeys.ADD:
        this.savingLabel.saving()
        const selectedMediaIds = this.mediaGrid.getSelectedIds()
        this.mediaSelectFunction(selectedMediaIds)
          .then(() => {
            this.savingLabel.saved()
            this.dispose()
          })
          .catch((e: Error) => {
            this.savingLabel.failed()
            alert(e)
          })
        return false
      case AddMediaDialog.ButtonKeys.REFRESH:
        this.refreshGrid()
        return false
      default:
        return true
    }
  }

  /**
   * Handles when the grid selection was changed
   */
  protected onGridSelectChange() {
    const shouldEnable = !!this.mediaGrid.getSelectedIds().length
    this.setButtonEnabled(AddMediaDialog.Buttons.ADD, shouldEnable)
  }

  /**
   * Handles events when media are double clicked.
   * @param e The event that triggerd this callback.
   * @return True because it rendered successfully.
   */
  protected onGridDoubleClick(e: CustomEvent<MediaGridItemEvent>): boolean {
    const item = e.detail.item
    ImageViewerDialog.show('M', item.id)
    return true
  }

  /** Refresh the media grid */
  refreshGrid() {
    this.mediaGrid.clear()
    this.mediaGrid.redraw(false)
    const contentElement = this.getContentElement()
    contentElement.appendChild(this.loadingElement)
    this.mediaLoadFunction()
      .then((mediaItems) => {
        for (let x = 0; x < mediaItems.length; x++) {
          this.mediaGrid.addItem(mediaItems[x])
        }
        this.mediaGrid.redraw(true)
      })
      .catch((e) => alert(e))
      .finally(() => contentElement.removeChild(this.loadingElement))
  }

  /**
   * @return an element which shows a loading indicator.
   */
  getLoadingElement(): Element {
    const loadingElement = document.createElement('div')
    loadingElement.classList.add('loadingMedia')
    const messageElement = document.createElement('div')
    messageElement.textContent = 'Loading media...'
    loadingElement.appendChild(messageElement)
    return loadingElement
  }

  /**
   * @return The HTML content of the add media dialog
   */
  static htmlContent(): string {
    return '<div class="addMedia"></div>'
  }
}
