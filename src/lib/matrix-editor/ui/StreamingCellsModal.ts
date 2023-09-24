import { Component } from './Component'

/**
 * This is a modal window that informs that user about the loading states of the matrix editor.
 *
 */
export class StreamingCellsModal extends Component {
  private numberOfPendingOperations: number = 0

  constructor() {
    super()
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('streamingModalBackground')
    element.innerHTML = StreamingCellsModal.htmlContent()
  }

  /**
   * Shows the streaming cells modal.
   */
  show() {
    if (++this.numberOfPendingOperations === 1) {
      const element = this.getElement()
      element.classList.add('show')
    }
  }

  /**
   * Hides the streaming cells modal.
   */
  hide() {
    if (--this.numberOfPendingOperations === 0) {
      const element = this.getElement()
      element.classList.remove('show')
    }
  }

  /**
   * The HTML of the StreamingCellsModal
   */
  static htmlContent(): string {
    return '<div class="streamingModal">Loading cells...</div>'
  }
}
