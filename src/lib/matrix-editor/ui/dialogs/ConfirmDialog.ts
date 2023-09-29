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
  constructor(
    title: string,
    content: string,
    private readonly selectedYesCallback: () => void,
    private readonly selectedNoCallback?: (() => void) | null
  ) {
    super()
    this.setTitle(title)
    this.setContent(content)
  }

  protected override initialize() {
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(ModalDefaultButtons.YES)
    this.addButton(ModalDefaultButtons.NO)
  }

  protected override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('mb-confirm-dialog', 'nonSelectable')
  }

  protected override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler.listen(this, EventType.SELECT, (e: CustomEvent<any>) =>
      this.onHandleSelect(e)
    )
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
