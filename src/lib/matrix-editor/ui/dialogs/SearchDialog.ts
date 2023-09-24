import { SavingLabel } from '../SavingLabel'
import { CellsChangedEvent } from '../../events/CellsChangedEvent'
import { MatrixModel } from '../../MatrixModel'
import { DataGridTable, DataRow } from '../DataGridTable'
import { Dialog } from '../Dialog'
import { Dropdown } from '../Dropdown'
import { TabNavigator } from '../TabNavigator'
import { Component, EventType, KeyCodes } from '../Component'
import { ModalDefaultButtons } from '../Modal'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import * as PartitionChangedEvents from '../../events/PartitionChangedEvent'
import * as PartitionRefreshedEvents from '../../events/PartitionRefreshedEvent'
import * as TaxaAddedEvents from '../../events/TaxaAddedEvent'
import * as TaxaChangedEvents from '../../events/TaxaChangedEvent'
import * as TaxaRemovedEvents from '../../events/TaxaRemovedEvent'
import * as CellsChangedEvents from '../../events/CellsChangedEvent'
import * as GoToCellEvents from '../../events/GoToCellEvent'

/**
 * Search dialog.
 *
 * @param matrixModel the data associated with the matrix.
 */
export class SearchDialog extends Dialog {
  private readonly matrixModel: MatrixModel
  private tabNavigator: TabNavigator
  private onlyShowCharacterTab: boolean

  constructor(matrixModel: MatrixModel) {
    super()

    this.matrixModel = matrixModel

    this.tabNavigator = new TabNavigator()
    this.registerDisposable(this.tabNavigator)

    this.onlyShowCharacterTab = false

    this.setTitle('Search')
    this.setHasBackdrop(false)
    this.addButton(ModalDefaultButtons.DONE)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('searchDialog')
    const contentElement = this.getContentElement()
    this.tabNavigator.addTab(
      'Characters',
      new CharacterPane(this.matrixModel, this, this.savingLabel)
    )
    if (!this.onlyShowCharacterTab) {
      this.tabNavigator.addTab(
        'Taxa',
        new TaxaPane(this.matrixModel, this, this.savingLabel)
      )
      this.tabNavigator.addTab(
        'Cells',
        new CellPane(this.matrixModel, this, this.savingLabel)
      )
    }
    this.tabNavigator.render(contentElement)
    this.savingLabel.setText('Searching...')
  }

  /**
   * Only display the character tab.
   */
  setOnlyShowCharacterTab() {
    this.onlyShowCharacterTab = true
  }
}

/**
 * Abstract search pane
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog The dialog used in this pane.
 * @param savingLabel the saving label associated with this dialog
 */
abstract class SearchPane extends Component {
  protected readonly matrixModel: MatrixModel
  protected readonly dialog: Dialog
  protected readonly savingLabel: SavingLabel

  protected gridTable: DataGridTable

  protected constructor(
    matrixModel: MatrixModel,
    dialog: Dialog,
    savingLabel: SavingLabel
  ) {
    super()

    this.matrixModel = matrixModel
    this.dialog = dialog
    this.savingLabel = savingLabel

    this.gridTable = new DataGridTable()
    this.registerDisposable(this.gridTable)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = SearchPane.htmlContent()
    element.classList.add('mb-search-pane')
    const searchResultsElement = this.getElementByClass('searchResults')
    this.gridTable.render(searchResultsElement)
  }

  override enterDocument() {
    super.enterDocument()
    const searchChangeEvents = [
      CharacterChangedEvents.TYPE,
      PartitionChangedEvents.TYPE,
      PartitionRefreshedEvents.TYPE,
      TaxaAddedEvents.TYPE,
      TaxaChangedEvents.TYPE,
      TaxaRemovedEvents.TYPE,
    ]
    this.getHandler()
      .listen(this.gridTable, EventType.SELECT, (e: CustomEvent<any>) => this.handleGridClick(e))
      .listen(
        this.matrixModel,
        CellsChangedEvents.TYPE,
        (e: CustomEvent<CellsChangedEvent>) => this.handleCellChange(e)
      )
      .listen(
        this.matrixModel,
        searchChangeEvents,
        () => this.handleModelChange()
      )
  }

  /**
   * Handles events when character rules are removed.
   * @param e The event that triggerd this callback.
   */
  handleGridClick(e: CustomEvent) {
    const taxonId = parseInt(e.detail['taxonId'], 10)
    const characterId = parseInt(e.detail['characterId'], 10)
    const row = taxonId > 0 ? this.matrixModel.getTaxonIndexById(taxonId) : -1
    const column =
      characterId > 0 ? this.matrixModel.getCharacterIndexById(characterId) : -1
    const shouldHighlight = taxonId > 0 && characterId > 0
    window.dispatchEvent(GoToCellEvents.create(row, column, shouldHighlight))
  }

  /**
   * Handles the select search change event.
   */
  protected handleSearchChange() {
    this.gridTable.clearRows()
    this.gridTable.redraw()
    const searchStates = this.getElementByClass('searchStats')
    searchStates.innerHTML = '&nbsp;'
  }

  /**
   * Handles when the cell changes. This will update the searches so that the grid
   * is always up to date.
   * @param e The event that triggerd this callback.
   */
  protected handleCellChange(e: CustomEvent<CellsChangedEvent>) {
    // This ensures that systemic changes (e.g. fetching cell data and syncing
    // the matrix) does not cause the results to be redrawn.
    if (!e.detail.isSystemChange) {
      this.handleModelChange()
    }
  }

  /**
   * Handles when the matrix model updates. This will update the searches so that
   * the grid is always up to date.
   * @return Whether to handle the model change.
   */
  protected handleModelChange(): boolean {
    // Since the dialog is not visible, we do not want to invoke a search since it
    // may result in a request to the server or several ms of JavaScript execution.
    if (!this.dialog.isVisible()) {
      this.dialog.dispose()
      return false
    }

    // If there were previous search results, we want to perform them again so that
    // it is up to date.
    const searchStates = this.getElementByClass('searchStats')
    if (searchStates.textContent) {
      this.handleSearchClick()
    }
    return true
  }

  /**
   * Handles the search button click event.
   */
  protected abstract handleSearchClick(): void

  /**
   * Handlers events when for user key down events.
   *
   * @param enterFunction the function to call when enter is pressed
   * @param e The event that triggerd this callback.
   */
  protected handleEnterPress(enterFunction: () => any, e: KeyboardEvent) {
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
      '<button type="button" class="btn searchButton">Search</button>' +
      '</div>' +
      '<div class="searchStats">&nbsp;</div>' +
      '<div class="searchResults"></div>'
    )
  }
}

/**
 * Character search pane
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog The dialog used in this pane.
 * @param savingLabel the saving label associated with this dialog
 */
class CharacterPane extends SearchPane {
  /**
   * List of available character search options
   */
  private static CHARACTER_SEARCH_OPTIONS: string[] = [
    'with text',
    'with unread comments',
    'with warnings',
    'that have unscored cells',
    'that have NPA cells',
    'illustrated by media not also in use in cells',
  ]
  private characterSearchSelect: Dropdown

  constructor(
    matrixModel: MatrixModel,
    dialog: Dialog,
    savingLabel: SavingLabel
  ) {
    super(matrixModel, dialog, savingLabel)
    this.characterSearchSelect = new Dropdown()
    this.registerDisposable(this.characterSearchSelect)
  }

  override createDom() {
    super.createDom()

    const searchOptions = CharacterPane.CHARACTER_SEARCH_OPTIONS
    for (let x = 0; x < searchOptions.length; x++) {
      const searchOption = searchOptions[x]
      this.characterSearchSelect.addItem({
        text: searchOption,
        value: searchOption,
      })
    }
    const searchElement = this.getElementByClass('search-input')
    this.characterSearchSelect.render(searchElement)
    const inputElement = document.createElement('input')
    searchElement.appendChild(inputElement)
    this.characterSearchSelect.setSelectedIndex(0)
  }

  override enterDocument() {
    super.enterDocument()

    const searchButtonElement = this.getElementByClass('searchButton')
    const searchElement = this.getElementByClass('search-input')
    const searchInputElement = searchElement.querySelector(
      'input'
    ) as HTMLInputElement
    this.getHandler()
      .listen(searchInputElement, EventType.KEYDOWN, (e) =>
        this.handleEnterPress(() => this.handleSearchClick(), e)
      )
      .listen(
        this.characterSearchSelect,
        EventType.CHANGE,
        () => this.handleSearchChange()
      )
      .listen(
        searchButtonElement,
        EventType.CLICK,
        () => this.handleSearchClick()
      )
  }

  override handleSearchChange() {
    super.handleSearchChange()
    const searchSelectedOption = this.characterSearchSelect.getSelectedValue()
    const searchElement = this.getElementByClass('search-input')
    const searchInputElement = searchElement.querySelector('input')
    if (searchInputElement) {
      searchInputElement.disabled = searchSelectedOption !== 'with text'
      searchInputElement.value = ''
    }
  }

  override handleSearchClick() {
    let searchOptions
    switch (this.characterSearchSelect.getSelectedValue()) {
      case 'with text':
        const searchElement = this.getElementByClass('search-input')
        const searchInputElement = searchElement.querySelector('input')
        searchOptions = { text: searchInputElement!.value }
        break
      case 'with unread comments':
        searchOptions = { limitToUnreadComments: true }
        break
      case 'with warnings':
        searchOptions = { limitWithWarnings: true }
        break
      case 'that have unscored cells':
        searchOptions = { limitToUnscoredCells: true }
        break
      case 'that have NPA cells':
        searchOptions = { limitToNPACells: true }
        break
      case 'illustrated by media not also in use in cells':
        searchOptions = { limitToUnusedMedia: true }
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
          } as DataRow
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
}

/**
 * Taxa search pane
 *
 * @param matrixModel the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 * @param dialog The dialog used in this pane.
 */
class TaxaPane extends SearchPane {
  /**
   * List of available taxa search options
   */
  private static TAXA_SEARCH_OPTIONS: string[] = [
    'with text',
    'that have unscored cells',
    'that have NPA cells',
  ]
  private taxaSearchSelect: Dropdown

  constructor(
    matrixModel: MatrixModel,
    dialog: Dialog,
    savingLabel: SavingLabel
  ) {
    super(matrixModel, dialog, savingLabel)
    this.taxaSearchSelect = new Dropdown()
    this.registerDisposable(this.taxaSearchSelect)
  }

  override createDom() {
    super.createDom()
    const searchOptions = TaxaPane.TAXA_SEARCH_OPTIONS
    for (let x = 0; x < searchOptions.length; x++) {
      const searchOption = searchOptions[x]
      this.taxaSearchSelect.addItem({ text: searchOption, value: searchOption })
    }
    const searchElement = this.getElementByClass('search-input')
    this.taxaSearchSelect.render(searchElement)
    const inputElement = document.createElement('input')
    searchElement.appendChild(inputElement)
    this.taxaSearchSelect.setSelectedIndex(0)
  }

  override enterDocument() {
    super.enterDocument()
    const searchButtonElement = this.getElementByClass('searchButton')
    const searchElement = this.getElementByClass('search-input')
    const searchInputElement = searchElement.querySelector(
      'input'
    ) as HTMLInputElement
    this.getHandler()
      .listen(searchInputElement, EventType.KEYDOWN, (e) =>
        this.handleEnterPress(() => this.handleSearchClick(), e)
      )
      .listen(
        this.taxaSearchSelect,
        EventType.CHANGE,
        () => this.handleSearchChange()
      )
      .listen(
        searchButtonElement,
        EventType.CLICK,
        () => this.handleSearchClick()
      )
  }

  override handleSearchChange() {
    super.handleSearchChange()
    const searchSelectedOption = this.taxaSearchSelect.getSelectedValue()
    const searchElement = this.getElementByClass('search-input')
    const searchInputElement = searchElement.querySelector('input')
    searchInputElement!.disabled = searchSelectedOption !== 'with text'
    searchInputElement!.value = ''
  }

  override handleSearchClick() {
    let searchOptions
    switch (this.taxaSearchSelect.getSelectedValue()) {
      case 'with text':
        const searchElement = this.getElementByClass('search-input')
        const searchInputElement = searchElement.querySelector('input')
        searchOptions = { text: searchInputElement!.value }
        break
      case 'that have unscored cells':
        searchOptions = { limitToUnscoredCells: true }
        break
      case 'that have NPA cells':
        searchOptions = { limitToNPACells: true }
        break
      default:
        searchOptions = {}
    }
    this.savingLabel.saving()
    this.matrixModel
      .searchTaxa(searchOptions)
      .then((results) => {
        const rows: DataRow[] = []
        for (let x = 0; x < results.length; x++) {
          const result = results[x]
          const row = {
            labels: [result.label],
            data: { taxonId: result.id },
          } as DataRow
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
}

/**
 * Cell search pane
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog The dialog used in this pane.
 * @param savingLabel the saving label associated with this dialog
 */

class CellPane extends SearchPane {
  /**
   * List of available cell search options
   */
  private static CELL_SEARCH_OPTIONS: string[] = [
    'unscored for',
    'NPA for',
    'Polymorphic for',
    'unscored for all taxa',
    'NPA for all taxa',
    'Polymorphic for all taxa',
    'without media',
    'without media, notes or citations',
    'scored but without media, notes or citations',
  ]
  private searchSelect: Dropdown
  private taxaSelect: Dropdown

  constructor(
    matrixModel: MatrixModel,
    dialog: Dialog,
    savingLabel: SavingLabel
  ) {
    super(matrixModel, dialog, savingLabel)
    this.searchSelect = new Dropdown()
    this.registerDisposable(this.searchSelect)
    this.taxaSelect = new Dropdown()
    this.registerDisposable(this.taxaSelect)
  }

  override createDom() {
    super.createDom()
    const searchOptions = CellPane.CELL_SEARCH_OPTIONS
    for (let x = 0; x < searchOptions.length; x++) {
      const searchOption = searchOptions[x]
      this.searchSelect.addItem({ text: searchOption, value: searchOption })
    }

    const inputElement = this.getElementByClass('search-input')
    this.searchSelect.render(inputElement)
    this.searchSelect.setSelectedIndex(0)
    this.taxaSelect.render(inputElement)
    this.redrawTaxaSelect()
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    const searchButtonElement = this.getElementByClass('searchButton')
    handler.listen(
      this.taxaSelect,
      EventType.CHANGE,
      () => this.handleSearchChange()
    )
    handler.listen(
      this.searchSelect,
      EventType.CHANGE,
      () => this.handleSearchChange()
    )
    handler.listen(
      searchButtonElement,
      EventType.CLICK,
      () => this.handleSearchClick()
    )
  }

  override handleSearchChange() {
    super.handleSearchChange()
    const searchSelectedOption = this.searchSelect.getSelectedValue()
    const shouldDisable =
      searchSelectedOption === 'unscored for all taxa' ||
      searchSelectedOption === 'NPA for all taxa' ||
      searchSelectedOption === 'Polymorphic for all taxa'
    this.taxaSelect.setEnabled(!shouldDisable)
  }

  override handleModelChange(): boolean {
    if (super.handleModelChange()) {
      this.redrawTaxaSelect()
    }
    return true
  }

  /**
   * Redraws the taxa combo when new taxa are available.
   */
  private redrawTaxaSelect() {
    const selectedTaxonId = parseInt(this.taxaSelect.getSelectedValue(), 10)

    // Remove previous menu items.
    this.taxaSelect.removeAllItems()
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const taxa = this.matrixModel.getPartitionTaxa()
    let selectedIndex = 0
    for (let x = 0; x < taxa.length; x++) {
      const taxon = taxa[x]
      const taxonName =
        '[' + (taxon.getNumber() - numberingMode) + '] ' + taxon.getName()
      const taxonId = taxon.getId()
      this.taxaSelect.addItem({ text: taxonName, value: taxonId })
      if (selectedTaxonId === taxonId) {
        selectedIndex = x
      }
    }
    this.taxaSelect.setSelectedIndex(selectedIndex)
    this.taxaSelect.redraw()
  }

  override handleSearchClick() {
    const selectedTaxonId = parseInt(this.taxaSelect.getSelectedValue(), 10)
    let searchOptions
    switch (this.searchSelect.getSelectedValue()) {
      case 'unscored for':
        searchOptions = {
          limitToTaxon: selectedTaxonId,
          limitToUnscoredCells: true,
        }
        break
      case 'NPA for':
        searchOptions = { limitToTaxon: selectedTaxonId, limitToNPACells: true }
        break
      case 'Polymorphic for':
        searchOptions = {
          limitToTaxon: selectedTaxonId,
          limitToPolymorphicCells: true,
        }
        break
      case 'unscored for all taxa':
        searchOptions = { limitToUnscoredCells: true }
        break
      case 'NPA for all taxa':
        searchOptions = { limitToNPACells: true }
        break
      case 'Polymorphic for all taxa':
        searchOptions = { limitToPolymorphicCells: true }
        break
      case 'scored but without media, notes or citations':
        searchOptions = {
          limitToTaxon: selectedTaxonId,
          limitToUnimagedCells: true,
          limitToUndocumentedCells: true,
          limitToScoredCells: true,
        }
        break
      case 'without media, notes or citations':
        searchOptions = {
          limitToTaxon: selectedTaxonId,
          limitToUnimagedCells: true,
          limitToUndocumentedCells: true,
        }
        break
      case 'without media':
        searchOptions = {
          limitToTaxon: selectedTaxonId,
          limitToUnimagedCells: true,
        }
        break
      default:
        searchOptions = {}
        break
    }
    this.savingLabel.saving()
    this.matrixModel
      .searchCells(searchOptions)
      .then((results) => {
        const rows: DataRow[] = []
        for (let x = 0; x < results.length; x++) {
          const result = results[x]
          const row = {
            labels: [result.label],
            data: { taxonId: result.otherId, characterId: result.id },
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
}
