import { Component, EventType } from './Component'
import * as mb from '../mb'

/**
 * This component contains items that can be draggabled and dropped from various places.
 *
 */
export class DraggableSelect extends Component {
  /**
   * The type of this event
   */
  static DroppedEventType: string = 'MediaDropped'

  /** Whether this component is enabled. */
  private enabled: boolean = true

  private droppedIndex: number
  private items: HTMLElement[]
  private selectedItems: HTMLElement[]
  private targets: Element[]
  private uniqueId: string

  constructor() {
    super()

    this.droppedIndex = -1
    this.items = []
    this.selectedItems = []
    this.targets = []
    this.uniqueId = Component.makeNewId()
  }

  protected override createDom() {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = DraggableSelect.htmlContent()
    this.setElementInternal(wrapper.children[0] as HTMLElement)
    this.redraw()
  }

  protected override enterDocument() {
    super.enterDocument()

    const element = this.getElement()
    this.getHandler()
      .listen(element, EventType.MOUSEDOWN, (e: MouseEvent) =>
        this.handleMouseDown(e)
      )
      .listen(element, EventType.DROP, (e: DragEvent) => this.handleDrop(e))
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

  /**
   * Sets whether this component is droppable.
   * @param enabled Whether we should enable the drop
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  /**
   * Sets a target
   * @param draggableSelect Another component
   */
  addTarget(draggableSelect: DraggableSelect) {
    this.targets.push(draggableSelect.getElement())
  }

  /**
   * Clear items
   */
  clearItems() {
    this.items = []
    this.selectedItems = []
    this.droppedIndex = -1
  }

  /**
   * Adds an draggable option
   * @param text The text of the option
   * @param value The value of the option
   */
  addItem(text: string, value: string | number) {
    const li = document.createElement('li')
    li.dataset['value'] = String(value)
    li.innerHTML = text
    li.draggable = true
    this.items.push(li)
    this.getHandler()
      .listen(li, EventType.DRAGSTART, (e: DragEvent) =>
        this.handleDragStart(e)
      )
      .listen(li, EventType.DRAGEND, () => this.handleDragEnd())
  }

  /**
   * Redraws the component
   */
  redraw() {
    this.addDeadElement()
    const draggableSelect = this.getElement()
    mb.removeChildren(draggableSelect)

    for (let x = 0; x < this.items.length; x++) {
      draggableSelect.appendChild(this.items[x])
    }

    // Calculate the remaining height so that the last element could occupy the rest of the container.
    const deadItem = this.items[this.items.length - 1]
    const height = this.items.length * deadItem.clientHeight
    if (height < draggableSelect.clientHeight) {
      const remainingHeight = draggableSelect.clientHeight - height
      mb.setElementStyle(deadItem, 'height', remainingHeight + 'px')
    }
  }

  /**
   * @return the value of the selected items
   */
  getSelectedValues(): string[] {
    const selectedValues: string[] = []

    // They have to be in the order of how they appear in the UI, not in the order in which they were selected.
    // Therefore we iterate through their appearance instead of their selection.
    for (let x = 0; x < this.items.length; x++) {
      const item = this.items[x]
      if (mb.contains(this.selectedItems, item)) {
        const value: string = item.dataset['value'] as string
        selectedValues.push(value)
      }
    }
    return selectedValues
  }

  /**
   * @return the dropped index.
   */
  getDroppedIndex(): number {
    return this.droppedIndex
  }

  /**
   * Adds a dead option. Can't be highlighted or even displayed.
   */
  private addDeadElement() {
    const li = document.createElement('li')
    li.dataset['value'] = '0'
    li.classList.add('dead')
    if (this.items.length === 0) {
      li.classList.add('onlyElement')
    }
    this.items.push(li)
  }

  /**
   * Handles when the mouse down event on this component.
   *
   * @param e The event that triggered this callback.
   */
  private handleMouseDown(e: MouseEvent) {
    const li = this.getParentLIElement(e.target)
    if (li === null) {
      return
    }

    if (e.shiftKey) {
      const savedLi = this.popSelectedItem()
      this.removeSelectedItems()

      // save elements from li to savedLi
      const draggableSelect = this.getElement()
      const lis = draggableSelect.getElementsByTagName('li')
      const savedLiIndex = mb.indexOf(lis, savedLi)
      let liIndex = mb.indexOf(lis, li)
      const inc = liIndex < savedLiIndex ? 1 : -1

      // we iterate this way so when users double shift they use the original li element
      for (; liIndex !== savedLiIndex; liIndex += inc) {
        this.addSelectedItems(lis[liIndex])
      }
      this.addSelectedItems(lis[liIndex])
    } else {
      if (e.ctrlKey) {
        this.toggleSelectedItems(li)
      } else {
        if (!this.isSelectedItems(li)) {
          this.removeSelectedItems()
          this.addSelectedItems(li)
        }
      }
    }
  }

  /**
   * Handles when the drag start event on this component.
   *
   * @param e The event that triggered this callback.
   */
  private handleDragStart(e: DragEvent) {
    this.droppedIndex = -1
    e.dataTransfer?.clearData()
    e.dataTransfer?.setData('text/plain', this.uniqueId)
  }

  /**
   * Handles when the drag end event on this component.
   */
  private handleDragEnd() {
    this.removeSelectedItems()
  }

  /**
   * Handles when the drag enter event on this component.
   *
   * @param e The event that triggered this callback.
   */
  private handleDragEnter(e: DragEvent) {
    const element = e.currentTarget as Element
    const isTarget = this.targets.includes(element)
    if (!isTarget) {
      return
    }
    e.preventDefault()
    const li = this.getParentLIElement(e.target)
    if (!li) {
      return
    }
    li.classList.add('droppable')
    const draggableSelect = this.getElement()
    const lis = draggableSelect.getElementsByTagName('li')

    // We need to ensure that we scroll if the prev or next element is not visible.
    for (let x = 0; x < lis.length; x++) {
      if (lis[x] === li) {
        if (x - 1 >= 0 && this.scrollToLIElement(lis[x - 1])) {
          break
        }
        if (x + 1 < lis.length && this.scrollToLIElement(lis[x + 1])) {
          break
        }
        break
      }
    }
  }

  /**
   * Handles when the drag leave event on this component.
   *
   * @param e The event that triggered this callback.
   */
  private handleDragLeave(e: DragEvent) {
    const li = this.getParentLIElement(e.target)
    if (li) {
      li.classList.remove('droppable')
    }
  }

  /**
   * Handles when the drop event on this component.
   *
   * @param e The event that triggered this callback.
   */
  private handleDrop(e: DragEvent) {
    const li = this.getParentLIElement(e.target)
    if (li && this.enabled) {
      li.classList.remove('droppable')
      const draggableSelect = this.getElement()
      const lis = draggableSelect.getElementsByTagName('li')
      this.droppedIndex = mb.indexOf(lis, li)
      const isTargetSelf = this.uniqueId === e.dataTransfer?.getData('text')
      this.dispatchEvent(DraggableSelect.createDropEvent(isTargetSelf))
    }
  }

  /**
   * Removes all the selected items
   */
  private popSelectedItem() {
    const lastLi = this.selectedItems.pop()
    if (lastLi !== undefined) {
      lastLi.classList.remove('select')
    }
    return lastLi
  }

  /**
   * Removes all the selected items
   */
  private removeSelectedItems() {
    let lastLi
    while ((lastLi = this.selectedItems.pop()) !== undefined) {
      lastLi.classList.remove('select')
    }
  }

  /**
   * Adds item to the selected items
   * @param li the element to add
   */
  private addSelectedItems(li: HTMLElement) {
    if (li.classList.contains('dead')) {
      return
    }
    if (!this.isSelectedItems(li)) {
      li.classList.add('select')
      this.selectedItems.push(li)
    }
  }

  /**
   * Adds item to the selected items
   * @param li the element to add
   */
  private toggleSelectedItems(li: HTMLElement) {
    if (li.classList.contains('dead')) {
      return
    }
    if (this.isSelectedItems(li)) {
      li.classList.remove('select')
      const liIndex = this.selectedItems.indexOf(li)
      if (liIndex > -1) {
        this.selectedItems.splice(liIndex, 1)
      }
    } else {
      li.classList.add('select')
      this.selectedItems.push(li)
    }
  }

  /**
   * @param li the element to add
   * @return Whether the li is selected.
   */
  private isSelectedItems(li: HTMLElement): boolean {
    return li.classList.contains('select')
  }

  /**
   * @param element The element to query
   * @return The LI element of the taxa.
   */
  private getParentLIElement(element: any): HTMLElement | null {
    const draggableSelect = this.getElement()
    if (element === draggableSelect) {
      return null
    }

    while (element) {
      if (element.dataset && element.dataset['value']) {
        break
      }
      element = element.parentElement
    }

    return element
  }

  /**
   * Scroll to a LI element
   * @param element the element that we may scroll to
   * @return whether we scroll to the element
   */
  private scrollToLIElement(element: HTMLElement): boolean {
    const draggableSelect = this.getElement()
    const offset = mb.getContainerOffsetToScrollInto(element, draggableSelect)
    if (draggableSelect.scrollTop !== offset.y) {
      // Delay to decrease the scroll speed
      setTimeout(function () {
        draggableSelect.scrollTop = offset.y
      }, 150)
      return true
    }
    return false
  }

  /**
   * @return the HTML content.
   */
  private static htmlContent(): string {
    return '<ol tabindex="0" class="draggableSelect nonSelectable"></ol>'
  }

  /**
   * Event when an item is dropped to this component.
   * @param isTargetSelf Whether the dropped target is this component.
   */
  private static createDropEvent(
    isTargetSelf: boolean
  ): CustomEvent<DraggableSelectDroppedEvent> {
    return new CustomEvent<DraggableSelectDroppedEvent>(
      DraggableSelect.DroppedEventType,
      { detail: { isTargetSelf: isTargetSelf } }
    )
  }
}

export interface DraggableSelectDroppedEvent {
  isTargetSelf: boolean
}
