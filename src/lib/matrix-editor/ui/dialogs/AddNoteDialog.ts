import { EventType } from '../Component'
import { Dropdown } from '../Dropdown'
import { Modal, ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'
import { CellInfo, type CellInfoStatus } from '../../data/Cells'

export class AddNoteDialog extends Modal {
  protected readonly select: Dropdown

  /**
   * Add note dialog.
   *
   * @param selectCallback the callback when the user press save
   */
  constructor(
    protected selectCallback: (
      status: CellInfoStatus,
      note: string
    ) => Promise<void>
  ) {
    super()

    this.setTitle('Add notes')
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)

    this.select = new Dropdown()
    this.registerDisposable(this.select)

    this.addButton(ModalDefaultButtons.SAVE)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('addCommentDialog')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = this.htmlContent()
    this.setSelectMenuItems()
    const statusControlElement = this.getElementByClass('control')
    this.select.render(statusControlElement)
    this.select.setSelectedIndex(0)
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler.listen(this, EventType.SELECT, (e: CustomEvent<any>) =>
      this.onHandleSelect(e)
    )
  }

  /**
   * Sets the select options
   */
  setSelectMenuItems() {
    const statusOptions = CellInfo.STATUS_OPTIONS
    for (let name in statusOptions) {
      this.select.addItem({ text: name, value: statusOptions[name] })
    }
  }

  /**
   * Handles when the users clicks one of the dialog buttons.
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleSelect(e: CustomEvent) {
    if (e.detail.key === ModalDefaultButtonKeys.SAVE) {
      const noteElement = this.getElementByClass<HTMLTextAreaElement>('comment')
      const selectValue = parseInt(
        this.select.getSelectedValue(),
        10
      ) as CellInfoStatus
      this.selectCallback(selectValue, noteElement.value).then(() =>
        this.close()
      )
      return false
    }
  }

  /**
   * @return Returns the dialog's HTML Content
   */
  protected htmlContent(): string {
    return (
      '<textarea class="comment"></textarea>' +
      '<div class="control">' +
      '<div class="field">Status</div>' +
      '</div>'
    )
  }
}
