import { Component, EventType } from './Component'

/**
 * A general Modal for the Matrix Editor
 *
 * @param name The name of this radio.
 */
export class Radio extends Component {
  private options: RadioOption[] = []

  constructor(private readonly name: string) {
    super()
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = this.createHTML()
  }

  override enterDocument() {
    super.enterDocument()

    const element = this.getElement()
    this.getHandler()
      .listen(element, EventType.CHANGE, (e) => this.propagateEvent(e))
  }

  /**
   * Add option to this select.
   */
  addItem(option: RadioOption) {
    this.options.push(option)
  }

  /**
   * Sets the selected index in this dropdown.
   * @return The selected index.
   */
  getSelectedIndex(): number {
    if (!this.isInDocument()) {
      throw 'not in document yet'
    }
    const element = this.getElement()
    const optionElements = element.querySelectorAll<HTMLInputElement>(
      `input[name="${this.name}"]`
    )
    for (let x = 0; x < optionElements.length; x++) {
      if (optionElements[x].checked) {
        return x
      }
    }
    return -1
  }

  /**
   * Sets the selected index in this dropdown.
   * @param index The index to set.
   */
  setSelectedIndex(index: number) {
    if (!this.isInDocument()) {
      throw 'not in document yet'
    }
    const element = this.getElement()
    const optionElements = element.querySelectorAll<HTMLInputElement>(
      `input[name="${this.name}"]`
    )
    optionElements[index].checked = true
  }

  /**
   * Gets the selected index.
   * @param enabled Whether this component is enabled.
   */
  setEnabled(enabled: boolean) {
    const element = this.getElement()
    const optionElements = element.querySelectorAll<HTMLInputElement>(
      `input[name="${this.name}"]`
    )
    optionElements.forEach((optionElement) => {
      optionElement.disabled = !enabled
    })
  }

  /**
   * @return The HTML of the dialog.
   */
  createHTML(): string {
    let html = '<div>'
    for (const option of this.options) {
      const radioId = Component.makeNewId()
      html += `
    <div class="form-check">
      <input class="form-check-input" type="radio" name="${this.name}" value="${option.value}" id="${radioId}">
      <label class="form-check-label" for="${radioId}">
        ${option.text}
      </label>
    </div>`
    }
    html += '</div>'
    return html
  }
}

//const element = this.getElement();
export interface RadioOption {
  text: string
  value: string | number
}
