import { EventType } from '../Component'
import { Modal, ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'

/**
 * Add comment dialog.
 *
 * @param selectCallback the callback when the user press save
 */
export class AddCommentDialog extends Modal {
  constructor(private readonly selectCallback: (p1: string) => Promise<void>) {
    super()
    this.setTitle('Add comment')
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(ModalDefaultButtons.SAVE)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('addCommentDialog')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = AddCommentDialog.htmlContent()
  }

  override enterDocument() {
    this.enterDocument()
    const handler = this.getHandler()
    handler.listen(this, EventType.SELECT, (e: CustomEvent<any>) => this.onHandleSelect(e))
  }

  /**
   * Handles when the users clicks one of the dialog buttons.
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: CustomEvent) {
    if (e.detail.key === ModalDefaultButtonKeys.SAVE) {
      const commentElement =
        this.getElementByClass<HTMLTextAreaElement>('comment')
      this.selectCallback(commentElement.value).then(() => this.dispose())
      return false
    }
  }

  /**
   * The dialog's HTML Content
   */
  static htmlContent() {
    return '<textarea class="comment" />'
  }
}
