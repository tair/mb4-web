import { Component, EventType } from './Component'

/**
 * A general Modal for the Matrix Editor
 *
 */
export class Checkbox extends Component {
  private value: number
  private enabled: boolean
  private checked: boolean
  private id: string
  private model: Object

  constructor(value: number) {
    super()
    this.value = value
    this.enabled = true
    this.checked = false
    this.id = Component.makeNewId()
    this.model = {}
  }

  protected override createDom() {
    const element = document.createElement('input')
    element.classList.add('form-check-input')
    element.type = 'checkbox'
    element.value = String(this.value)
    element.id = this.id
    element.disabled = !this.enabled
    element.checked = this.checked
    this.setElementInternal(element)
  }

  protected override enterDocument(): void {
    super.enterDocument()
    const element = this.getElement()
    this.getHandler().listen(element, EventType.CHANGE, (e) =>
      this.propagateEvent(e)
    )
  }

  /** @return Whether the value of the checkbox. */
  getValue(): number {
    return this.value
  }

  /**
   * Sets whether this checkbox is enabled.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (this.isInDocument()) {
      const element = this.getElement<HTMLInputElement>()
      element.disabled = !enabled
    }
  }

  /** @return Whether this checkbox is enabled. */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Sets whether this checkbox is checked.
   */
  setChecked(checked: boolean) {
    this.checked = checked
    if (this.isInDocument()) {
      const element = this.getElement<HTMLInputElement>()
      if (element.checked != checked) {
        element.checked = checked
      }
    }
  }

  /** @return Whether this checkbox is checked. */
  isChecked(): boolean {
    if (this.isInDocument()) {
      const element = this.getElement<HTMLInputElement>()
      return element.checked
    }
    return this.checked
  }

  /**
   * Sets whether this checkbox is checked.
   */
  setModel(model: Object) {
    this.model = model
  }

  /**
   * @return Whether this checkbox is checked.
   * @template T
   */
  getModel<T>(): T {
    return this.model as T
  }

  /**
   * Sets the lable for this checkbox.
   */
  setLabel(element: HTMLLabelElement) {
    element.htmlFor = this.id
  }
}
