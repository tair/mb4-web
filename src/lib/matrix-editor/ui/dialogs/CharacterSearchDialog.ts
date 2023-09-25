import { MatrixModel } from '../../MatrixModel'
import { DataGridTable, DataRow } from '../DataGridTable'
import { Dialog } from '../Dialog'
import { LabelInput } from '../LabelInput'
import { Dropdown } from '../Dropdown'
import { ModalDefaultButtons } from '../Modal'
import { EventType, KeyCodes } from '../Component'
import * as GoToCharacterEvents from '../../events/GoToCharacterEvent'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import * as TaxaChangedEvents from '../../events/TaxaChangedEvent'

/**
 * Character Search dialog.
 *
 * @param matrixModel the data associated with the matrix.
 */
export class CharacterSearchDialog extends Dialog {
  /**
   * List of available character search options
   */
  private static CHARACTER_SEARCH_OPTIONS: string[] = [
    'with text',
    'with unread comments',
    'with warnings',
  ]

  private readonly matrixModel: MatrixModel
  protected gridTable: DataGridTable
  private characterSearchSelect: Dropdown
  private characterSearchInput: LabelInput

  constructor(matrixModel: MatrixModel) {
    super()

    this.matrixModel = matrixModel

    this.gridTable = new DataGridTable()
    this.registerDisposable(this.gridTable)

    this.characterSearchSelect = new Dropdown()
    this.registerDisposable(this.characterSearchSelect)

    this.characterSearchInput = new LabelInput()
    this.registerDisposable(this.characterSearchInput)

    this.setTitle('Search')
    this.setHasBackdrop(false)
    this.addButton(ModalDefaultButtons.DONE)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('searchDialog')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = CharacterSearchDialog.htmlContent()
    const searchResultsElement = this.getElementByClass('searchResults')
    this.gridTable.render(searchResultsElement)
    const searchOptions = CharacterSearchDialog.CHARACTER_SEARCH_OPTIONS
    for (let x = 0; x < searchOptions.length; x++) {
      const searchOption = searchOptions[x]
      this.characterSearchSelect.addItem({
        text: searchOption,
        value: searchOption,
      })
    }
    const inputElement = this.getElementByClass('search-input')
    this.characterSearchSelect.render(inputElement)
    this.characterSearchInput.render(inputElement)
    this.characterSearchSelect.setSelectedIndex(0)
    this.savingLabel.setText('Searching...')
  }

  override enterDocument() {
    super.enterDocument()
    const searchButtonElement = this.getElementByClass('searchButton')
    this.getHandler()
      .listen(this.gridTable, EventType.SELECT, (e: CustomEvent<any>) =>
        this.onHandleGridClick(e)
      )
      .listen(
        this.matrixModel,
        [CharacterChangedEvents.TYPE, TaxaChangedEvents.TYPE],
        (e: Event) => this.onHandleSearchChange(e)
      )
      .listen(
        this.characterSearchInput.getElement(),
        EventType.KEYDOWN,
        (e: KeyboardEvent) =>
          this.onHandleEnterPress(this.onHandleSearchClick, e)
      )
      .listen(this.characterSearchSelect, EventType.CHANGE, (e: Event) =>
        this.onHandleSearchChange(e)
      )
      .listen(searchButtonElement, EventType.CLICK, () =>
        this.onHandleSearchClick()
      )
  }

  /**
   * Handles events when character rules are removed.
   * @param e The event that triggerd this callback
   */
  protected onHandleGridClick(e: CustomEvent) {
    const characterId = parseInt(e.detail['characterId'], 10)
    const column = characterId
      ? this.matrixModel.getCharacterIndexById(characterId)
      : -1
    window.dispatchEvent(GoToCharacterEvents.create(column))
  }

  /**
   * Handles the search button click event.
   */
  protected onHandleSearchChange(e: Event) {
    this.gridTable.clearRows()
    this.gridTable.redraw()

    const searchStates = this.getElementByClass('searchStats')
    searchStates.innerHTML = '&nbsp;'

    if (e.type === 'change') {
      const searchSelectedOption = this.characterSearchSelect.getSelectedValue()
      this.characterSearchInput.setEnabled(searchSelectedOption === 'with text')
      this.characterSearchInput.clear()
    }
  }

  /**
   * Handles the search button click event.
   */
  protected onHandleSearchClick() {
    let searchOptions
    switch (this.characterSearchSelect.getSelectedValue()) {
      case 'with text':
        searchOptions = { text: this.characterSearchInput.getValue() }
        break
      case 'with unread comments':
        searchOptions = { limitToUnreadComments: true }
        break
      case 'with warnings':
        searchOptions = { limitWithWarnings: true }
        break
      default:
        searchOptions = {}
    }
    this.savingLabel.saving()
    this.matrixModel
      .searchCharacters(searchOptions)
      .then((results) => {
        const rows: DataRow[] = []
        for (let x = 0; x < results.length; x++) {
          const result = results[x]
          const row = {
            labels: [result.label],
            data: { characterId: result.id },
          }
          rows.push(row)
        }
        this.gridTable.clearRows()
        this.gridTable.addRows(rows)
        this.gridTable.redraw()
        const searchStates = this.getElementByClass('searchStats')
        searchStates.textContent = 'Found ' + results.length + ' results'
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * Handlers events when for user key down events.
   *
   * @param enterFunction the function to call when enter is pressed
   * @param e The event that triggerd this callback.
   */
  protected onHandleEnterPress(enterFunction: () => any, e: KeyboardEvent) {
    // Prevent the dialog from receiving the enter keycode which will close it and instead call the given function.
    if (e.code === KeyCodes.ENTER) {
      e.preventDefault()
      enterFunction()
      return true
    }
  }

  /**
   * @return The HTML content for the base pane
   */
  static htmlContent(): string {
    return (
      '' +
      '<div class="searchControls">' +
      '<div class="search-input"></div>' +
      '<button type="button" class="searchButton btn btn-primary">Search</button>' +
      '</div>' +
      '<div class="searchStats">&nbsp;</div>' +
      '<div class="searchResults"></div>'
    )
  }
}
