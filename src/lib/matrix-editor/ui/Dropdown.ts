import { Component } from './Component'

/**
 * A general Modal for the Matrix Editor
 *
 */
export class Dropdown extends Component {
  private options: DropdownItem[]
  private enabled: boolean
  private selectedIndex: number

  constructor() {
    super()

    this.options = []
    this.enabled = true
    this.selectedIndex = 0
  }

  override createDom() {
    const element = document.createElement('select')
    this.setElementInternal(element)
    element.classList.add('form-select')
    element.innerHTML = this.createOptions()
    element.disabled = !this.enabled
    element.selectedIndex = this.selectedIndex
  }

  /** Redraw */
  redraw() {
    const element = this.getElement()
    element.innerHTML = this.createOptions()
    this.setSelectedIndex(0)
  }

  /**
   * Add option to this select.
   */
  addItem(option: DropdownItem) {
    this.options.push(option)
  }

  /**
   * Sets the selected value in this dropdown.
   * @return The selected value.
   */
  getSelectedValue(): string {
    if (!this.isInDocument()) {
      throw 'not in document yet'
    }

    const element = this.getElement<HTMLSelectElement>()
    return element.value
  }

  /**
   * Sets the selected index in this dropdown.
   * @return The selected index.
   */
  getSelectedIndex(): number {
    return this.selectedIndex
  }

  /**
   * Sets the selected index in this dropdown.
   * @param selectedIndex The index to set.
   */
  setSelectedIndex(selectedIndex: number) {
    this.selectedIndex = selectedIndex
    if (this.isInDocument()) {
      const element = this.getElement<HTMLSelectElement>()
      element.selectedIndex = selectedIndex
    }
  }

  /** Remove all options. */
  removeAllItems() {
    this.options = []
  }

  /**
   * Gets the selected index.
   * @param enabled Whether this component is enabled.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (this.isInDocument()) {
      const element = this.getElement<HTMLSelectElement>()
      element.disabled = !enabled
    }
  }

  /**
   * Sets the tooltip for this component.
   * @param text The tooltip.
   */
  setTooltip(text: string) {
    const element = this.getElement()
    element.title = text
  }

  createOptions() {
    let html = ''
    for (const option of this.options) {
      html += `<option value="${option.value}" ${
        option.disabled ? 'disabled' : ''
      }>${option.text}</option>`
    }
    return html
  }
}

export interface DropdownItem {
  text: string
  value: string | number
  disabled?: boolean
}
