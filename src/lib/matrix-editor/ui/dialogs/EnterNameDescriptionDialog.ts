import { Modal, ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'
import { EventType, KeyCodes } from '../Component'

/**
 * Enter the name and description dialog.
 *
 * @param title the title for the dialog
 * @param successCallback the callback when the user presses ok
 */
export class EnterNameDescriptionDialog extends Modal {
  private successCallback: (p1: string, p2: string) => Promise<void>

  constructor(
    title: string,
    successCallback: (p1: string, p2: string) => Promise<void>
  ) {
    super()

    this.successCallback = successCallback
    this.setTitle(title)
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(ModalDefaultButtons.SAVE)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('enterNameDescriptionDialog')
    element.classList.add('nonSelectable')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = EnterNameDescriptionDialog.htmlContent()
  }

  override enterDocument() {
    super.enterDocument()
    const nameElement = this.getElementByClass('name')
    this.getHandler()
      .listen(nameElement, EventType.KEYDOWN, (e: KeyboardEvent) => this.handleEnterPress(e))
      .listen(nameElement, EventType.INPUT, () => this.handleOnNameInput())
      .listen(this, EventType.SELECT, (e: CustomEvent<any>) => this.onHandleSelect(e))
    this.handleOnNameInput()
  }

  /**
   * Sets the name
   * @param name the name to set
   */
  setName(name: string) {
    const nameElement = this.getElementByClass<HTMLInputElement>('name')
    nameElement.value = name
    this.handleOnNameInput()
  }

  /**
   * Sets the description
   * @param description the description to set
   */
  setDescription(description: string) {
    const descriptionElement =
      this.getElementByClass<HTMLInputElement>('description')
    descriptionElement.value = description
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: CustomEvent) {
    if (e.detail.key === ModalDefaultButtonKeys.SAVE) {
      const nameElement = this.getElementByClass<HTMLInputElement>('name')
      const descriptionElement =
        this.getElementByClass<HTMLInputElement>('description')
      this.successCallback(nameElement.value, descriptionElement.value).then(
        () => this.close()
      )
      return false
    }
  }

  /**
   * Handlers events when for user key down events.
   *
   * @param e The event that triggerd this callback.
   */
  private handleEnterPress(e: KeyboardEvent) {
    // Prevent the dialog from receiving the enter keycode which will close it.
    if (e.code === KeyCodes.ENTER) {
      e.preventDefault()
      return true
    }
    return false
  }

  /**
   * Handlers events when for user key down events.
   *
   */
  protected handleOnNameInput() {
    const nameElement = this.getElementByClass<HTMLInputElement>('name')
    this.enableSaveButton(nameElement.value !== '')
  }

  /**
   * Enables or Disables the 'Add' button
   * @param enabled Whether to enable or disable the add button
   */
  enableSaveButton(enabled: boolean) {
    if (!this.isInDocument()) {
      return
    }
    this.setButtonEnabled(ModalDefaultButtons.SAVE, enabled)
  }

  /**
   * The dialog's HTML Content
   */
  static htmlContent() {
    return (
      '<div class="label">Name</div>' +
      '<input class="name"/>' +
      '<div class="label">Description</div>' +
      '<textarea class="description" />'
    )
  }
}
