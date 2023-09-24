import { Modal, ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'
import { EventType } from '../Component'

/**
 * Confirmation dialog.
 *
 * @param title the title for the dialog
 * @param content the content for the dialog
 * @param successCallback the callback when the user presses yes or no
 */
export class CancelableConfirmDialog extends Modal {
  constructor(
    title: string,
    content: string,
    private successCallback: (p1: boolean) => any
  ) {
    super()
    this.setTitle(title)
    this.setContent(content)
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(ModalDefaultButtons.YES)
    this.addButton(ModalDefaultButtons.NO)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('mb-confirm-dialog')
    element.classList.add('nonSelectable')
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler.listen(this, EventType.SELECT, (e: CustomEvent<any>) => this.onHandleSelect(e))
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: CustomEvent) {
    if (e.detail.key !== ModalDefaultButtonKeys.CANCEL) {
      this.successCallback(e.detail.key === ModalDefaultButtonKeys.OK)
    }
  }
}
