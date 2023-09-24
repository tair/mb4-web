import { Modal, ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'
import { EventType } from '../Component'

/**
 * Confirmation dialog.
 *
 * @param title the title for the dialog
 * @param content the content for the dialog
 * @param selectedYesCallback the callback when the user presses ok
 * @param selectedNoCallback the callback when the user presses no
 */
export class ConfirmDialog extends Modal {
  private selectedNoCallback: (() => any) | null

  constructor(
    title: string,
    content: string,
    private selectedYesCallback: () => any,
    selectedNoCallback?: (() => any) | null
  ) {
    super()
    this.selectedNoCallback = selectedNoCallback || null
    this.setTitle(title)
    this.setContent(content)
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(ModalDefaultButtons.YES)
    this.addButton(ModalDefaultButtons.NO)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('mb-confirm-dialog', 'nonSelectable')
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
    if (e.detail.key === ModalDefaultButtonKeys.YES) {
      this.selectedYesCallback()
    } else {
      if (
        e.detail.key === ModalDefaultButtonKeys.NO &&
        this.selectedNoCallback
      ) {
        this.selectedNoCallback()
      }
    }
    return true
  }
}
