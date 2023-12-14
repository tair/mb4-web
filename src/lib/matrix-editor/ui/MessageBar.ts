import { Component } from './Component'
import { Alert } from 'bootstrap'

/**
 * This is a modal window that informs that user about the loading states of the matrix editor.
 *
 * @param text The text to display as a message.
 * @param sticky Whether the message bar is sticky.
 */
export class MessageBar extends Component {
  private readonly text: string

  constructor(text: string) {
    super()
    this.text = text
  }

  override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add(
      'messageBar',
      'alert',
      'alert-primary',
      'alert-dismissible',
      'show',
      'fade'
    )
    element.innerHTML = this.htmlContent()
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    const element = this.getElement()
    handler.listen(element, 'closed.bs.alert', () => this.dispose())
  }

  /** Dismisses the message bar. */
  hide() {
    const alert = new Alert(this.getElement())
    alert.close()
  }

  /**
   * The HTML of the MessageBar
   */
  htmlContent(): string {
    return `
    <span class="message">${this.text}</span>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `
  }
}
