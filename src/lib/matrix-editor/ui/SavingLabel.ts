import { Component } from './Component'

/**
 * This is a modal window that informs that user about the loading states of the matrix editor.
 *
 * @param text The optional text for the saving label
 */
export class SavingLabel extends Component {
  private text: string
  private previousTexts: string[] = []
  private numberOfPendingOperations: number = 0

  constructor(text?: string) {
    super()
    this.text = text || 'Saving...'
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('savingLabel')
    element.textContent = this.text
  }

  /**
   * @return The text of the saving label
   */
  getText(): string {
    return this.text
  }

  /**
   * Updates the text
   * @param text The new text to change to
   */
  setText(text: string) {
    this.text = text
    const element = this.getElement()
    element.textContent = this.text
  }

  /**
   * Indicates to the user some sort of information.
   * @param text An optional text to set for this notification.
   */
  info(text: string) {
    if (this.isDisposed()) {
      return
    }
    this.removeStyles()
    const element = this.getElement()
    element.textContent = text
    element.classList.add('info')
  }

  /**
   * Indicates to the user that the operation is currently attempting to save.
   * @param text An optional text to set for this notification.
   */
  saving(text?: string) {
    if (this.isDisposed()) {
      return
    }
    if (this.numberOfPendingOperations === 0) {
      this.maybeSetTemporaryText(text)
    }
    if (++this.numberOfPendingOperations > 0) {
      this.removeStyles()
      const element = this.getElement()
      element.classList.add('saving')
    }
  }

  /**
   * Indicates to the user that the operation has saved.
   */
  saved() {
    if (this.isDisposed()) {
      return
    }
    if (--this.numberOfPendingOperations <= 0) {
      this.removeStyles()
      const element = this.getElement()
      element.classList.add('saved')
      this.hide()
    }
  }

  /**
   * Indicates to the user that the saving operation has failed.
   */
  failed() {
    if (this.isDisposed()) {
      return
    }
    if (--this.numberOfPendingOperations <= 0) {
      this.removeStyles()
      const element = this.getElement()
      element.classList.add('error')
      this.hide()
    }
  }

  /**
   * Actually hides the saving label.
   */
  private hide() {
    setTimeout(() => {
      if (this.isDisposed()) {
        return
      }
      this.removeStyles()
      this.maybeRestorePreviousText()
    }, 1300)
  }

  /**
   * Removes the styles from the element.
   */
  private removeStyles() {
    const element = this.getElement()
    element.classList.remove('saving')
    element.classList.remove('error')
    element.classList.remove('saved')
    element.classList.remove('info')
  }

  /**
   * Updates the text temporarily.
   * @param text The new text.
   */
  private maybeSetTemporaryText(text?: string) {
    if (text) {
      this.previousTexts.push(this.text)
      this.setText(text)
    } else {
      this.maybeRestorePreviousText()
    }
  }

  /**
   * Restores a previous text if one exists.
   */
  private maybeRestorePreviousText() {
    // If it has a previous text, let's revert it back.
    const text =
      this.previousTexts.length > 0
        ? (this.previousTexts.pop() as string)
        : this.text
    this.setText(text)
  }
}
