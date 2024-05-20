import { Modal } from '../Modal'
import { ModalDefaultButtons } from '../Modal'

/**
 * Alert dialog.
 *
 * @param content the content for the dialog
 */
export class AlertDialog extends Modal {
  constructor(content: string) {
    super()
    this.setTitle('Alert')
    this.setContent(content)
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(ModalDefaultButtons.OK)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('mb-alert-dialog')
  }

  /**
   * Displays an alert dialog.
   *
   * @param content the content for the dialog
   */
  static show(content: string) {
    const alertDialog = new AlertDialog(content)
    alertDialog.setVisible(true)
  }
}
