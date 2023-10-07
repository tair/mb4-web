import { Citation } from '../../data/Citation'
import { EventType } from '../Component'
import { Modal, ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'

/**
 * Edit citation dialog.
 *
 * @param citation the citation to edit in this dialog
 * @param successCallback the callback when the user presses ok
 */
export class EditCitationDialog extends Modal {
  private readonly citation: Citation
  private readonly successCallback: (p1: string, p2: string) => Promise<void>

  constructor(
    citation: Citation,
    successCallback: (p1: string, p2: string) => Promise<void>
  ) {
    super()

    this.citation = citation
    this.successCallback = successCallback

    this.setTitle('Edit Citation')
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(ModalDefaultButtons.SAVE)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('editCitationDialog')
    element.classList.add('nonSelectable')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = EditCitationDialog.htmlContent()
    const referenceElement =
      this.getElementByClass<HTMLInputElement>('reference')
    referenceElement.value = this.citation.getName()
    const pagesElement = this.getElementByClass<HTMLInputElement>('pages')
    pagesElement.value = this.citation.getPages()
    const notesElement = this.getElementByClass<HTMLInputElement>('notes')
    notesElement.value = this.citation.getNotes()
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler.listen(this, EventType.SELECT, (e: KeyboardEvent) =>
      this.onHandleSelect(e)
    )
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: KeyboardEvent) {
    if (e.key === ModalDefaultButtonKeys.OK) {
      const pagesElement = this.getElementByClass<HTMLInputElement>('pages')
      const notesElement = this.getElementByClass<HTMLInputElement>('notes')
      this.successCallback(pagesElement.value, notesElement.value).then(() =>
        this.dispose()
      )
      return false
    }
  }

  /**
   * The dialog's HTML Content
   */
  static htmlContent() {
    return (
      '' +
      '<div class="label">Bibliographic reference</div>' +
      '<textarea class="reference" readonly></textarea>' +
      '<div class="label">Pages</div>' +
      '<input class="pages" />' +
      '<div class="label">Citation notes</div>' +
      '<textarea class="notes" />'
    )
  }
}
