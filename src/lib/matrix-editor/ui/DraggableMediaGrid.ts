import { MediaGrid } from './MediaGrid'
import { EventType } from './Component'
import * as MediaDroppedEvents from '../events/MediaDroppedEvent'
import * as mb from '../mb'

/**
 * The grid that allows media items to be draggable.
 *
 */
export class DraggableMediaGrid extends MediaGrid {
  /**
   * The timer for the scrolling. This is shared across all media grids because there only one scroll.
   */
  private static scrollingTimer: number = 0
  protected targets: Element[]
  protected scrollableContainer: Element

  constructor() {
    super()

    this.targets = []
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    this.targets.push(element)
  }

  override enterDocument() {
    super.enterDocument()
    const element = this.getElement()
    this.getHandler()
      .listen(element, EventType.DROP, (e) => this.handleDrop(e))
      .listen(
        element,
        [EventType.DRAGOVER, EventType.DRAGENTER],
        (e: DragEvent) => this.handleDragEnter(e)
      )
      .listen(
        element,
        [EventType.DRAGOUT, EventType.DRAGLEAVE],
        (e: DragEvent) => this.handleDragLeave(e)
      )
  }

  override redraw(displayMediaLabel: boolean = false) {
    const element = this.getElement()
    mb.removeChildren(element)
    if (displayMediaLabel && this.items.length === 0 && this.emptyMediaLabel) {
      const emptyMediaLabelElement = document.createElement('div')
      emptyMediaLabelElement.classList.add('media-label')
      emptyMediaLabelElement.textContent = this.emptyMediaLabel
      element.appendChild(emptyMediaLabelElement)
    }
    const handler = this.getHandler()
    for (let x = 0; x < this.items.length; x++) {
      const item = this.items[x]
      const mediaElement = this.createMediaElement(item)
      mediaElement.dataset['id'] = String(item.id)
      mediaElement.draggable = true
      handler
        .listen(mediaElement, EventType.DRAGSTART, (e) =>
          this.handleDragStart(e)
        )
        .listen(mediaElement, EventType.DRAGEND, (e: DragEvent) =>
          this.handleDragEnd(e)
        )
      element.appendChild(mediaElement)
    }
  }

  /**
   * Sets a target
   * @param draggableMediaGrid Another draggable media grid to drop items
   */
  addTarget(draggableMediaGrid: DraggableMediaGrid) {
    this.targets.push(draggableMediaGrid.getElement())
  }

  /**
   * Adds a scrollable container to the drag and drop
   * @param element The element to ensure that it can scroll properly
   */
  addScrollableContainer(element: Element) {
    this.scrollableContainer = element
  }

  /**
   * Handles when the drag start event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected handleDragStart(e: DragEvent) {
    const mediaElement = <HTMLElement>e.currentTarget
    const id = mediaElement.dataset['id']
    if (id) {
      mb.setElementStyle(mediaElement, 'opacity', '0.5')
      e.dataTransfer!.clearData()
      e.dataTransfer!.setData('text/plain', id)
    }
  }

  /**
   * Handles when the drag end event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected handleDragEnd(e: DragEvent) {
    const mediaElement = <HTMLElement>e.currentTarget
    mb.setElementStyle(mediaElement, 'opacity', '1.0')
    clearTimeout(DraggableMediaGrid.scrollingTimer)
  }

  /**
   * Handles when the drag enter event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected handleDragEnter(e: DragEvent) {
    const element = <HTMLElement>e.currentTarget
    const isTarget = this.targets.includes(element)
    if (isTarget) {
      e.preventDefault()
      element.classList.add('highlighted')
      this.scrollToView()
    }
  }

  /**
   * Handles when the drag leave event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected handleDragLeave(e: DragEvent) {
    const element = <HTMLElement>e.currentTarget
    element.classList.remove('highlighted')
  }

  /**
   * Handles when the drop event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()

    const element = <HTMLElement>e.currentTarget
    element.classList.remove('highlighted')

    clearTimeout(DraggableMediaGrid.scrollingTimer)
    const id = parseInt(e.dataTransfer!.getData('text'), 10)
    this.dispatchEvent(MediaDroppedEvents.create(id))
  }

  /**
   * Scroll the media grid into view
   * @return whether we scroll to the element
   */
  protected scrollToView(): boolean {
    if (this.scrollableContainer === null) {
      return false
    }
    const mediaGrid = this.getElement()
    const offset = mb.getContainerOffsetToScrollInto(
      mediaGrid,
      this.scrollableContainer,
      /* center */
      true
    )
    if (this.scrollableContainer.scrollTop !== offset.y) {
      const delta = offset.y - this.scrollableContainer.scrollTop
      this.delayedScroll(
        delta / 10,
        10,
        /** short delta means short wait */
        Math.abs(delta)
      )
    }
    return true
  }

  /**
   *
   * @param delta The delta to scroll by
   * @param iterations The number of iterations to scroll
   * @param speed The speed at which to scroll
   */
  protected delayedScroll(delta: number, iterations: number, speed: number) {
    if (iterations > 0) {
      clearTimeout(DraggableMediaGrid.scrollingTimer)
      DraggableMediaGrid.scrollingTimer = window.setTimeout(() => {
        this.scrollableContainer.scrollTop += delta
        this.delayedScroll(delta, iterations - 1, speed)
      }, speed / iterations)
    }
  }
}
