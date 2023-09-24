import { Component, EventType, MobileFriendlyClickEventType } from './Component'
import * as mb from '../mb'

/**
 * This component contains items that can be removed and added.
 *
 */
export class Select extends Component {
  /**
   * The css selectors to apply to an element
   */
  private static readonly CSS = {
    NAME: 'name',
    REMOVE: 'remove',
    SELECT: 'select',
  }

  protected selectedItems: HTMLElement[]
  protected items: HTMLElement[]
  protected isRemovable: boolean
  protected handleClick: (p1: MouseEvent) => any

  constructor() {
    super()
    this.selectedItems = []
    this.items = []
    this.isRemovable = false
    this.handleClick = (e) => this.handleClickWithSingleSelection(e)
  }

  override createDom() {
    const element = document.createElement('ol')
    element.tabIndex = 0
    element.classList.add('selectList', 'nonSelectable')
    if (mb.isMobileOrTablet()) {
      element.classList.add('tablet')
    }

    this.setElementInternal(element)
    this.redraw()
  }

  override enterDocument() {
    super.enterDocument()
    const element = this.getElement()
    this.getHandler()
      .listen(element, EventType.CLICK, (e:MouseEvent) => this.handleClick(e))
      .listen(
        element,
        MobileFriendlyClickEventType,
        (e: Event) => this.handleDoubleClick(e)
      )
  }

  /**
   * Sets whether items in this grid can be removed
   *
   * @param b Whether items in this grid can be removed
   */
  setIsRemovable(b: boolean) {
    this.isRemovable = b
  }

  /** Clear items */
  clearItems() {
    this.selectedItems = []
    this.items = []
  }

  /**
   * Adds an editable option
   * @param text The text of the option
   * @param value The value of the option
   */
  addItem(text: string, value: string | number) {
    const li = this.createItem(text, value)
    if (this.isRemovable) {
      const removeSpan = document.createElement('span')
      removeSpan.classList.add(Select.CSS.REMOVE)
      li.appendChild(removeSpan)
    }
    this.items.push(li)
  }

  /**
   * Adds an editable option
   * @param text The text of the option
   * @param value The value of the option
   */
  createItem(text: string, value: string | number) {
    const li = document.createElement('li')
    li.dataset['value'] = String(value)
    const nameElement = document.createElement('div')
    nameElement.classList.add(Select.CSS.NAME)
    nameElement.textContent = text
    li.appendChild(nameElement)
    return li
  }

  /**
   * Redraws the component
   */
  redraw() {
    const element = this.getElement()
    mb.removeChildren(element)
    for (let x = 0; x < this.items.length; x++) {
      element.appendChild(this.items[x])
    }
  }

  /**
   * @return the first selected value
   */
  getSelectedValue(): string | null {
    const selectedValues = this.getSelectedValues()
    if (selectedValues.length === 0) {
      return null
    }
    return selectedValues[0]
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
        const value = item.dataset['value']
        if (value) {
          selectedValues.push(value)
        }
      }
    }
    return selectedValues
  }

  /**
   * Sets whether it is possible to selection multiple items.
   * @param b True if desired to select multiple items, false others.
   */
  setAllowMultipleSelection(b: boolean) {
    this.handleClick = b
      ? (e) => this.handleClickWithMultipleSelection(e)
      : (e) => this.handleClickWithSingleSelection(e)
  }

  /**
   * @return The index of the last selected item. This will -1 if the none of the items are selected.
   */
  getLastSelectedIndex(): number {
    return this.items.indexOf(this.selectedItems[0])
  }

  /**
   * @param index The index to select
   */
  setSelectedIndex(index: number) {
    this.removeSelectedItems()
    if (index >= this.items.length || index < 0) {
      return false
    }
    const selectedItem = this.items[index]
    this.addSelectedItems(selectedItem)
    mb.scrollIntoContainerView(selectedItem, this.getElement())
    this.dispatchEvent(new Event(EventType.SELECT))
    return true
  }

  /**
   * @return The indicies of the selected items.
   */
  getSelectedIndices(): number[] {
    const selectedIndices: number[] = []
    for (let x = 0, l = this.selectedItems.length; x < l; ++x) {
      const index = this.items.indexOf(this.selectedItems[x])
      if (index > 0) {
        selectedIndices.push(index)
      }
    }
    return selectedIndices
  }

  /**
   * @param indicies The indicies to select
   * @return Whether the selection was applied.
   */
  setSelectedIndices(indicies: number[]): boolean {
    this.removeSelectedItems()
    const l = indicies.length
    for (let x = 0; x < l; ++x) {
      const index = indicies[x]
      if (index >= this.items.length || index < 0) {
        return false
      }
    }
    let selectedItem
    for (let x = 0; x < l; ++x) {
      const index = indicies[x]
      selectedItem = this.items[index]
      this.addSelectedItems(selectedItem)
    }
    if (selectedItem) {
      mb.scrollIntoContainerView(selectedItem, this.getElement())
    }
    this.dispatchEvent(new Event(EventType.SELECT))
    return true
  }

  /**
   * Handles when the mouse down event on this component. This will only select a single element.
   *
   * @param e The event that triggered this callback.
   */
  protected handleClickWithSingleSelection(e: MouseEvent) {
    this.removeSelectedItems()
    const selectedItem = this.getParentLIElement(e.target)
    if (selectedItem) {
      this.addSelectedItems(selectedItem)
      if (this.isRemovable) {
        mb.toElement(e.target).classList.remove(Select.CSS.REMOVE)
      }
      const eventType = this.isRemovable ? EventType.CUT : EventType.SELECT
      this.dispatchEvent(new Event(eventType))
    }
  }

  /**
   * Handles when the mouse down event on this component. This supports selecting multiple elements
   *
   * @param e The event that triggered this callback.
   */
  protected handleClickWithMultipleSelection(e: MouseEvent) {
    const li = this.getParentLIElement(e.target)
    if (li === null) {
      return
    }
    if (e.shiftKey) {
      const savedLi = this.popSelectedItem()
      this.removeSelectedItems()

      // save elements from li to savedLi
      const element = this.getElement()
      const lis = element.getElementsByTagName('li')
      const savedLiIndex = mb.indexOf(lis, savedLi)
      let liIndex = mb.indexOf(lis, li)
      const inc = liIndex < savedLiIndex ? 1 : -1

      // we iterate this way so when users double shift they use the original li element
      for (; liIndex !== savedLiIndex; liIndex += inc) {
        this.addSelectedItems(lis[liIndex])
      }
      this.addSelectedItems(lis[liIndex])
    } else {
      if (e.ctrlKey || e.metaKey || mb.isMobileOrTablet()) {
        this.toggleSelectedItems(li)
      } else {
        if (!this.isSelectedItems(li)) {
          this.removeSelectedItems()
          this.addSelectedItems(li)
        }
      }
    }
    this.dispatchEvent(new Event(EventType.SELECT))
  }

  /**
   * Handles when the mouse down event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected handleDoubleClick(e: Event) {
    if (
      this.isRemovable &&
      mb.toElement(e.target).classList.contains(Select.CSS.REMOVE)
    ) {
      this.dispatchEvent(new Event(EventType.CUT))
      return
    }
    this.removeSelectedItems()
    const selectedItem = this.getParentLIElement(e.target)
    if (selectedItem) {
      this.addSelectedItems(selectedItem)
      this.dispatchEvent(e)
    }
  }

  /**
   * Removes all the selected items
   */
  protected popSelectedItem() {
    const lastLi = this.selectedItems.pop()
    if (lastLi !== undefined) {
      lastLi.classList.remove(Select.CSS.SELECT)
    }
    return lastLi
  }

  /**
   * Removes all the selected items
   */
  protected removeSelectedItems() {
    let lastLi
    while ((lastLi = this.selectedItems.pop()) !== undefined) {
      lastLi.classList.remove(Select.CSS.SELECT)
    }
  }

  /**
   * Adds item to the selected items
   * @param li the element to add
   */
  protected addSelectedItems(li: HTMLElement) {
    if (!this.isSelectedItems(li)) {
      li.classList.add(Select.CSS.SELECT)
      this.selectedItems.push(li)
    }
  }

  /**
   * Adds item to the selected items
   * @param li the element to add
   */
  protected toggleSelectedItems(li: HTMLElement) {
    if (this.isSelectedItems(li)) {
      li.classList.remove(Select.CSS.SELECT)
      mb.remove(this.selectedItems, li)
    } else {
      this.addSelectedItems(li)
    }
  }

  /**
   * @param li the element to add
   * @return Whether the li is selected.
   */
  protected isSelectedItems(li: HTMLElement): boolean {
    return li.classList.contains(Select.CSS.SELECT)
  }

  /**
   * @param element The element to query
   * @return The LI element of the taxa.
   */
  protected getParentLIElement(element: any): HTMLElement | null {
    if (element === this.getElement()) {
      return null
    }
    while (element) {
      if (element.hasAttribute('data-value')) {
        break
      }
      element = element.parentNode
    }
    return element as HTMLElement
  }
}
