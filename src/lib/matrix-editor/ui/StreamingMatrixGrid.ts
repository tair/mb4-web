import { MatrixGridHandler } from './MatrixGridHandler'
import * as mb from '../mb'
import { MatrixModel } from '../MatrixModel'
import { MatrixGrid } from './MatrixGrid'
import { StreamingCellsModal } from './StreamingCellsModal'
import { KeyCodes } from './Component'

/**
 * The strolling version of the matrix grid which loads anything that is visible to the user but offsets certain loads
 * until the user requests it.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param gridHandler The handler to certain matrix operations
 */
export class StreamingMatrixGrid extends MatrixGrid {
  private streamingCellsModal: StreamingCellsModal
  private taxaIdsToLoad: Set<number>
  private characterIdsToLoad: Set<number>
  private reDrawTimer: number = 0

  constructor(matrixModel: MatrixModel, gridHandler: MatrixGridHandler, projectId: number) {
    super(matrixModel, gridHandler, projectId)
    this.streamingCellsModal = new StreamingCellsModal()
    this.registerDisposable(this.streamingCellsModal)
    this.taxaIdsToLoad = new Set()
    this.characterIdsToLoad = new Set()
  }

  override createDom() {
    super.createDom()
    const tableBody = this.getElementByClass('matrixgridBody')
    this.streamingCellsModal.render(tableBody)
  }

  override redrawCells() {
    super.redrawCells()
    if (!this.matrixModel.isStreaming()) {
      return
    }
    const characters = this.matrixModel.getPartitionCharacters()
    const taxa = this.matrixModel.getPartitionTaxa()
    const taxaIdsToCheck: number[] = []
    for (
      let x = 0, row = this.currentRow;
      x < this.rowSize && row < taxa.length;
      x++, row++
    ) {
      const taxonData = taxa[row]
      taxaIdsToCheck.push(taxonData.getId())
    }
    const charactersIdsToCheck: number[] = []
    for (
      let y = 0, column = this.currentColumn;
      y < this.columnSize && column < characters.length;
      y++, column++
    ) {
      const characterData = characters[column]
      charactersIdsToCheck.push(characterData.getId())
    }
    const cellsToLoad = this.matrixModel.checkCellsLoaded(
      taxaIdsToCheck,
      charactersIdsToCheck
    )
    if (!cellsToLoad) {
      return
    }
    cellsToLoad[0].forEach((t) => this.taxaIdsToLoad.add(t))
    cellsToLoad[1].forEach((c) => this.characterIdsToLoad.add(c))

    // Create loading screen. If there is a previous loading screen, we would remove it.
    this.streamingCellsModal.show()
    if (this.reDrawTimer > 0) {
      this.streamingCellsModal.hide()
      clearTimeout(this.reDrawTimer)
    }

    // set up a new handler
    this.reDrawTimer = window.setTimeout(() => this.fetchCells(), 750)
  }

  override resizeWindow() {
    super.resizeWindow()
    const gridTaxa = this.getElementByClass('gridTaxa')
    const gridCharacters = this.getElementByClass('gridCharacters')

    // Get the taxa height: height of the taxa and without the scrollbar
    const height = gridTaxa.scrollHeight

    // Get the characters width: width of the characters and the empty spacer
    const width =
      this.getElementByClass('mb-grid-empty-header').clientWidth +
      gridCharacters.scrollWidth
    const streamingCellsModalElement = this.streamingCellsModal.getElement()
    mb.setElementStyle(streamingCellsModalElement, 'width', width + 'px')
    mb.setElementStyle(streamingCellsModalElement, 'height', height + 'px')
  }

  override onHandleKeyDown(e: KeyboardEvent) {
    // While we're fetching cells, let's ignore key press operation because we don't want to scroll. Scrolling will
    // cause more fetches and we want to limit the number of fetches per scroll event.
    if (
      this.reDrawTimer > 0 &&
      !(e.code == KeyCodes.LEFT || e.code == KeyCodes.DOWN)
    ) {
      e.preventDefault()
      return true
    }
    super.onHandleKeyDown.call(e)
  }

  /**
   * Actually fetch the cells for the matrix.
   */
  fetchCells() {
    const taxaIds = Array.from(this.taxaIdsToLoad.values())
    const characterIds = Array.from(this.characterIdsToLoad.values())
    this.matrixModel
      .fetchCellsData(taxaIds, characterIds)
      .finally(() => this.streamingCellsModal.hide())
    this.taxaIdsToLoad.clear()
    this.characterIdsToLoad.clear()
    this.reDrawTimer = 0
  }
}
