import { MatrixModel } from '../../MatrixModel'
import { Component, EventType, KeyCodes } from '../Component'
import { Dialog } from '../Dialog'
import { ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'
import { Select } from '../Select'

/**
 * Add citation dialog.
 *
 * @param matrixModel the data associated with the matrix.
 * @param selectCallback the callback when the user presses save
 */
export class AddCitationDialog extends Dialog {
  /**
   * The last searched text
   */
  protected static lastSearchText: string = ''

  /**
   * The most recent cached search results as json.
   */
  protected static citationItems: { [key: string]: any }[] = []
  private citationSelect: Select

  constructor(
    private matrixModel: MatrixModel,
    private selectCallback: (
      p1: number,
      p2: string,
      p3: string
    ) => Promise<void>
  ) {
    super()
    this.citationSelect = new Select()
    this.registerDisposable(this.citationSelect)
    this.setTitle('Add citation')
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(ModalDefaultButtons.SAVE)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('addCitationDialog')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = AddCitationDialog.htmlContent()
    const citationInputElement =
      this.getElementByClass<HTMLInputElement>('citationInput')
    citationInputElement.value = AddCitationDialog.lastSearchText
    const citationSelectElement = this.getElementByClass('selectCitation')
    this.citationSelect.render(citationSelectElement)
    this.savingLabel.setText('Searching...')
    this.redrawCitationsSelect()
  }

  override enterDocument() {
    super.enterDocument()
    const citationInputElement = this.getElementByClass('citationInput')
    const citationFindElement = this.getElementByClass('citationFindButton')
    this.getHandler()
      .listen(citationInputElement, EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.onHandlerSearchInputKeyDown(e)
      )
      .listen(citationInputElement, [EventType.INPUT, EventType.CHANGE], () =>
        this.onHandleSearchInputChange()
      )
      .listen(citationFindElement, EventType.CLICK, () =>
        this.handleFindClick()
      )
      .listen(this, EventType.SELECT, (e: CustomEvent<any>) =>
        this.onHandleSelect(e)
      )
      .listen(this.citationSelect, EventType.SELECT, () =>
        this.enableSaveButton()
      )

    // disable save button
    this.enableSaveButton()
  }

  /**
   * Handles events when then search input changes
   */
  protected onHandleSearchInputChange() {
    const statusElement = this.getElementByClass('search-status')
    statusElement.innerHTML = '&nbsp;'
  }

  /**
   * Handlers events when for user key down events.
   *
   * @param e The event that triggerd this callback.
   */
  protected onHandlerSearchInputKeyDown(e: KeyboardEvent) {
    // Prevent the dialog from receiving the enter keycode which will close it and instead call the given function.
    if (e.code === KeyCodes.ENTER) {
      e.preventDefault()
      this.handleFindClick()
      return true
    }
  }

  /**
   * Handles the find button click event.
   */
  private handleFindClick() {
    const citationInputElement =
      this.getElementByClass<HTMLInputElement>('citationInput')
    AddCitationDialog.lastSearchText = citationInputElement.value
    this.savingLabel.saving()
    this.matrixModel
      .findCitation(AddCitationDialog.lastSearchText)
      .then((citations) => {
        const statusElement = this.getElementByClass('search-status')
        statusElement.textContent = 'Found ' + citations.length + ' citations'
        AddCitationDialog.citationItems = citations
        this.redrawCitationsSelect()
        this.savingLabel.saved()
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert('Error while trying to find citations: ' + e)
      })
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: CustomEvent) {
    if (e.detail.key === ModalDefaultButtonKeys.SAVE) {
      const selectedValue = this.citationSelect.getSelectedValue()
      if (selectedValue == null) {
        return
      }

      const citationId = parseInt(selectedValue, 10)

      const pageInputElement =
        this.getElementByClass<HTMLInputElement>('pageInput')
      const pages = pageInputElement.value

      const notesInputElement =
        this.getElementByClass<HTMLInputElement>('notesInput')
      const notes = notesInputElement.value

      this.selectCallback(citationId, pages, notes)
        .then(() => this.dispose())
        .catch((e) => alert(e))
      return false
    }
  }

  /**
   * Enables or Disables the 'Save' button
   */
  private enableSaveButton() {
    if (!this.isInDocument()) {
      return
    }
    const enabled = !!this.citationSelect.getSelectedValue()
    this.setButtonEnabled(ModalDefaultButtons.SAVE, enabled)
  }

  /** Redraws the citation select component */
  redrawCitationsSelect() {
    const citations = AddCitationDialog.citationItems
    this.citationSelect.clearItems()
    for (let x = 0; x < citations.length; x++) {
      const citation = citations[x]
      this.citationSelect.addItem(citation['name'], citation['id'])
    }
    this.citationSelect.redraw()
  }

  /**
   * @return The HTML content of the add citation dialog
   */
  static htmlContent(): string {
    return `\
      <div class="input-group mb-3">\
        <input type="text" class="citationInput form-control" placeholder="Search">\
        <button class="citationFindButton btn btn-primary" type="button" id=>Find</button>\
      </div>\
      <span class="search-status">&nbsp;</span>
      <hr />
      <div class="label">Bibliographic reference</div>
      <div class="selectCitation"></div>
      <div class="label">Pages</div>
      <input class="pageInput" />
      <div class="label">Citation notes</div>
      <textarea class="notesInput" />`
  }
}
