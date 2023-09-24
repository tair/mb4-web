import { Component, EventType } from './Component'

/**
 * Label input which can set the value without the component being rendered.
 */
export class LabelInput extends Component {
  private value: string
  private tooltip: string

  constructor() {
    super()

    this.value = ''
  }

  override createDom() {
    const inputElement = document.createElement('input')
    inputElement.type = 'text'
    inputElement.value = this.value
    if (this.tooltip) {
      inputElement.title = this.tooltip
    }
    this.setElementInternal(inputElement)
  }

  override enterDocument() {
    super.enterDocument()

    const handler = this.getHandler()
    const element = this.getElement()
    handler
      .listen(
        element,
        EventType.BLUR,
        () =>  this.handleChangedEvent()
      )
  }

  /**
   * @return The value of this input.
   */
  getValue(): string {
    return this.value
  }

  /**
   * Sets the value.
   * @param value The new valueof this table.
   */
  setValue(value: string) {
    this.value = value
    if (this.isInDocument()) {
      const element = this.getElement<HTMLInputElement>()
      element.value = value
    }
  }

  setEnabled(enabled: boolean) {
    if (this.isInDocument()) {
      const element = this.getElement<HTMLInputElement>()
      element.disabled = !enabled
    }
  }

  /**
   * Clears the value.
   */
  clear() {
    this.setValue('')
  }

  /**
   * Focus on the element.
   */
  focus() {
    if (this.isInDocument()) {
      const element = this.getElement()
      element.focus()
    }
  }

  /**
   * Sets the tooltip for this input. This must be called before the rendering.
   * @param tooltip The tooltip to set for this input.
   */
  setTooltip(tooltip: string) {
    this.tooltip = tooltip
    if (this.isInDocument()) {
      const element = this.getElement()
      element.title = tooltip
    }
  }

  /**
   * Determine whether the input has changed.
   */
  handleChangedEvent() {
    const element = this.getElement<HTMLInputElement>()
    if (this.value !== element.value) {
      this.value = element.value
      this.dispatchEvent(new Event(EventType.CHANGE))
    }
  }
}
