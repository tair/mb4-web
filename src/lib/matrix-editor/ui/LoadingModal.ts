import { Component } from './Component'
import * as bootstrap from 'bootstrap'

/**
 * This is a modal window that informs that user about the loading states of the matrix editor.
 *
 */
export class LoadingModal extends Component {
  private pendingOperations: number = 4

  constructor() {
    super()
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('loadingModal', 'alert', 'show', 'fade')
    element.innerHTML = LoadingModal.htmlContent()
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    const element = this.getElement()
    handler.listen(element, 'closed.bs.alert', () => this.dispose())
  }

  /**
   * Sets LI element in dialog to completed
   * @param index The index of the LI element
   */
  private completeLiElement(index: number) {
    const element = this.getElement()
    const liElements = element.getElementsByTagName('li')
    const liElement = liElements[index]
    liElement.classList.add('done')
    if (--this.pendingOperations <= 0) {
      this.close()
    }
  }

  /**
   * Sets the character and taxa loading icon to a checkmark.
   */
  loadedCharactersAndTaxa() {
    this.completeLiElement(0)
  }

  /**
   * Sets the character and taxa loading icon to a checkmark.
   */
  loadedCells() {
    this.completeLiElement(1)
  }

  /**
   * Sets the character and taxa loading icon to a checkmark.
   */
  loadedNotes() {
    this.completeLiElement(2)
  }

  /**
   * Sets the character and taxa loading icon to a checkmark.
   */
  loadedMedia() {
    this.completeLiElement(3)
  }

  /**
   * Sets the character and taxa loading icon to a checkmark.
   */
  private setErrors() {
    const element = this.getElement()
    const liElements = element.getElementsByTagName('li')
    for (let x = 0; x < liElements.length; x++) {
      const liElement = liElements[x]
      if (!liElement.classList.contains('done')) {
        liElement.classList.add('error')
      }
    }
  }

  /**
   * Close the dialog.
   */
  close() {
    if (!this.isDisposed()) {
      this.setErrors()
      const alert = new bootstrap.Alert(this.getElement())
      alert.close()
    }
  }

  /**
   * The HTML of the LoadingModal
   */
  static htmlContent(): string {
    return `
    <ul>
      <li>Loading characters & taxa</li>
      <li>Loading cells</li>
      <li>Loading cell notes</li>
      <li>Loading cell media</li>
    </ul>
  `
  }
}
