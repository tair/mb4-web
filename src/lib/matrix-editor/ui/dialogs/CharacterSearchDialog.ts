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
  private readonly gridTable: DataGridTable
  private readonly characterSearchSelect: Dropdown

  constructor(matrixModel: MatrixModel) {
    super()

    this.matrixModel = matrixModel

    this.gridTable = new DataGridTable()
    this.registerDisposable(this.gridTable)

    this.characterSearchSelect = new Dropdown()
    this.registerDisposable(this.characterSearchSelect)
  }

  protected override initialize(): void {
    this.savingLabel.setText('Searching...')
  
    this.setTitle('Search')
    this.setHasBackdrop(false)
    this.addButton(ModalDefaultButtons.DONE)
  }

  protected override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('searchDialog', 'modal-lg')

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
    this.characterSearchSelect.setSelectedIndex(0)

    const inputContainerElement = this.getElementByClass('searchInput')
    this.characterSearchSelect.render(inputContainerElement)

    const inputElement = document.createElement('input')
    inputElement.type = 'text';
    inputElement.classList.add('form-control')
    inputContainerElement.appendChild(inputElement)
  }

  protected override enterDocument() {
    super.enterDocument()
    const searchButtonElement = this.getElementByClass('searchButton')
    const searchContainerElement = this.getElementByClass('searchInput')
    const inputElement = searchContainerElement.querySelector('input')
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
        inputElement,
        EventType.KEYDOWN,
        (e: KeyboardEvent) =>
          this.onHandleEnterPress(() => this.onHandleSearchClick(), e)
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
  private onHandleGridClick(e: CustomEvent<CharacterSearchResult>) {
    const characterId = parseInt(e.detail.characterId, 10)
    const column = characterId
      ? this.matrixModel.getCharacterIndexById(characterId)
      : -1
    window.dispatchEvent(GoToCharacterEvents.create(column))
  }

  /**
   * Handles the search button click event.
   */
  private onHandleSearchChange(e: Event) {
    this.gridTable.clearRows()
    this.gridTable.redraw()

    const searchStates = this.getElementByClass('searchStats')
    searchStates.innerHTML = '&nbsp;'

    if (e.type === 'change') {
      const searchSelectedOption = this.characterSearchSelect.getSelectedValue()
      const searchContainerElement = this.getElementByClass('searchInput')
      const inputElement = searchContainerElement.querySelector('input')
      inputElement!.disabled = searchSelectedOption !== 'with text'
      inputElement!.value = ''
    }
  }

  /**
   * Handles the search button click event.
   */
  private async onHandleSearchClick() {
    let searchOptions
    switch (this.characterSearchSelect.getSelectedValue()) {
      case 'with text':
        const searchElement = this.getElementByClass('searchInput')
        const searchInputElement = searchElement.querySelector('input')
        searchOptions = { text: searchInputElement!.value }
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
          const data: CharacterSearchResult = {
            characterId: String(result.id)
          }
          const row = {
            labels: [result.label],
            data: data,
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
  private onHandleEnterPress(enterFunction: () => any, e: KeyboardEvent) {
    // Prevent the dialog from receiving the enter keycode which will close it
    // and instead call the given function.
    if (e.code === KeyCodes.ENTER) {
      e.preventDefault()
      enterFunction()
      return true
    }
  }

  /**
   * @return The HTML content for the base pane
   */
  private static htmlContent(): string {
    return (
      '<div class="searchControls">' +
      '<div class="searchInput"></div>' +
      '<button type="button" class="btn btn-primary searchButton">Search</button>' +
      '</div>' +
      '<div class="searchStats">&nbsp;</div>' +
      '<div class="searchResults"></div>'
    )
  }
}

type CharacterSearchResult = {
  characterId: string;
}
