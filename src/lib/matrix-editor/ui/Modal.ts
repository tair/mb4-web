import { Component, EventType } from './Component'
import * as bootstrap from 'bootstrap'

/**
 * A general Modal for the Matrix Editor
 *
 */
export class Modal extends Component {
  /**
   * The bootstrap modal.
   */
  private modal: bootstrap.Modal

  /**
   * Dialog's title.
   */
  private title: string

  /**
   * Whether this dialog should include a title close button.
   */
  private hasTitleCloseButton: boolean

  /**
   * The buttons to render in this modal.
   */
  private buttons: ModalButton[]

  /**
   * Whether the dialog will have a backdrop.
   */
  private hasBackdrop: boolean
  private disposeOnHide: boolean
  private content: string

  constructor() {
    super()

    this.title = ''
    this.hasTitleCloseButton = true;
    this.buttons= []
    this.hasBackdrop = true;
    this.disposeOnHide = false;
  }

  override dispose() {
    if (this.modal) {
      this.modal.dispose()
    }
    this.modal = null
    super.dispose()
  }

  protected override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('modal', 'fade')
    element.innerHTML = this.createModel()
  }

  protected override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    const buttonsElement = this.getButtonsElement()
    const buttonElements = buttonsElement.querySelectorAll('button')
    buttonElements.forEach((buttonElement) => {
      handler.listen(buttonElement, EventType.CLICK, (e: Event) =>
        this.handleButtonClick(e)
      )
    })
    if (this.disposeOnHide) {
      const element = this.getElement()
      element.addEventListener('hidden.bs.modal', () => this.dispose())
    }
  }

  protected override finalizeDom() {
    const element = this.getElement()
    this.modal = new bootstrap.Modal(element, { backdrop: this.hasBackdrop })
    this.modal.show()
  }

  /**
   * Set the modal's visibility.
   * @param visible Whether the modal should be visible.
   */
  setVisible(visible: boolean) {
    if (!this.inDocument) {
      if (visible) {
        this.render()
      } else {
        return
      }
    }
    if (visible) {
      this.modal.show()
    } else {
      this.modal.hide()
    }
  }

  /**
   * @return Whether the dialog is visible.
   */
  isVisible(): boolean {
    const element = this.getElement()
    return element.classList.contains('show')
  }

  /** Closes the dialog. */
  close() {
    this.modal.hide()
  }

  /**
   * Set whether the modal will have a backdrop.
   * @param hasBackdrop Whether the background modal is shown.
   */
  protected setHasBackdrop(hasBackdrop: boolean) {
    this.hasBackdrop = hasBackdrop
  }

  /**
   * Set whether the modal will dispose when it's hidden.
   * @param disposeOnHide Whether to dispose the modal when hidden.
   */
  setDisposeOnHide(disposeOnHide: boolean) {
    this.disposeOnHide = disposeOnHide
  }

  /**
   * Sets whether the dialog should have a close button in the title bar. There
   * will always be an element for the title close button, but setting this
   * parameter to false will cause it to be hidden and have no active listener.
   * @param hasTitleCloseButton Whether this dialog should have a title close button.
   */
  protected setHasTitleCloseButton(hasTitleCloseButton: boolean) {
    this.hasTitleCloseButton = hasTitleCloseButton
  }

  /**
   * Sets the title.
   * @param title The title text.
   */
  protected setTitle(title: string) {
    this.title = title
  }

  /**
   * Allows arbitrary HTML to be set in the content element.
   * @param content Content HTML.
   */
  protected setContent(content: string) {
    this.content = content
  }

  /**
   * Add a button
   * @param button The text of the button
   */
  protected addButton(button: ModalButton) {
    this.buttons.push(button)
  }

  /**
   * Only show the buttons in the modal.
   */
  showButtons(buttons: ModalButton[]) {
    const keys = buttons.map((b) => b.key || b.text)
    const element = this.getButtonsElement() as HTMLElement
    const buttonElements = element.querySelectorAll('button')
    buttonElements.forEach((buttonElement) => {
      const key = buttonElement.dataset['key'] || ''
      buttonElement.style.display = keys.includes(key) ? 'inline' : 'none'
    })
  }

  /**
   * Set whether a button is enabled.
   * @param button The button to enable or disable.
   * @param enabled Whether the button should be enabled.
   *
   */
  setButtonEnabled(button: ModalButton, enabled: boolean) {
    const key = button.key || button.text
    const querySelectorText = `[data-key='${key}']`
    const element = this.getElement()
    const buttonElement = element.querySelector(
      querySelectorText
    ) as HTMLButtonElement
    if (buttonElement) {
      buttonElement.disabled = !enabled
    }
  }

  /**
   * Handles when one of the buttons was clicked.
   */
  private handleButtonClick(e: Event) {
    const target = <HTMLElement>e.target
    const key = target.dataset.key
    this.dispatchEvent(
      new CustomEvent(EventType.SELECT, { detail: { key: key } })
    )
  }

  /**
   * Gets the component's element.
   * @return The element for the component.
   */
  getTitleElement(): HTMLElement {
    return this.getElementByClass<HTMLElement>('modal-title')
  }

  /**
   * Gets the component's element.
   * @return The element for the component.
   */
  getContentElement(): HTMLElement {
    return this.getElementByClass<HTMLElement>('modal-body')
  }

  /**
   * Gets the component's element.
   * @return The element for the component.
   */
  getButtonsElement(): HTMLElement {
    return this.getElementByClass<HTMLElement>('modal-footer')
  }

  /**
   * @return The HTML of the dialog.
   */
  private createModel(): string {
    const closeButtonHtml = this.hasTitleCloseButton
      ? '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'
      : ''
    return `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${this.title}</h5>
            ${closeButtonHtml}
          </div>
          <div class="modal-body">
            ${this.content || ''}
          </div>
          <div class="modal-footer">
            ${this.createButtons()}
          </div>
        </div>
      </div>
  `
  }

  /**
   * @return The HTML of the button footer.
   */
  private createButtons(): string {
    let buttonHtml = ''
    for (const button of this.buttons) {
      const dismissable = button.dismissable ? 'data-bs-dismiss="modal"' : ''
      buttonHtml += `<button type="button" class="btn btn-primary" data-key="${
        button.key || button.text
      }" ${dismissable}>${button.text}</button>`
    }
    return buttonHtml
  }
}

export type ModalButton = {
  text: string
  key: string
  dismissable: boolean | null
}

/**
 * The keys used to identify standard buttons in events.
 */
enum ModalDefaultButtonLabel {
  OK = 'Ok',
  CANCEL = 'Cancel',
  DONE = 'Done',
  YES = 'Yes',
  NO = 'No',
  SAVE = 'Save',
  CONTINUE = 'Continue',
}

/**
 * The keys used to identify standard buttons in events.
 */
export enum ModalDefaultButtonKeys {
  OK = 'ok',
  CANCEL = 'cancel',
  DONE = 'done',
  YES = 'yes',
  NO = 'no',
  SAVE = 'save',
  CONTINUE = 'continue',
}

/**
 * The standard buttons (keys associated with captions).
 */
export const ModalDefaultButtons: { [value: string]: ModalButton } = {
  OK: {
    text: ModalDefaultButtonLabel.OK,
    key: ModalDefaultButtonKeys.OK,
    dismissable: true,
  },
  DONE: {
    text: ModalDefaultButtonLabel.DONE,
    key: ModalDefaultButtonKeys.DONE,
    dismissable: true,
  },
  CANCEL: {
    text: ModalDefaultButtonLabel.CANCEL,
    key: ModalDefaultButtonKeys.CANCEL,
    dismissable: true,
  },
  YES: {
    text: ModalDefaultButtonLabel.YES,
    key: ModalDefaultButtonKeys.YES,
    dismissable: true,
  },
  NO: {
    text: ModalDefaultButtonLabel.NO,
    key: ModalDefaultButtonKeys.NO,
    dismissable: true,
  },
  SAVE: {
    text: ModalDefaultButtonLabel.SAVE,
    key: ModalDefaultButtonKeys.SAVE,
    dismissable: false,
  },
  CONTINUE: {
    text: ModalDefaultButtonLabel.CONTINUE,
    key: ModalDefaultButtonKeys.CONTINUE,
    dismissable: false,
  },
}
