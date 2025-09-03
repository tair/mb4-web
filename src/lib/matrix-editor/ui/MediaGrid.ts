import { Media } from '../data/Media'
import { Component, EventType, MobileFriendlyClickEventType } from './Component'
import * as MediaExports from '../data/Media'
import * as mb from '../mb'

/**
 * A grid of media items.
 *
 */
export class MediaGrid extends Component {
  protected selectedItems: MediaGridItem[]
  protected items: MediaGridItem[]
  protected removeable: boolean
  protected selectable: boolean
  protected emptyMediaLabel: string | null

  constructor() {
    super()

    this.selectedItems = []
    this.items = []
    this.removeable = false
    this.selectable = false
    this.emptyMediaLabel = null
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('mediaGrid')
    element.classList.add('nonSelectable')
    this.redraw()
  }

  /**
   * Sets whether the media files can be removed
   * @param removeable true if the media can be removed
   */
  setRemoveable(removeable: boolean) {
    this.removeable = removeable
  }

  /**
   * Sets the string to display if the media items are empty
   * @param emptyMediaLabel the string to display
   */
  setEmptyMediaLabel(emptyMediaLabel: string | null) {
    this.emptyMediaLabel = emptyMediaLabel
  }

  /**
   * Sets whether the media files can be selected
   * @param selectable true if the media can be selected
   */
  setSelectable(selectable: boolean) {
    this.selectable = selectable
  }

  /** Clear items */
  clear() {
    this.selectedItems = []
    this.items = []

    // unlisten to all events for the items since they are removed.
    this.getHandler().removeAll()
  }

  /**
   * Add a media item to the grid
   * @param item The media item to add
   */
  addItem(item: MediaGridItem) {
    this.items.push(item)
  }

  /**
   * Remove a media item from the grid
   * @param item The media item to remove
   */
  removeItem(item: MediaGridItem) {
    mb.remove(this.items, item)
  }

  /**
   * @return the value of the selected items
   */
  getSelectedIds(): number[] {
    const selectedIds: number[] = []
    for (let x = 0; x < this.selectedItems.length; x++) {
      selectedIds.push(this.selectedItems[x].id)
    }
    return selectedIds
  }

  /**
   * Redraws the component
   * @param displayMediaLabel Whether we should display the empty label if there are no media
   */
  redraw(displayMediaLabel: boolean = false) {
    const element = this.getElement()
    mb.removeChildren(element)
    if (displayMediaLabel && this.items.length === 0 && this.emptyMediaLabel) {
      const emptyMediaLabelElement = document.createElement('div')
      emptyMediaLabelElement.classList.add('media-label')
      emptyMediaLabelElement.textContent = this.emptyMediaLabel
      element.appendChild(emptyMediaLabelElement)
    }
    for (let x = 0; x < this.items.length; x++) {
      element.appendChild(this.createMediaElement(this.items[x]))
    }
  }

  /**
   * Creates a media element
   * @param item The item to render as an element
   * @return the created element based on the item
   */
  protected createMediaElement(item: MediaGridItem): HTMLElement {
    const mediaDiv = document.createElement('div')
    mb.setElementStyle(mediaDiv, 'align', 'center')
    mediaDiv.classList.add('mediaItem')
    mediaDiv.innerHTML = MediaExports.toTag(item.image, 'thumbnail')
    const handler = this.getHandler()
    if (this.removeable) {
      const removeSpan = document.createElement('span')
      removeSpan.classList.add('remove')
      handler.listen(removeSpan, EventType.CLICK, () =>
        this.removeMediaItem(item)
      )
      mediaDiv.appendChild(removeSpan)
    }
    if (this.selectable) {
      handler.listen(mediaDiv, EventType.CLICK, (e) =>
        this.selectMediaItem(item, e)
      )
    }
    if (item.caption) {
      const contentSpan = document.createElement('b')
      contentSpan.innerHTML = item.caption
      contentSpan.title = contentSpan.innerText
      mediaDiv.appendChild(document.createElement('br'))
      mediaDiv.appendChild(contentSpan)
    }
    handler.listen(mediaDiv, MobileFriendlyClickEventType, () =>
      this.doubleClickMediaItem(item)
    )
    return mediaDiv
  }

  /**
   * Handles when the mouse down event on a click is on a remove button.
   * @param item This item to be removed.
   */
  protected removeMediaItem(item: MediaGridItem) {
    this.dispatchEvent(
      new CustomEvent(EventType.CUT, { detail: { item: item } })
    )
  }

  /**
   * Handles when the mouse down event on a click is on the media item
   * @param item This item that was selected.
   * @param e The event that triggered this callback.
   */
  protected selectMediaItem(item: MediaGridItem, e: Event) {
    const isSelected = mb.contains(this.selectedItems, item)
    const element = e.currentTarget as Element
    if (isSelected) {
      mb.remove(this.selectedItems, item)
      element.classList.remove('selected')
    } else {
      this.selectedItems.push(item)
      element.classList.add('selected')
    }
    this.dispatchEvent(new Event(EventType.SELECT))
  }

  /**
   * Handles when the mouse down event on a click is on the media item
   * @param item This item that was selected.
   */
  protected doubleClickMediaItem(item: MediaGridItem) {
    this.dispatchEvent(
      new CustomEvent(EventType.DBLCLICK, { detail: { item: item } })
    )
  }
}

export interface MediaGridItem {
  id: number
  image: Media
  caption?: string
}

export type MediaGridItemEvent = { item: MediaGridItem }
