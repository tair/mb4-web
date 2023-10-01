import { MatrixModel } from '../MatrixModel'
import * as CellHighlightModeChangeEvents from '../events/CellHighlightModeChangeEvent'
import * as CellViewModeChangeEvents from '../events/CellViewModeChangeEvent'
import * as LastViewStatePreferenceChangedEvent from '../events/LastViewStatePreferenceChangedEvent'
import { Component, EventType } from './Component'
import { Dropdown } from './Dropdown'
import { MatrixGrid } from './MatrixGrid'
import { MatrixGridHandler } from './MatrixGridHandler'
import { StreamingMatrixGrid } from './StreamingMatrixGrid'
import { SearchDialog } from './dialogs/SearchDialog'
import { GoToDialog } from './dialogs/GoToDialog'
import {
  CellStateNumberImageRenderer,
  CellStateNameImageRenderer,
  CellStateNameNumberRenderer,
  CellStateNameRenderer,
  CellStateNumberRenderer,
} from './CellRenderer'
import {
  CharacterNumberRenderer,
  CharacterNameNumberRenderer,
} from './CharacterRenderer'
import { TaxaNameRenderer, TaxaNameImageRenderer } from './TaxaRenderer'

/**
 * The UI of the matrix editor, which includes anything that is visible to the user.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param gridHanlder the hander that operates on the matrix
 */
export abstract class MatrixAccessorContainer extends Component {
  /**
   * List of available highlight mode options
   */
  protected static HIGHLIGHT_MODE_OPTIONS: { [key: string]: number } = {
    'no highlight': 0,
    'highlight recent changes': 1,
    'highlight past day changes': 2,
    'highlight past week changes': 3,
    'highlight unscored': 4,
    'hightlight inapplicable': 5,
    'highlight NPA': 6,
    'highlight uncertain': 7,
    'highlight new': 8,
    'highlight in-progress': 9,
    'highlight completed': 10,
    'highlight images': 11,
    'highlight labels': 12,
    'highlight comments': 13,
    'highlight new comments': 14,
    'highlight citations': 15,
    'highlight with colors': 16,
    'highlight notes': 17,
  }

  /**
   * List of available cell mode options
   */
  protected static CELL_MODE_OPTIONS: { [key: string]: number } = {
    'Show numbers': 0,
    'Show names': 1,
    'Show names + numbers': 2,
    'Show numbers + images': 3,
    'Show names + images': 4,
    "Bird's eye view": 5,
  }

  /**
   * CSS class names of various matrix editor components
   */
  private static CSS_CLASSES = {
    HIGHLIGHT_MODE: 'highlightMode',
    CELL_MODE: 'cellMode',
  }

  /**
   * Rule checker button tooltip text
   */
  private static ONTOLOGY_TOOLTIP =
    'This button allows you to define rules relating one character to ' +
    'another (see MorphoBank manual for simple description). It is useful for characters that become ' +
    'inapplicable when one character is scored absent. Use of rules can help you catch human error in scoring.'

  protected highlightComboBox: Dropdown
  protected cellRenderersComboBox: Dropdown

  /**
   * Depending on the possible number of grid cells, we'll choose the appropriate matrix grid loading strategy.
   */
  protected matrixGrid: MatrixGrid

  constructor(
    protected matrixModel: MatrixModel,
    gridHanlder: MatrixGridHandler
  ) {
    super()
    this.highlightComboBox = new Dropdown()
    this.registerDisposable(this.highlightComboBox)
    this.cellRenderersComboBox = new Dropdown()
    this.registerDisposable(this.cellRenderersComboBox)
    this.matrixGrid = this.matrixModel.isStreaming()
      ? new StreamingMatrixGrid(matrixModel, gridHanlder)
      : new MatrixGrid(matrixModel, gridHanlder)
  }

  protected override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = this.htmlContent()
    this.decorateInternal(element)
  }

  protected override decorateInternal(element: HTMLElement) {
    super.decorateInternal(element)

    const ontologyButtonElement =
      this.getElementByClass<HTMLDivElement>('mb-rules-btn')
    ontologyButtonElement.title = MatrixAccessorContainer.ONTOLOGY_TOOLTIP
    for (const text in MatrixAccessorContainer.HIGHLIGHT_MODE_OPTIONS) {
      const value = MatrixAccessorContainer.HIGHLIGHT_MODE_OPTIONS[text]
      this.highlightComboBox.addItem({ text: text, value: value })
    }
    for (const text in MatrixAccessorContainer.CELL_MODE_OPTIONS) {
      const value = MatrixAccessorContainer.CELL_MODE_OPTIONS[text]
      this.cellRenderersComboBox.addItem({ text: text, value: value })
    }
    this.cellRenderersComboBox.setSelectedIndex(4)
    const dropdownElement = this.getElementByClass('mb-dropdown-bar')
    this.highlightComboBox.render(dropdownElement)
    this.cellRenderersComboBox.render(dropdownElement)
    const matridGridElement = this.getElementByClass('mb-matrix-grid')
    this.matrixGrid.render(matridGridElement)
  }

  protected override enterDocument() {
    super.enterDocument()
    const charactersButtonElement = this.getElementByClass('mb-characters-btn')
    const ontologyButtonElement = this.getElementByClass('mb-rules-btn')
    const searchButtonElement = this.getElementByClass('mb-search-btn')
    const goToButtonElement = this.getElementByClass('mb-goto-btn')
    const preferencesButtonElement =
      this.getElementByClass('mb-preferences-btn')
    const reloadButtonElement = this.getElementByClass('mb-reload-btn')
    this.getHandler()
      .listen(this.highlightComboBox, [EventType.CHANGE], (e) =>
        this.handleHighlightModeChange(e)
      )
      .listen(this.cellRenderersComboBox, [EventType.CHANGE], (e: Event) =>
        this.handleCellModeChange(e)
      )
      .listen(charactersButtonElement, EventType.CLICK, () =>
        this.handleCharactersClick()
      )
      .listen(ontologyButtonElement, EventType.CLICK, () =>
        this.handleOntologyClick()
      )
      .listen(searchButtonElement, EventType.CLICK, () =>
        this.handleSearchClick()
      )
      .listen(goToButtonElement, EventType.CLICK, () => this.handleGoToClick())
      .listen(preferencesButtonElement, EventType.CLICK, () =>
        this.handlePreferencesClick()
      )
      .listen(reloadButtonElement, EventType.CLICK, () =>
        this.handleReloadClick()
      )
      .listen(this, LastViewStatePreferenceChangedEvent.TYPE, (e: Event) =>
        this.handleLastViewStatePreferenceChanged(e)
      )
  }

  /**
   * Redraw matrix container.
   */
  redraw() {
    this.matrixGrid.redraw()
  }

  /**
   * Redraws the cells within the matrix grid.
   */
  refreshCells() {
    this.matrixGrid.refreshCells()
  }

  /**
   * Sets the cell mode input box.
   * @param cellModeIndex The index of the cell mode to set for this container.
   */
  changeCellMode(cellModeIndex: number) {
    this.cellRenderersComboBox.setSelectedIndex(cellModeIndex)
  }

  /**
   * Sets the cell mode input box.
   * @param highlightIndex The index of the cell mode to set for this container.
   */
  changeHighlightMode(highlightIndex: number) {
    this.highlightComboBox.setSelectedIndex(highlightIndex)
  }

  /**
   * Handles when the highlight mode has changed.
   *
   * @param e The event that triggerd this callback.
   * @return whether the handler handled this event.
   */
  protected handleHighlightModeChange(e: Event): boolean {
    const cellRender = this.matrixGrid.getCellRender()
    const highlightIndex = parseInt(
      this.highlightComboBox.getSelectedValue(),
      10
    )
    cellRender.setHighlightModeIndex(highlightIndex)
    this.matrixGrid.highlightLastClickedCell()
    this.matrixGrid.redrawCells()
    this.dispatchEvent(CellHighlightModeChangeEvents.create(highlightIndex))
    return true
  }

  /**
   * Handles when the code mode has changed.
   *
   * @param e The event that triggered this callback.
   * @return whether the handler handled this event.
   */
  protected handleCellModeChange(e: Event): boolean {
    let cellRender, characterRender, taxaRender
    const value = parseInt(this.cellRenderersComboBox.getSelectedValue(), 10)
    switch (value) {
      case 0:
        cellRender = new CellStateNumberRenderer()
        characterRender = new CharacterNameNumberRenderer()
        taxaRender = new TaxaNameRenderer()
        break
      case 1:
        cellRender = new CellStateNameRenderer()
        characterRender = new CharacterNameNumberRenderer()
        taxaRender = new TaxaNameRenderer()
        break
      case 2:
        cellRender = new CellStateNameNumberRenderer()
        characterRender = new CharacterNameNumberRenderer()
        taxaRender = new TaxaNameRenderer()
        break
      case 3:
        cellRender = new CellStateNumberImageRenderer()
        characterRender = new CharacterNameNumberRenderer()
        taxaRender = new TaxaNameImageRenderer()
        break
      case 4:
        cellRender = new CellStateNameImageRenderer()
        characterRender = new CharacterNameNumberRenderer()
        taxaRender = new TaxaNameImageRenderer()
        break
      case 5:
        cellRender = new CellStateNumberRenderer()
        characterRender = new CharacterNumberRenderer()
        taxaRender = new TaxaNameRenderer()
        break
      default:
        cellRender = new CellStateNumberRenderer()
        characterRender = new CharacterNameNumberRenderer()
        taxaRender = new TaxaNameRenderer()
        break
    }
    this.matrixGrid.setCharacterRender(characterRender)
    this.matrixGrid.setTaxaRender(taxaRender)
    this.matrixGrid.setCellRender(cellRender)
    this.dispatchEvent(CellViewModeChangeEvents.create(value))
    return true
  }

  /**
   * Handles when the last view state preference was changed.
   *
   * @param e The event that triggered this callback.
   * @return whether the handler handled this event.
   */
  protected handleLastViewStatePreferenceChanged(e: Event): boolean {
    const cellModeIndex = parseInt(
      this.cellRenderersComboBox.getSelectedValue(),
      10
    )
    this.dispatchEvent(CellViewModeChangeEvents.create(cellModeIndex))
    const highlightIndex = parseInt(
      this.highlightComboBox.getSelectedValue(),
      10
    )
    this.dispatchEvent(CellHighlightModeChangeEvents.create(highlightIndex))
    this.matrixGrid.dispatchEvent(e)
    return true
  }

  /**
   * Handles when the characters button is clicked.
   *
   * @return whether the handler handled this event.
   */
  protected abstract handleCharactersClick(): boolean

  /**
   * Handles when the preferences button is clicked.
   *
   * @return whether the handler handled this event.
   */
  protected abstract handlePreferencesClick(): boolean

  /**
   * Handles when the ontology button is clicked.
   *
   * @return whether the handler handled this event.
   */
  protected abstract handleOntologyClick(): boolean

  /**
   * Handles when the search button is clicked.
   *
   * @return whether the handler handled this event.
   */
  protected handleSearchClick(): boolean {
    const searchDialog = new SearchDialog(this.matrixModel)
    searchDialog.setVisible(true)
    return true
  }

  /**
   * Handles when the go to button is clicked.
   *
   * @return whether the handler handled this event.
   */
  protected handleGoToClick(): boolean {
    const goToDialog = new GoToDialog(this.matrixModel)
    goToDialog.setVisible(true)
    return true
  }

  /**
   * Handles when the reload button is clicked.
   *
   * @return whether the handler handled this event.
   */
  protected handleReloadClick(): boolean {
    location.reload()
    return true
  }

  /**
   * The HTML for this component.
   * @abstract
   */
  protected abstract htmlContent(): string
}
