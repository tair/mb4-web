import { CellRenderer, CellStateNameImageRenderer } from './CellRenderer'
import { MatrixGridHandler } from './MatrixGridHandler'
import * as mb from '../mb'
import { MatrixModel } from '../MatrixModel'
import { CellsChangedEvent } from '../events/CellsChangedEvent'
import * as CellsChangedEvents from '../events/CellsChangedEvent'
import * as CellEditEvents from '../events/CellEditEvent'
import { CellsHighlightEvent } from '../events/CellsHighlightEvent'
import * as CellsHighlightEvents from '../events/CellsHighlightEvent'
import * as CellsRefreshedEvent from '../events/CellsRefreshedEvent'
import * as CharacterChangedEvents from '../events/CharacterChangedEvent'
import * as CharacterRefreshedEvents from '../events/CharacterRefreshedEvent'
import * as CharacterRulesAddedEvents from '../events/CharacterRulesAddedEvent'
import * as CharacterRulesRemovedEvents from '../events/CharacterRulesRemovedEvent'
import * as GridPositionChangedEvents from '../events/GridPositionChangedEvent'
import { GoToCellEvent } from '../events/GoToCellEvent'
import * as GoToCellEvents from '../events/GoToCellEvent'
import * as LastViewStatePreferenceChangedEvent from '../events/LastViewStatePreferenceChangedEvent'
import * as TaxaChangedEvents from '../events/TaxaChangedEvent'
import * as TaxaAddedEvents from '../events/TaxaAddedEvent'
import * as TaxaRefreshedEvent from '../events/TaxaRefreshedEvent'
import * as TaxaRemovedEvents from '../events/TaxaRemovedEvent'
import * as PartitionChangedEvents from '../events/PartitionChangedEvent'
import * as PartitionRefreshedEvents from '../events/PartitionRefreshedEvent'
import { CellTooltip } from './CellTooltip'
import { CharacterTooltipManager } from './CharacterTooltipManager'
import { CharacterRenderer } from './CharacterRenderer'
import { CharacterNameNumberRenderer } from './CharacterRenderer'
import {
  Component,
  EventType,
  KeyCodes,
  MobileFriendlyClickEventType,
} from './Component'
import { MatrixGridContent } from './CellsContent'
import { MessageBar } from './MessageBar'
import { Scrollbar, Orientation } from './Scrollbar'
import { TaxaRenderer } from './TaxaRenderer'
import { TaxaNameImageRenderer } from './TaxaRenderer'

/**
 * The grid of the matrix which includes anything that is visible to the user.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param gridHandler The handler to certain matrix operations
 */
export class MatrixGrid extends Component {
  /**
   * Row spacing between each cells.
   */
  private static readonly ROW_SPACING: number = 2

  /**
   * Columning spacing between each cells.
   */
  private static readonly COLUMN_SPACING: number = 2

  protected cellRenderer: CellRenderer
  protected taxaRenderer: TaxaRenderer
  protected characterRenderer: CharacterRenderer
  protected horizontalScrollBar: Scrollbar
  protected verticalScrollBar: Scrollbar
  protected currentCellTooltip: CellTooltip
  protected characterTooltipManager: CharacterTooltipManager
  protected windowDimensionHeight: number
  protected windowDimensionWidth: number
  protected lastClickedCell: HTMLElement | null = null
  protected columnWidth: number = 20
  protected columnHeight: number = 0
  protected rowHeight: number = 32
  protected rowWidth: number = 0
  protected currentRow: number = 0
  protected currentColumn: number = 0
  protected remainingColumnSize: number = 0
  protected remainingRowSize: number = 0
  protected columnSize: number = 20
  protected rowSize: number = 20
  protected columnSpacing: number = 191

  /**
   * The height from the top of the page to where the cell grid should begin.
   */
  protected headerHeight: number = 0
  protected scrollbarWidth: number | null = null

  /**
   * A list of highlighted cells. This is currently used for collaboration when there are other
   * users who are editing cells in the matrix.
   */
  protected highlightedCells: Element[] = []

  constructor(
    protected matrixModel: MatrixModel,
    protected gridHandler: MatrixGridHandler
  ) {
    super()
    this.cellRenderer = new CellStateNameImageRenderer()

    this.taxaRenderer = new TaxaNameImageRenderer()

    this.taxaRenderer.setTaxaPreferences(
      this.matrixModel.getProjectProperties()
    )

    this.taxaRenderer.setReadonly(this.matrixModel.isReadonly())

    this.characterRenderer = new CharacterNameNumberRenderer()
    this.characterRenderer.setCharacterRules(
      this.matrixModel.getCharacterRules()
    )
    this.characterRenderer.setCharacterPreferences(
      this.matrixModel.getUserPreferences()
    )
    this.characterRenderer.setShouldDisplayWarnings(
      this.matrixModel.hasAccessToAtleastOneTaxon()
    )

    this.horizontalScrollBar = new Scrollbar()
    this.horizontalScrollBar.setOrientation(Orientation.HORIZONTAL)
    this.registerDisposable(this.horizontalScrollBar)

    this.verticalScrollBar = new Scrollbar()
    this.verticalScrollBar.setOrientation(Orientation.VERTICAL)
    this.registerDisposable(this.verticalScrollBar)

    this.currentCellTooltip = new CellTooltip(matrixModel)

    this.characterTooltipManager = new CharacterTooltipManager(matrixModel)

    this.windowDimensionHeight = document.documentElement.clientHeight

    this.windowDimensionWidth = document.documentElement.clientWidth
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = MatrixGridContent()
    this.horizontalScrollBar.render(document.body)
    this.verticalScrollBar.render(document.body)
  }

  override enterDocument() {
    super.enterDocument()
    const gridTable = this.getElementByClass('matrixgridTable')
    const tableBody = this.getElementByClass('matrixgridBody')
    const gridCells = this.getElementByClass('gridCells')
    const gridTaxa = this.getElementByClass('gridTaxa')
    const gridCharacter = this.getElementByClass('gridCharacters')
    const handler = this.getHandler()
    handler
      .listen(window, EventType.RESIZE, () => this.onHandleResize())
      .listen(this, GoToCellEvents.TYPE, (e: CustomEvent<GoToCellEvent>) =>
        this.goCellIndex(e)
      )
      .listen(window, GoToCellEvents.TYPE, (e: CustomEvent<GoToCellEvent>) =>
        this.goCellIndex(e)
      )
      .listen(
        window,
        CellsHighlightEvents.TYPE,
        (e: CustomEvent<CellsHighlightEvent>) => this.onHandleCellsHighlight(e)
      )
      .listen(this.matrixModel, CellsRefreshedEvent.TYPE, () => this.redraw())
      .listen(
        this.matrixModel,
        CellsChangedEvents.TYPE,
        (e: CustomEvent<CellsChangedEvent>) => this.onCellsChanged(e)
      )
      .listen(
        this.matrixModel,
        [
          CharacterRulesRemovedEvents.TYPE,
          CharacterRefreshedEvents.TYPE,
          CharacterRulesAddedEvents.TYPE,
          CharacterChangedEvents.TYPE,
        ],
        () => this.onCharacterChanged()
      )
      .listen(
        this.matrixModel,
        [
          TaxaAddedEvents.TYPE,
          TaxaRefreshedEvent.TYPE,
          TaxaRemovedEvents.TYPE,
          TaxaChangedEvents.TYPE,
        ],
        () => this.onTaxaChange()
      )
      .listen(
        this.matrixModel,
        [PartitionChangedEvents.TYPE, PartitionRefreshedEvents.TYPE],
        () => this.onPartitionChanged()
      )
      .listen(gridTable, EventType.SCROLL, () => this.onHandleTableScroll())
      .listen(tableBody, EventType.SCROLL, (e: Event) => this.onHandleScroll(e))
      .listen(tableBody, EventType.WHEEL, (e: WheelEvent) =>
        this.onHandleWheel(e)
      )
      .listen(gridCharacter, EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.onHandleKeyDown(e)
      )
      .listen(gridCharacter, MobileFriendlyClickEventType, (e: Event) =>
        this.onHandleCharacterDoubleClick(e)
      )
      .listen(gridTaxa, EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.onHandleKeyDown(e)
      )
      .listen(gridTaxa, EventType.MOUSEOVER, (e: Event) =>
        this.onHandleTaxaMouseOver(e)
      )
      .listen(gridTaxa, EventType.MOUSEOUT, (e: Event) =>
        this.onHandleTaxaMouseOut(e)
      )
      .listen(gridTaxa, MobileFriendlyClickEventType, (e: Event) =>
        this.onHandleTaxaDoubleClick(e)
      )
      .listen(gridCells, EventType.CLICK, (e: Event) =>
        this.onHandleCellsClick(e)
      )
      .listen(gridCells, EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.onHandleKeyDown(e)
      )
      .listen(gridCells, MobileFriendlyClickEventType, (e: Event) =>
        this.onHandleCellsDoubleclick(e)
      )
      .listen(gridCells, EventType.MOUSEOVER, (e: Event) =>
        this.onHandleCellsMouseOver(e)
      )
      .listen(gridCells, EventType.MOUSEOUT, (e: Event) =>
        this.onHandleCellsMouseOut(e)
      )
      .listen(this.horizontalScrollBar, EventType.CHANGE, () =>
        this.onHorizontalScrollbarChange()
      )
      .listen(this.verticalScrollBar, EventType.CHANGE, () =>
        this.onVerticalScrollbarChange()
      )
      .listen(this, LastViewStatePreferenceChangedEvent.TYPE, () =>
        this.onHandleLastViewStatePreferenceChanged()
      )
    if (!mb.isMobileOrTablet()) {
      handler
        .listen(gridCharacter, EventType.MOUSEOVER, (e: Event) =>
          this.onHandleCharacterMouseOver(e)
        )
        .listen(gridCharacter, EventType.MOUSEOUT, (e: Event) =>
          this.onHandleCharacterMouseLeave(e)
        )
    } else {
      handler.listen(document.body, EventType.TOUCHSTART, (e: TouchEvent) =>
        this.onHandleDoubleTap(e)
      )
    }

    // Install the label count updater.
    ;(window as any)['updateLabelCount'] = (linkId: number) =>
      this.matrixModel.getLabelCount(linkId)
  }

  /**
   * Set the render of the Matrix Grid
   * @param renderer Changes the render of the matrix grid.
   */
  setCellRender(renderer: CellRenderer) {
    const gridTable = document.getElementById('matrixgridTable')
    gridTable!.classList.remove(this.cellRenderer.getClass())

    //this.cellRenderer.dispose();
    this.cellRenderer = renderer
    this.redraw()

    // make that the same cell is highlighted
    this.highlightLastClickedCell()

    // retain the current column and row
    this.dispatchEvent(
      GoToCellEvents.create(this.currentRow, this.currentColumn)
    )
  }

  /**
   * @return The render of the matrix grid.
   */
  getCellRender(): CellRenderer {
    return this.cellRenderer
  }

  /**
   * @return The current character id that is highlighted by the user or at the most visible column.
   */
  getCurrentCharacterId(): number {
    if (this.lastClickedCell) {
      return parseInt(this.lastClickedCell.dataset['characterId'] as string, 10)
    }
    const characters = this.matrixModel.getPartitionCharacters()
    const character = characters[this.currentColumn]
    return character.getId()
  }

  /**
   * @return The current taxon id that is highlighted by the user or at the most visible row.
   */
  getCurrentTaxonId(): number {
    if (this.lastClickedCell) {
      return parseInt(this.lastClickedCell.dataset['taxonId'] as string, 10)
    }
    const taxa = this.matrixModel.getPartitionTaxa()

    // We shift here because we shift when we render the row cells so we do this to be in sync.
    const currentRow = (this.currentRow >> 1) << 1
    const taxonData = taxa[currentRow]
    return taxonData.getId()
  }

  /**
   * Set the render of the Matrix Grid
   * @param renderer Changes the render of the matrix grid.
   */
  setCharacterRender(renderer: CharacterRenderer) {
    // no need to render characters if it's the same renderer
    if (renderer.constructor === this.characterRenderer.constructor) {
      return
    }
    const gridTable = document.getElementById('matrixgridTable')
    const oldClass = this.characterRenderer.getClass()
    if (oldClass) {
      gridTable!.classList.remove(oldClass)
    }
    this.characterRenderer = renderer
    this.characterRenderer.setCharacterRules(
      this.matrixModel.getCharacterRules()
    )
    this.characterRenderer.setCharacterPreferences(
      this.matrixModel.getUserPreferences()
    )
    this.characterRenderer.setShouldDisplayWarnings(
      this.matrixModel.hasAccessToAtleastOneTaxon()
    )
    const newClass = this.characterRenderer.getClass()
    if (newClass) {
      gridTable!.classList.add(newClass)
    }
    this.redrawCharacters()
  }

  /**
   * Set the render of the Matrix Grid
   * @param renderer Changes the render of the matrix grid.
   */
  setTaxaRender(renderer: TaxaRenderer) {
    // no need to render taxa if it's the same renderer
    if (renderer.constructor === this.taxaRenderer.constructor) {
      return
    }

    //this.taxaRenderer.dispose();
    this.taxaRenderer = renderer
    this.taxaRenderer.setTaxaPreferences(
      this.matrixModel.getProjectProperties()
    )
    this.taxaRenderer.setReadonly(this.matrixModel.isReadonly())
  }

  /**
   * Redraw matrix grid by dispatching a resize, followed by a redraw
   */
  redraw() {
    this.redrawInternal()

    // Let's dispatch get the up to date sizes on resize
    this.resizeWindow()
  }

  /**
   * Does the actual redraw.
   */
  protected redrawInternal() {
    this.redrawCharacters()
    this.redrawTaxa()
    const gridTable = document.getElementById('matrixgridTable')
    gridTable!.classList.add(this.cellRenderer.getClass())

    // Insert scroll element if it doesn't exist
    const oldSpacer = this.getElementByClass('rightBottomSpacer')
    if (!oldSpacer) {
      const rightBottomSpacer = document.createElement('div')
      rightBottomSpacer.classList.add('rightBottomSpacer')
      rightBottomSpacer.textContent = '.'
      const tableBody = this.getElementByClass('matrixgridBody')
      tableBody.appendChild(rightBottomSpacer)
    }
  }

  /**
   * Refresh all of the cells
   */
  refreshCells() {
    this.cellRenderer.clearCache()
    this.redrawCells()
  }

  /**
   * Redraws the only the taxa headers in the matrix editor. Used whenever we want to redraw the taxa but
   * not the entire matrix grid.
   */
  redrawTaxa() {
    const gridFragment = document.createDocumentFragment()
    const taxa = this.matrixModel.getPartitionTaxa()
    for (let x = 0; x < taxa.length; x++) {
      const taxonData = taxa[x]
      gridFragment.appendChild(this.taxaRenderer.createTaxon(taxonData))
    }

    // fill the grid with empty taxa
    for (let x = 0; x < this.remainingRowSize; x++) {
      gridFragment.appendChild(this.taxaRenderer.createEmptyTaxon())
    }
    const gridTaxa = this.getElementByClass('gridTaxa')
    mb.removeChildren(gridTaxa)
    gridTaxa.appendChild(gridFragment)
  }

  /**
   * Redraws the only the character headers in the matrix editor. Used whenever we want to redraw the characters but
   * not the entire matrix grid.
   */
  redrawCharacters() {
    const characters = this.matrixModel.getPartitionCharacters()
    const characterSize = characters.length
    const newHeader = document.createElement('tr')
    for (let x = 0; x < characterSize; x++) {
      const characterData = characters[x]
      newHeader.appendChild(
        this.characterRenderer.createCharacter(characterData)
      )
    }

    // Add empty character headers
    for (let x = 0; x < this.remainingColumnSize; x++) {
      newHeader.appendChild(this.characterRenderer.createEmptyCharacter())
    }
    const gridCharacters = this.getElementByClass('gridCharacters')
    mb.removeChildren(gridCharacters)
    gridCharacters.appendChild(newHeader)
  }

  /**
   * Redraw the cells within the grid
   */
  redrawCells() {
    const characters = this.matrixModel.getPartitionCharacters()
    const taxa = this.matrixModel.getPartitionTaxa()
    const characterSize = characters.length
    const taxaSize = taxa.length

    // Ensure that the even rows are always first so that the colors alternate properly
    const currentRow = (this.currentRow >> 1) << 1

    // In the case that the row was shifted up to an even number, let's add the extra row to the size. This code will
    // add one if the currentRow was changed but add zero if the current row hasn't.
    const rowSize = this.rowSize + (this.currentRow - currentRow)

    // We use fragments to prevent the DOM from redrawing with each addition to a row.
    const gridFragment = document.createDocumentFragment()
    const getCell = (taxonId: number, characterId: number) =>
      this.matrixModel.getCell(taxonId, characterId)
    let row = currentRow
    let column = 0
    for (let x = 0; x < rowSize && row < taxaSize; x++, row++) {
      const taxonData = taxa[row]
      const taxonId = taxonData.getId()
      const gridRow = document.createElement('tr')
      gridRow.dataset['taxonId'] = String(taxonId)
      column = this.currentColumn
      for (
        let y = 0;
        y < this.columnSize && column < characterSize;
        y++, column++
      ) {
        const character = characters[column]
        const characterId = character.getId()
        gridRow.appendChild(
          this.cellRenderer.createCell(taxonId, characterId, getCell)
        )
      }

      // Fill the remaining columns spaces with empty rows.
      if (column === characterSize) {
        for (let y = 0; y < this.remainingColumnSize; y++) {
          gridRow.appendChild(this.cellRenderer.createEmptyCell())
        }
      }
      gridFragment.appendChild(gridRow)
    }

    // Fill the bottom row with empty cells when we're reached the end of the taxa. This ensures that all of scored taxa
    // is visible on the page.
    if (row === taxaSize) {
      // Calculate the number of columns to draw based on how many columns were previously drawn.
      const emptyRowSize =
        column === characterSize
          ? column - this.currentColumn + this.remainingColumnSize
          : this.columnSize
      for (let x = 0; x < this.remainingRowSize; x++) {
        const gridRow = document.createElement('tr')
        gridRow.classList.add('empty')
        for (let y = 0; y < emptyRowSize; y++) {
          gridRow.appendChild(this.cellRenderer.createEmptyCell())
        }
        gridFragment.appendChild(gridRow)
      }
    }

    // update the grid with the new table
    const gridCells = this.getElementByClass<HTMLElement>('gridCells')
    mb.removeChildren(gridCells)
    gridCells.appendChild(gridFragment)
    const extraHeight = currentRow === this.currentRow ? 0 : this.rowHeight
    const gridTop = this.headerHeight - MatrixGrid.ROW_SPACING - extraHeight
    mb.setElementStyle(gridCells, 'top', gridTop + 'px')
    const gridLeft = this.columnSpacing - MatrixGrid.COLUMN_SPACING
    mb.setElementStyle(gridCells, 'left', gridLeft + 'px')
    const gridCellsHeight =
      this.windowDimensionHeight -
      this.headerHeight -
      mb.getScrollbarWidth() -
      MatrixGrid.ROW_SPACING +
      extraHeight
    mb.setElementStyle(gridCells, 'height', gridCellsHeight + 'px')
  }

  /**
   * Resize the window based on the screen size.
   */
  protected resizeWindow() {
    const gridEmptyCorner = this.getElementByClass<HTMLElement>(
      'mb-grid-empty-header'
    )
    const gridCharacters = this.getElementByClass<HTMLElement>('gridCharacters')

    // Firefox uses the height with calculating the borderboxsize so unset the height to get the minimum possible value.
    mb.setElementStyle(gridCharacters, 'height', '')
    const gridCharacterBoxSize = gridCharacters.getBoundingClientRect()
    mb.setElementStyle(
      gridCharacters,
      'height',
      gridCharacterBoxSize.height + 'px'
    )
    mb.setElementStyle(
      gridEmptyCorner,
      'height',
      gridCharacterBoxSize.height + 'px'
    )
    const tableHeaderHeight =
      this.getElementByClass('matrixgridHeader').getBoundingClientRect().height
    const topButtonBarHeight = document
      .getElementsByClassName('topButtonBar')[0]
      .getBoundingClientRect().height
    const remainingHeight =
      this.windowDimensionHeight - tableHeaderHeight - topButtonBarHeight
    this.headerHeight = tableHeaderHeight + topButtonBarHeight
    const tableBody = this.getElementByClass<HTMLElement>('matrixgridBody')
    mb.setElementStyle(tableBody, 'height', remainingHeight + 'px')
    const tableTaxa = this.getElementByClass('matrixgridTaxa')
    const tableTaxaSize = tableTaxa.getBoundingClientRect()
    const gridCellsWidth =
      this.windowDimensionWidth - tableTaxaSize.width - mb.getScrollbarWidth()
    const fixedHeight = remainingHeight - mb.getScrollbarWidth()
    const gridCells = this.getElementByClass<HTMLElement>('gridCells')
    mb.setElementStyle(gridCells, 'width', gridCellsWidth + 'px')
    const gridTable = document.getElementById('matrixgridTable') as HTMLElement
    mb.setElementStyle(gridTable, 'width', this.windowDimensionWidth + 'px')
    const tableFixed = this.getElementByClass<HTMLElement>('matrixgridFixed')
    mb.setElementStyle(tableFixed, 'height', fixedHeight + 'px')
    const characterColumns = gridCharacters.getElementsByTagName('th')
    const currentColumnElement = characterColumns[this.currentColumn]
    if (currentColumnElement) {
      const realDimensions = currentColumnElement.getBoundingClientRect()
      this.columnWidth = realDimensions.width
      this.columnHeight = realDimensions.height
    }
    const gridTaxa = this.getElementByClass('gridTaxa')
    const taxaRows = gridTaxa.getElementsByTagName('tr')
    const currentRowElement = taxaRows[this.currentRow]
    if (currentRowElement) {
      const realDimensions = currentRowElement.getBoundingClientRect()
      this.rowHeight = realDimensions.height
      this.rowWidth = realDimensions.width
    }
    const gridEmptyCornerWidth = gridEmptyCorner.getBoundingClientRect().width
    const fillSize = Math.ceil(
      (this.windowDimensionWidth - gridEmptyCornerWidth) / this.columnWidth
    )
    const characters = this.matrixModel.getPartitionCharacters()
    const characterSize = characters.length
    const remainingColumnSize = fillSize - characterSize
    const hasRemaingColumnSizeChanged =
      remainingColumnSize < 0 !== (this.remainingColumnSize === 1) ||
      (remainingColumnSize > 0 &&
        remainingColumnSize !== this.remainingColumnSize)

    // Create an extra row so that the last character can always be fully on screen.
    this.remainingColumnSize = remainingColumnSize > 0 ? remainingColumnSize : 1
    const cellHeight = Math.floor(
      /* toolbar */
      (this.windowDimensionHeight - this.columnHeight - 33) / this.rowHeight
    )
    const taxa = this.matrixModel.getPartitionTaxa()
    const taxaSize = taxa.length
    const remainingRowSize = cellHeight - taxaSize
    const hasRemaingRowSizeChanged =
      remainingRowSize < 0 !== (this.remainingRowSize === 1) ||
      (remainingRowSize > 0 && remainingRowSize !== this.remainingRowSize)

    // Create an extra row so that the last row can always be fully on screen.
    this.remainingRowSize = remainingRowSize > 0 ? remainingRowSize : 1

    // if the spacing has changed we have to redraw the matrix characters and taxa since some may have been added/deleted
    if (hasRemaingColumnSizeChanged || hasRemaingRowSizeChanged) {
      this.redrawInternal()
    }
    this.columnSize = Math.ceil(this.windowDimensionWidth / this.columnWidth)
    if (this.columnSize < 0 || this.columnSize > characters.length) {
      this.columnSize = characters.length
    }
    this.rowSize = Math.ceil(this.windowDimensionHeight / this.rowHeight)
    if (this.rowSize < 0 || this.rowSize > taxa.length) {
      this.rowSize = taxa.length
    }

    // Recalculate the empty spacer so that it can be used to scale the scroll bar.
    const rightBottomSpacer =
      this.getElementByClass<HTMLElement>('rightBottomSpacer')
    const taxaHeight = gridTaxa.scrollHeight - this.rowHeight / 2
    const charactersWidth =
      this.getElementByClass('mb-grid-empty-header').clientWidth +
      gridCharacters.scrollWidth -
      this.columnWidth / 2
    mb.setElementStyle(rightBottomSpacer, 'top', taxaHeight + 'px')
    mb.setElementStyle(rightBottomSpacer, 'left', charactersWidth + 'px')
    this.redrawCells()
    this.redrawScrollbars()
  }

  /**
   * Redraw scroll bars.
   */
  redrawScrollbars() {
    const scrollbarWidth = mb.getScrollbarWidth()
    const scrollbarBorderSize = MatrixGrid.ROW_SPACING + 1

    /* scroll bar border */
    const gridTaxa = this.getElementByClass<HTMLElement>('gridTaxa')
    const gridCharacters = this.getElementByClass<HTMLElement>('gridCharacters')
    const charactersWidth =
      this.getElementByClass<HTMLElement>('mb-grid-empty-header').clientWidth +
      gridCharacters.scrollWidth
    this.horizontalScrollBar.setThumbRatio(
      this.windowDimensionWidth / charactersWidth
    )
    this.horizontalScrollBar.setScrollWidth(scrollbarWidth)
    const verticalScrollBarElement = this.verticalScrollBar.getElement()
    const verticalScrollBarHeight =
      this.windowDimensionHeight -
      this.headerHeight -
      scrollbarWidth -
      scrollbarBorderSize
    mb.setElementStyle(
      verticalScrollBarElement,
      'top',
      this.headerHeight + 'px'
    )
    mb.setElementStyle(
      verticalScrollBarElement,
      'height',
      verticalScrollBarHeight + 'px'
    )
    const horizontalScrollBarElement = this.horizontalScrollBar.getElement()
    const horizontalScrollBarWidth =
      this.windowDimensionWidth - scrollbarWidth - scrollbarBorderSize
    mb.setElementStyle(
      horizontalScrollBarElement,
      'width',
      horizontalScrollBarWidth + 'px'
    )
    this.verticalScrollBar.setThumbRatio(
      (this.windowDimensionHeight - this.headerHeight) / gridTaxa.scrollHeight
    )
    this.verticalScrollBar.setScrollWidth(scrollbarWidth)

    // Update scroll bars with new partition size
    const characters = this.matrixModel.getPartitionCharacters()
    const onScreenCharacters = Math.floor(
      (horizontalScrollBarWidth - gridTaxa.offsetWidth) / this.columnWidth
    )
    this.horizontalScrollBar.setMaximum(
      Math.max(characters.length - onScreenCharacters, 0)
    )
    const taxa = this.matrixModel.getPartitionTaxa()
    const onScreenTaxa = Math.floor(verticalScrollBarHeight / this.rowHeight)
    this.verticalScrollBar.setMaximum(Math.max(taxa.length - onScreenTaxa, 0))
    this.verticalScrollBar.redraw()
    this.horizontalScrollBar.redraw()
  }

  /**
   * Highlight the last clicked cell
   */
  highlightLastClickedCell() {
    if (this.lastClickedCell) {
      const characterId = parseInt(
        this.lastClickedCell.dataset['characterId'] as string,
        10
      )
      const taxonId = parseInt(
        this.lastClickedCell.dataset['taxonId'] as string,
        10
      )
      this.highlightCellByIds(taxonId, characterId)
    }
    this.refreshEditingHighlightedCells(true)
  }

  /**
   * Highlight a cell by the taxon id and character id
   * @param taxonId The id of the taxon to highlight
   * @param characterId The id of the character to highlight
   * @return The element that was highlighted.
   */
  protected highlightCellByIds(taxonId: number, characterId: number): Element {
    const getCell = (taxonId: number, characterId: number) =>
      this.matrixModel.getCell(taxonId, characterId)
    const td = this.cellRenderer.createCell(taxonId, characterId, getCell)
    this.changeHighlightedCell(td)
    return td
  }

  /**
   * Go to a particular taxon and character.
   * @param e event to go to a cell
   */
  goCellIndex(e: CustomEvent<GoToCellEvent>) {
    const tableBody = this.getElementByClass('matrixgridBody')
    const characterIndex = e.detail.characterIndex
    const characters = this.matrixModel.getPartitionCharacters()
    const characterSize = characters.length
    const scrollLeft =
      characterIndex <= characterSize && characterIndex >= 0
        ? characterIndex * this.columnWidth
        : tableBody.scrollLeft
    const taxonIndex = e.detail.taxonIndex
    const taxa = this.matrixModel.getPartitionTaxa()
    const taxonSize = taxa.length
    const scrollTop =
      taxonIndex <= taxonSize && taxonIndex >= 0
        ? taxonIndex * this.rowHeight
        : tableBody.scrollTop
    tableBody.scrollLeft = scrollLeft
    tableBody.scrollTop = scrollTop
    if (e.detail.highlight) {
      const taxon = taxa[taxonIndex]
      const character = characters[characterIndex]
      if (taxon && character) {
        const taxonId = taxon.getId()
        const characterId = character.getId()
        this.highlightCellByIds(taxonId, characterId)
        window.dispatchEvent(CellEditEvents.create(taxonId, characterId, true))
      }
    }
  }

  /**
   * Remove the caches and refresh all of the cells
   * @param e event that signifies that cells were changed.
   */
  protected onCellsChanged(e: CustomEvent<CellsChangedEvent>) {
    const taxaIds = e.detail.taxaIds
    const characterIds = e.detail.characterIds
    if (taxaIds.length === 0) {
      return
    }
    if (characterIds.length === 0) {
      this.cellRenderer.deleteCachedRows(taxaIds)
    } else {
      for (let x = 0; x < taxaIds.length; x++) {
        const taxonId = taxaIds[x]
        for (let y = 0; y < characterIds.length; y++) {
          const characterId = characterIds[y]
          this.cellRenderer.deleteCachedCell(taxonId, characterId)
        }
      }
    }
    this.redrawCells()

    // make sure that the last active cell is still highlighted
    this.highlightLastClickedCell()
  }

  /**
   * Remove the caches and refresh all of the character
   */
  protected onCharacterChanged() {
    // Clear the cell cache because states may have been renamed
    this.cellRenderer.clearCache()
    this.redraw()

    // make sure that the last active cell is still highlighted
    this.highlightLastClickedCell()
  }

  /**
   * Handles events from resizing the window.
   */
  protected onHandleResize() {
    this.windowDimensionHeight = document.documentElement.clientHeight
    this.windowDimensionWidth = document.documentElement.clientWidth
    this.resizeWindow()
  }

  /**
   * Handles events from scrolling the matrix table. This fixes an issue with
   * Chrome and Firefix which scrolls the matrixgridTable to left. This method
   * aims to fix that issue.
   *
   */
  protected onHandleTableScroll() {
    const gridTable = document.getElementById('matrixgridTable') as HTMLElement
    gridTable.scrollLeft = 0
    gridTable.scrollTop = 0
  }

  /**
   * Handles events from scrolling the matrix grid.
   * @param e The event that triggerd this callback.
   * @param scrollTop the scroll top in pixels
   * @param scrollLeft the scroll left in pixels
   */
  protected onHandleScroll(e: Event) {
    const element = <HTMLElement>e.target
    this.onHandleScrollBy(element.scrollTop, element.scrollLeft)
  }

  private onHandleScrollBy(scrollTop: number, scrollLeft: number) {
    // We use Math.round because it's not possible to represent all real numbers
    // in binary. Rounding ensures that we get to the closest value we want.
    const newColumn = Math.round(scrollLeft / this.columnWidth)
    const newRow = Math.round(scrollTop / this.rowHeight)
    scrollTop = newRow * this.rowHeight
    scrollLeft = newColumn * this.columnWidth
    const gridTaxa = this.getElementByClass<HTMLElement>('matrixgridTaxa')
    mb.setElementStyle(gridTaxa, 'top', -1 * scrollTop + 'px')
    const gridCharacters = this.getElementByClass<HTMLElement>(
      'matrixgridCharacters'
    )
    mb.setElementStyle(gridCharacters, 'left', -1 * scrollLeft + 'px')
    this.horizontalScrollBar.setValue(newColumn)
    this.verticalScrollBar.setValue(newRow)
    const samePosition =
      this.currentColumn === newColumn && this.currentRow === newRow

    // No need to scroll the grid if the column and rows have not changed
    if (samePosition) {
      return
    }
    this.currentColumn = newColumn
    this.currentRow = newRow
    this.redrawCells()

    // dispatch an event to inform that the position was updated
    window.dispatchEvent(
      GridPositionChangedEvents.create(this.currentRow, this.currentColumn)
    )
  }

  /**
   * Handles events from scrolling the matrix grid via the mouse wheel.
   * @param e The event that triggerd this callback.
   */
  protected onHandleWheel(e: WheelEvent) {
    const tableBody = this.getElementByClass('matrixgridBody')
    tableBody.scrollTop += e.deltaY
    tableBody.scrollLeft += e.deltaX

    // Prevent Chrome from using the swipe back.
    e.preventDefault()
    return true
  }

  /**
   * Handles when the last view state preference was changed.
   *
   * @return whether the handler handled this event.
   */
  protected onHandleLastViewStatePreferenceChanged(): boolean {
    // dispatch an event to inform that the position was updated
    window.dispatchEvent(
      GridPositionChangedEvents.create(this.currentRow, this.currentColumn)
    )
    return true
  }

  /**
   * @param element The element to query
   * @return The TD element of an element or null if it can't find one.
   */
  private static getElementCellParent(element: any): HTMLElement {
    while (element) {
      if (element.hasAttribute && element.dataset['taxonId']) {
        break
      }
      element = element.parentElement
    }
    return element as HTMLElement
  }

  /**
   * Handles events from mouse over the matrix grid.
   * @param e The event that triggerd this callback.
   */
  protected onHandleCellsMouseOver(e: Event) {
    const cell = MatrixGrid.getElementCellParent(e.target)
    if (cell === null) {
      return
    }
    const taxonId = cell.dataset['taxonId']
    const gridTaxa = this.getElementByClass('gridTaxa')
    const rows = gridTaxa.getElementsByTagName('tr')
    for (let x = 0; x < rows.length; x++) {
      const row = rows[x]
      const taxonElement = row.getElementsByTagName('td')[0]
      if (taxonElement) {
        row.classList.remove('hover')
        if (taxonId == taxonElement.dataset['taxonId']) {
          row.classList.add('hover')
          const tr = mb.getElementParent(cell, 'TR')
          tr.classList.add('hover')
        }
      }
    }
    this.currentCellTooltip.showForCell(cell)
  }

  /**
   * Handles events from mouse out in the matrix cell.
   * @param e The event that triggerd this callback.
   */
  protected onHandleCellsMouseOut(e: Event) {
    const cell = MatrixGrid.getElementCellParent(e.target)
    if (cell === null) {
      return
    }
    const taxonId = cell.dataset['taxonId']
    const gridTaxa = this.getElementByClass('gridTaxa')
    const rows = gridTaxa.getElementsByTagName('tr')
    for (let x = 0; x < rows.length; x++) {
      const row = rows[x]
      const taxonElement = row.getElementsByTagName('td')[0]
      if (taxonElement && taxonId === taxonElement.dataset['taxonId']) {
        row.classList.remove('hover')
        const tr = mb.getElementParent(cell, 'TR')
        tr.classList.remove('hover')
        break
      }
    }

    // hide tooltip is showing
    this.currentCellTooltip.hideForCell(cell)
  }

  /**
   * Handles events from mouse over in the matrix taxa.
   * @param e The event that triggerd this callback.
   */
  protected onHandleTaxaMouseOver(e: Event) {
    const taxon = MatrixGrid.getElementCellParent(e.target)
    if (taxon === null) {
      return
    }
    const taxonId = parseInt(taxon.dataset['taxonId'] as string, 10)
    const gridCells = this.getElementByClass('gridCells')
    const rows = gridCells.getElementsByTagName('tr')
    for (let x = 0; x < rows.length; x++) {
      const row = rows[x]
      const cell = row.getElementsByTagName('td')[0]
      if (cell && taxonId === parseInt(cell.dataset['taxonId'] as string, 10)) {
        const tr = mb.getElementParent(taxon, 'TR')
        tr.classList.add('hover')
        row.classList.add('hover')
        break
      }
    }
  }

  /**
   * Handles events from mouse over in the matrix taxa.
   * @param e The event that triggerd this callback.
   */
  protected onHandleTaxaMouseOut(e: Event) {
    const taxon = MatrixGrid.getElementCellParent(e.target)
    if (taxon === null) {
      return
    }
    const taxonId = parseInt(taxon.dataset['taxonId'] as string, 10)
    const gridCells = this.getElementByClass('gridCells')
    const rows = gridCells.getElementsByTagName('tr')
    for (let x = 0; x < rows.length; x++) {
      const row = rows[x]
      const cell = row.getElementsByTagName('td')[0]
      if (cell && taxonId === parseInt(cell.dataset['taxonId'] as string, 10)) {
        const tr = mb.getElementParent(taxon, 'TR')
        tr.classList.remove('hover')
        row.classList.remove('hover')
        break
      }
    }
  }

  /**
   * Handles events from mouse double click in the matrix taxa.
   * @param e The event that triggerd this callback.
   */
  protected onHandleTaxaDoubleClick(e: Event) {
    const taxon = MatrixGrid.getElementCellParent(e.target)
    if (taxon === null) {
      MatrixGrid.setEmptyRowMessageBar()
    }
    const taxonId = parseInt(taxon.dataset['taxonId'] as string, 10)
    const taxonDialog = this.gridHandler.createTaxonDialog(
      this.matrixModel,
      taxonId
    )
    taxonDialog.setVisible(true)
  }

  /**
   * Handles events from clicking the matrix grid.
   * @param e The event that triggerd this callback.
   */
  protected onHandleCellsClick(e: Event) {
    const cellElement =
      (e && MatrixGrid.getElementCellParent(e.target)) || this.lastClickedCell
    if (
      cellElement === null ||
      !cellElement.dataset['taxonId'] ||
      !cellElement.dataset['characterId']
    ) {
      return
    }
    const taxonId = parseInt(cellElement.dataset['taxonId'] as string, 10)

    // do not select empty cells
    if (!taxonId) {
      MatrixGrid.setEmptyRowMessageBar()
      return
    }
    this.changeHighlightedCell(cellElement)
  }

  /**
   * Shows empty row message when it's clicked.
   */
  static setEmptyRowMessageBar() {
    const messageBar = new MessageBar(
      'To add a character click the "Characters" button above, to add a taxon click "Taxa".'
    )
    messageBar.render()
  }

  /**
   * Changes the highlighted cell in a matrix grid
   *
   * @param element the element to highlight
   */
  changeHighlightedCell(element: HTMLElement) {
    if (this.lastClickedCell === element) {
      return
    }
    if (this.lastClickedCell !== null) {
      this.lastClickedCell.classList.remove('active')
    }
    this.lastClickedCell = element
    this.lastClickedCell.classList.add('active')
  }

  /**
   * Handles when a cell highlight event is called.
   * @param e event that signifies that cells should be highlighted.
   */
  protected onHandleCellsHighlight(e: CustomEvent<CellsHighlightEvent>) {
    const getCell = (taxonId: number, characterId: number) =>
      this.matrixModel.getCell(taxonId, characterId)
    for (let x = 0; x < this.highlightedCells.length; x++) {
      const td = this.highlightedCells[x]
      td.classList.remove('collaborate')
      td.removeAttribute('data-editingUserId')
    }
    this.highlightedCells = []
    const cells = e.detail.cells
    for (let x = 0; x < cells.length; x++) {
      const cell = cells[x]
      const td = this.cellRenderer.createCell(
        cell.taxonId,
        cell.characterId,
        getCell
      )
      td.setAttribute('data-editingUserId', String(cell.userId))
      this.highlightedCells.push(td)
    }
    this.refreshEditingHighlightedCells(true)
  }

  /**
   * Refreshes the highlighted cells in the matrix grid.
   *
   * @param toggle Whether to toggle the highlighed cells on or off.
   */
  protected refreshEditingHighlightedCells(toggle: boolean) {
    for (let x = 0; x < this.highlightedCells.length; x++) {
      const td = this.highlightedCells[x]
      if (toggle) {
        td.classList.add('collaborate')
      } else {
        td.classList.remove('collaborate')
      }
    }
  }

  /**
   * Handles events from double clicking the matrix grid.
   * @param e The event that triggerd this callback.
   */
  protected onHandleCellsDoubleclick(e: Event | null) {
    const cellElement =
      (e && MatrixGrid.getElementCellParent(e.target)) || this.lastClickedCell
    if (cellElement === null) {
      return
    }

    const taxonIdValue = cellElement.dataset['taxonId'] as string
    const characterIdValue = cellElement.dataset['characterId'] as string
    if (!taxonIdValue || !characterIdValue) {
      return
    }

    const taxonId = parseInt(taxonIdValue, 10)
    const characterId = parseInt(characterIdValue, 10)
    const cellDialog = this.gridHandler.createCellDialog(
      this.matrixModel,
      taxonId,
      characterId
    )
    cellDialog.setVisible(true)

    // Once the cell dialog is disposed, we want to indicate that we are no longer editing that cell.
    cellDialog.addOnDisposeCallback(() =>
      window.dispatchEvent(CellEditEvents.create(taxonId, characterId, false))
    )
    window.dispatchEvent(CellEditEvents.create(taxonId, characterId, true))
    return true
  }

  /**
   * Handles events from mouse over on the characters.
   * @param e The event that triggerd this callback.
   */
  protected onHandleCharacterMouseOver(e: Event) {
    const element = e.target as HTMLElement
    const th = mb.getElementParent(element, 'TH')
    if (th && th.dataset['characterId']) {
      const isRule = element.classList.contains('characterModifier')
      if (isRule) {
        const characterId = parseInt(th.dataset['characterId'])
        this.characterTooltipManager.showRulesForCharacter(element, characterId)
      } else {
        this.characterTooltipManager.showForCharacter(th)
      }
      e.stopPropagation()
      e.preventDefault()
    }
    return true
  }

  /**
   * Handles events from mouse over on the characters.
   * @param e The event that triggerd this callback.
   */
  protected onHandleCharacterMouseLeave(e: Event) {
    const element = e.target as HTMLElement
    const th = mb.getElementParent(element, 'TH')
    if (th && th.dataset['characterId']) {
      const isRule = element.classList.contains('characterModifier')
      if (isRule) {
        this.characterTooltipManager.hideForCharacter(element)
      } else {
        if (element == th) {
          this.characterTooltipManager.hideForCharacter(th)
        }
      }
      e.stopPropagation()
      e.preventDefault()
    }
    return true
  }

  /**
   * Handles events from double clicks on the characters.
   * @param e The event that triggerd this callback.
   */
  protected onHandleCharacterDoubleClick(e: Event) {
    const th = mb.getElementParent(e.target, 'TH')
    if (th === null || !th.dataset['characterId']) {
      return false
    }
    const characterId = parseInt(th.dataset['characterId'] as string, 10)
    const characterDialog = this.gridHandler.createCharacterDialog(
      this.matrixModel,
      characterId
    )
    characterDialog.setVisible(true)
    this.characterTooltipManager.hideAll()
    return true
  }

  /**
   * Handles events when character are modified.
   */
  protected onCharactersChange() {
    this.redrawCharacters()
    this.redrawScrollbars()
    return true
  }

  /**
   * Handles events when character are modified.
   *
   */
  protected onTaxaChange() {
    this.redrawTaxa()
    this.redrawScrollbars()
    return true
  }

  /**
   * Handlers events when the partition has changed.
   */
  protected onPartitionChanged() {
    this.onHandleScrollBy(1, 1)
    this.redrawScrollbars()
    return true
  }

  /**
   * Handlers events when the user presses keys on the grid.
   *
   * @param e The event that triggerd this callback.
   */
  protected onHandleKeyDown(e: KeyboardEvent) {
    // If there isn't a highlighted cell, there's no reason to capture key events
    if (this.lastClickedCell === null) {
      return
    }
    if (e.code === KeyCodes.ENTER || e.code === KeyCodes.SPACE) {
      // Prevent the dialog from recieving the enter keycode which will close it.
      e.preventDefault()
      this.onHandleCellsDoubleclick(null)
      return true
    }
    const taxonId = parseInt(
      this.lastClickedCell.dataset['taxonId'] as string,
      10
    )
    const characterId = parseInt(
      this.lastClickedCell.dataset['characterId'] as string,
      10
    )
    let nextCharacter
    switch (e.code) {
      case KeyCodes.DOWN:
        this.scrollToCellFromIndices(taxonId, characterId, 1, 0)
        break
      case KeyCodes.UP:
        this.scrollToCellFromIndices(taxonId, characterId, -1, 0)
        break
      case KeyCodes.LEFT:
        this.scrollToCellFromIndices(taxonId, characterId, 0, -1)
        break
      case KeyCodes.RIGHT:
        this.scrollToCellFromIndices(taxonId, characterId, 0, 1)
        break
      case KeyCodes.PAGE_DOWN:
        nextCharacter =
          Math.floor(this.windowDimensionHeight / this.rowHeight) >> 1
        this.scrollToCellFromIndices(taxonId, characterId, nextCharacter, 0)
        break
      case KeyCodes.PAGE_UP:
        nextCharacter =
          Math.floor(this.windowDimensionHeight / this.rowHeight) >> 1
        this.scrollToCellFromIndices(taxonId, characterId, -nextCharacter, 0)
        break
      case KeyCodes.BACKSPACE:
        // Prevent certain key presses
        break
      default:
        return false
    }

    // Internet Explorer does not retain focus on the grid after we redawing the matrix. Let's ensure that the grid is
    // focued on so that we can continue to use keyboard navigation.
    const gridCells = this.getElementByClass<HTMLElement>('gridCells')
    if (gridCells !== document.activeElement) {
      gridCells.focus()
    }
    e.preventDefault()
    return true
  }

  /**
   * Handle event with the horizontal scrollbar has changed.
   */
  onHorizontalScrollbarChange(): boolean {
    const tableBody = this.getElementByClass('matrixgridBody')
    tableBody.scrollLeft =
      this.columnWidth * this.horizontalScrollBar.getValue()
    return true
  }

  /**
   * Handle event with the vertical scrollbar has changed.
   */
  onVerticalScrollbarChange(): boolean {
    const tableBody = this.getElementByClass('matrixgridBody')
    tableBody.scrollTop = this.rowHeight * this.verticalScrollBar.getValue()
    return true
  }

  /**
   * Handlers events when the user double taps the screen. This disables all double tap features
   * since it'll try to zoom in on the grid.
   *
   * @param e The event that triggerd this callback.
   */
  protected onHandleDoubleTap(e: TouchEvent) {
    if (e.touches.length < 2) {
      e.preventDefault()
    }
  }

  /**
   * Highlights and scrolls to a taxon given an index.
   *
   * @param taxonId The id of the taxon to scroll from
   * @param characterId The id of the character to scroll from
   * @param indexFromTaxon The amount of indices from the old taxa
   * @param indexFromCharacter The amount of indices from the old character
   */
  private scrollToCellFromIndices(
    taxonId: number,
    characterId: number,
    indexFromTaxon: number,
    indexFromCharacter: number
  ) {
    if (indexFromTaxon) {
      const nextTaxonIndex =
        this.matrixModel.getTaxonIndexById(taxonId) + indexFromTaxon
      const partitionTaxa = this.matrixModel.getPartitionTaxa()
      const nextTaxon = partitionTaxa[nextTaxonIndex]
      if (!nextTaxon) {
        return
      }
      taxonId = nextTaxon.getId()
    }
    if (indexFromCharacter) {
      const nextCharacterIndex =
        this.matrixModel.getCharacterIndexById(characterId) + indexFromCharacter
      const partitionCharacters = this.matrixModel.getPartitionCharacters()
      const nextCharacter = partitionCharacters[nextCharacterIndex]
      if (!nextCharacter) {
        return
      }
      characterId = nextCharacter.getId()
    }

    // Highlight the next cell
    const td = this.highlightCellByIds(taxonId, characterId)
    const gridCharacters = this.getElementByClass('gridCharacters')
    const gridTaxa = this.getElementByClass('gridTaxa')
    const horizontalScrollbarElement = this.horizontalScrollBar.getElement()
    const verticalScrollbarElement = this.verticalScrollBar.getElement()
    const nonOverlappingElements = [
      gridCharacters,
      gridTaxa,
      horizontalScrollbarElement,
      verticalScrollbarElement,
    ]
    if (!mb.isFullyOnScreen(td, nonOverlappingElements)) {
      const tableBody = this.getElementByClass('matrixgridBody')
      tableBody.scrollTop += this.rowHeight * indexFromTaxon
      tableBody.scrollLeft += this.columnWidth * indexFromCharacter
    }
  }
}
