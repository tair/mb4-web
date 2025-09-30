import { MediaGrid, MediaGridItemEvent } from '../MediaGrid'
import { CellMedia } from '../../data/Cells'
import { Citation } from '../../data/Citation'
import * as mb from '../../mb'
import { MatrixModel } from '../../MatrixModel'
import { Characters, CharacterType } from '../../data/Characters'
import {
  Component,
  EventType,
  MobileFriendlyClickEventType,
} from '../Component'
import { DataGridTable, DataRow } from '../DataGridTable'
import { Dialog } from '../Dialog'
import { TabNavigator } from '../TabNavigator'
import { ModalDefaultButtons } from '../Modal'
import { CellNumericalValueContent } from '../CellsContent'
import { ImageViewerDialog } from './ImageViewerDialog'

/**
 * The readonly cell dialog used to display cell information in the Matrix editor
 *
 * @param matrixModel The data associated with the matrix
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 */
export class ReadonlyCellDialog extends Dialog {
  /**
   * The last selected tab index. Used to keep the tab the same across cell dialogs.
   */
  private static LAST_SELECTED_TAB_INDEX: number = 0

  private readonly matrixModel: MatrixModel
  private readonly taxonId: number
  private readonly characterId: number
  private readonly tabNavigator: TabNavigator

  constructor(matrixModel: MatrixModel, taxonId: number, characterId: number) {
    super()

    this.matrixModel = matrixModel
    this.taxonId = taxonId
    this.characterId = characterId

    this.tabNavigator = new TabNavigator()
    this.registerDisposable(this.tabNavigator)
  }

  protected override initialize(): void {
    this.setHasBackdrop(false)
    this.setDisposeOnHide(true)
    this.addButton(ModalDefaultButtons.DONE)
  }

  protected override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('cellDialog', 'modal-lg', 'readonly')

    const contentElement = this.getContentElement()
    contentElement.innerHTML = ReadonlyCellDialog.htmlContent()

    this.tabNavigator.addTab(
      'Scores',
      new ScorePane(this.matrixModel, this.taxonId, this.characterId)
    )
    const cellInfo = this.matrixModel
      .getCells()
      .getCellInfo(this.taxonId, this.characterId)
    const notes = cellInfo.getNotes()
    if (notes && !mb.isEmptyOrWhitespace(notes)) {
      this.tabNavigator.addTab('Notes', new NotesPane(mb.htmlEscape(notes)))
    }
    const cellMedia = cellInfo.getMedia()
    if (cellMedia) {
      this.tabNavigator.addTab('Media', new MediaPane(cellMedia))
    }
    const citationCount = cellInfo.getCitationCount()
    if (citationCount) {
      this.tabNavigator.addTab(
        'Citations',
        new CitationsPane(this.matrixModel, this.taxonId, this.characterId)
      )
    }

    this.tabNavigator.setSelectedTabIndex(
      ReadonlyCellDialog.LAST_SELECTED_TAB_INDEX
    )
    this.tabNavigator.render(contentElement)
    this.updateCellName()
  }

  protected override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler.listen(this.tabNavigator, EventType.SELECT, () =>
      this.updateLastSelectedTabIndex()
    )
  }

  /**
   * Updates the last selected tab index.
   */
  updateLastSelectedTabIndex() {
    ReadonlyCellDialog.LAST_SELECTED_TAB_INDEX =
      this.tabNavigator.getSelectedTabIndex()
  }

  /**
   * Update cell name html using data from the model
   */
  protected updateCellName() {
    const taxon = this.matrixModel.getTaxa().getById(this.taxonId)
    const character = this.matrixModel.getCharacters().getById(this.characterId)
    const cellNameElement = this.getElementByClass('cell-name')
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const taxonName =
      '[' +
      (taxon!.getNumber() - numberingMode) +
      '] ' +
      taxon!.getDisplayName()
    const characterName =
      '  [' +
      (character!.getNumber() - numberingMode) +
      '] ' +
      mb.htmlEscape(character!.getName())
    cellNameElement.innerHTML =
      '<b>Now Viewing</b>:<span class="taxonName ">' +
      taxonName +
      '</span><span class="characterName">' +
      characterName +
      '</span>'
  }

  /**
   * @return The HTML content of the dialog
   */
  private static htmlContent(): string {
    return '<div class="cell-name"></div>'
  }
}

/**
 * Cell data pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 */
class ScorePane extends Component {
  private readonly matrixModel: MatrixModel
  private readonly taxonId: number
  private readonly characterId: number
  private readonly cellDataGridTable: DataGridTable

  constructor(matrixModel: MatrixModel, taxonId: number, characterId: number) {
    super()

    this.matrixModel = matrixModel
    this.taxonId = taxonId
    this.characterId = characterId

    this.cellDataGridTable = new DataGridTable()
    this.registerDisposable(this.cellDataGridTable)
  }

  /**
   * @return The HTML content of the cell data grid
   */
  private static htmlContent(): string {
    return '<div class="scoringGrid"></div>'
  }

  protected override createDom() {
    super.createDom()

    const element = this.getElement()
    element.innerHTML = ScorePane.htmlContent()
    element.classList.add('cellDataPane')

    const cellDataGridElement = this.getElementByClass('scoringGrid')
    this.cellDataGridTable.render(cellDataGridElement)

    const characters = this.matrixModel.getCharacters()
    const character = characters.getById(this.characterId)
    const type = character!.getType()
    if (type === CharacterType.DISCRETE) {
      this.drawStatesGrid()
    } else {
      this.drawValuesGrid()
    }
  }

  /** Draws numerical values */
  drawValuesGrid() {
    const cells = this.matrixModel.getCells()
    const cellStates = cells.getCell(this.taxonId, this.characterId)
    let values
    if (cellStates.length) {
      values = CellNumericalValueContent({
        start_value: cellStates[0].getNumericStartValue(),
        end_value: cellStates[0].getNumericEndValue(),
      })
      const scoringUserId = cellStates[0].getUserId()
      const properties = this.matrixModel.getProjectProperties()
      const member = properties.getMember(scoringUserId)
      if (member) {
        const scoringMembers = new Set([
          member.getFirstName() + ' ' + member.getLastName(),
        ])
        this.addScoringMembers(scoringMembers, cellStates[0].getCreationTime())
      }
    } else {
      values = '?'
    }
    this.cellDataGridTable.addColumn('Values')
    this.cellDataGridTable.addRows([{ labels: [values] }])
    this.cellDataGridTable.redraw()
  }

  /** Draws cell states */
  drawStatesGrid() {
    this.cellDataGridTable.clearRows()
    const cells = this.matrixModel.getCells()
    const properties = this.matrixModel.getProjectProperties()
    let maxCellCreationTime = 0

    // get cell states
    const cellStates = cells.getCell(this.taxonId, this.characterId)
    const cellStateIds: number[] = []
    const scoringMembers: Set<string> = new Set()
    for (let x = 0; x < cellStates.length; x++) {
      const cellState = cellStates[x]
      cellStateIds.push(cellState.getStateId())
      maxCellCreationTime = Math.max(
        maxCellCreationTime,
        cellState.getCreationTime()
      )

      // get the scorer
      const scoringUserId = cellState.getUserId()
      const member = properties.getMember(scoringUserId)
      if (member) {
        scoringMembers.add(member.getFirstName() + ' ' + member.getLastName())
      }
    }
    if (scoringMembers.size) {
      this.addScoringMembers(scoringMembers, maxCellCreationTime)
    }
    const characters = this.matrixModel.getCharacters()
    const character = characters.getById(this.characterId)
    const characterStates = character!.getStates()
    let row: DataRow
    const rows: DataRow[] = []
    for (let x = 0; x < characterStates.length; x++) {
      const characterState = characterStates[x]
      const characterStateId = characterState.getId()
      row = {
        labels: [
          characterState.getNumber(),
          mb.htmlEscape(characterState.getName()),
        ],
        data: { stateid: characterStateId },
      }
      if (mb.contains(cellStateIds, characterStateId)) {
        row.className = 'activeStateRow'
      }
      rows.push(row)
    }

    // not defined row
    row = { labels: ['?', '?'], data: { stateid: null } }
    if (cellStateIds.length === 0) {
      row.className = 'activeStateRow'
    }
    rows.push(row)

    // not applicable row
    row = { labels: ['-', '-'], data: { stateid: 0 } }
    const isNotApplicable =
      cellStates.length === 1 &&
      cellStates[0].getStateId() === 0 &&
      !cellStates[0].isNPA()
    if (isNotApplicable) {
      row.className = 'activeStateRow'
    }
    rows.push(row)

    // NPA row
    const isNPA =
      cellStates.length === 1 &&
      cellStates[0].getStateId() === 0 &&
      cellStates[0].isNPA()
    row = {
      labels: ['NPA', 'Not presently available (= ? in nexus file)'],
      data: { stateid: -1 },
    }
    if (isNPA) {
      row.className = 'activeStateRow'
    }
    rows.push(row)
    this.cellDataGridTable.addColumn('#')
    this.cellDataGridTable.addColumn('State')
    this.cellDataGridTable.addRows(rows)
    this.cellDataGridTable.redraw()
  }

  /**
   * Displays the scoring members
   */
  addScoringMembers(scoringMembers: Set<string>, maxCellCreationTime: number) {
    let scoringMembersStr = 'Scored by'

    // Hueristic to determine whether the cell was edited after the matrix was updated. This uses 60 seconds
    // as a reasonable threshold for matrix importation. This means that the cell was scored within 60 seconds
    // of the matrix being imported, which usually happens when the cell scored was added during the import.
    const properties = this.matrixModel.getProjectProperties()
    if (
      properties.wasMatrixUploaded() &&
      scoringMembers.size === 1 &&
      maxCellCreationTime - 60 < properties.getCreationTime()
    ) {
      scoringMembersStr += ': entire matrix loaded by'
    }
    scoringMembersStr +=
      ' ' + Array.from(scoringMembers.keys()).join(', ') + '.'
    const node = document.createTextNode(scoringMembersStr)
    const element = this.getElement()
    element.appendChild(node)
  }
}

/**
 * Notes pane
 *
 * @param notes The notes of the cell
 */
class NotesPane extends Component {
  private readonly notes: string

  constructor(notes: string) {
    super()

    this.notes = notes
  }

  protected override createDom() {
    const textElement = document.createElement('textarea')
    textElement.classList.add('notesArea')
    textElement.value = this.notes
    textElement.disabled = true

    this.setElementInternal(textElement)
  }
}

/**
 * Cell Media pane
 * @param cellMedia The cell's media
 */
class MediaPane extends Component {
  private readonly cellMedia: CellMedia[]
  private readonly mediaGrid: MediaGrid

  constructor(cellMedia: CellMedia[]) {
    super()

    this.cellMedia = cellMedia

    this.mediaGrid = new MediaGrid()
    this.mediaGrid.setRemoveable(false)
    this.registerDisposable(this.mediaGrid)
  }

  /**
   * @return The HTML content of the cell media grid
   */
  static htmlContent(): string {
    return '<div class="mediaPane"><div>'
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = MediaPane.htmlContent()
    element.classList.add('cellDataPane')
    this.setMediaInGrid()
    const mediaPane = this.getElementByClass('mediaPane')
    this.mediaGrid.render(mediaPane)
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(
      this.mediaGrid,
      MobileFriendlyClickEventType,
      (e: CustomEvent<MediaGridItemEvent>) =>
        this.onHandleDoubleClickCellMedia(e)
    )
  }

  /**
   * Sets the media the in media grid
   */
  setMediaInGrid() {
    this.mediaGrid.clear()
    for (let x = 0; x < this.cellMedia.length; x++) {
      const cellMedium = this.cellMedia[x]
      const mediaItem = { id: cellMedium.getId(), image: cellMedium.getTiny() }
      this.mediaGrid.addItem(mediaItem)
    }
  }

  /**
   * Handles events when media are selected.
   * @param e The event that triggerd this callback.
   */
  protected onHandleDoubleClickCellMedia(e: CustomEvent<MediaGridItemEvent>) {
    const item = e.detail.item
    if (item) {
      // Use new signature with project ID and published state from matrix model  
      const projectId = this.matrixModel.getProjectId()
      const published = this.matrixModel.isPublished()
      // Find the corresponding cell media object for the item
      const cellMedium = this.cellMedia.find(m => m.getId() === item.id)
      const mediaData = cellMedium ? (cellMedium as any).cellMediaObj || {} : {}
      
      ImageViewerDialog.show('X', item.id, projectId, mediaData, true, null, published)
    }
  }
}

/**
 * Citations pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 */
class CitationsPane extends Component {
  private readonly matrixModel: MatrixModel
  private readonly taxonId: number
  private readonly characterId: number
  private readonly loadingElement: Element
  private readonly citationsGridTable: DataGridTable

  constructor(matrixModel: MatrixModel, taxonId: number, characterId: number) {
    super()
    this.matrixModel = matrixModel
    this.taxonId = taxonId
    this.characterId = characterId
    this.loadingElement = this.getLoadingElement()
    this.citationsGridTable = new DataGridTable()
    this.registerDisposable(this.citationsGridTable)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = CitationsPane.htmlContent()
    this.citationsGridTable.addColumn('Reference')
    this.citationsGridTable.addColumn('Pages')
    this.citationsGridTable.addColumn('Notes')
    const citationsPane = this.getElementByClass('citationsPane')
    this.citationsGridTable.render(citationsPane)
    this.loadCellCitations()
  }

  /**
   * @return an element which shows a loading indicator.
   */
  getLoadingElement(): Element {
    const loadingElement = document.createElement('div')
    loadingElement.classList.add('loadingCitation')
    const messageElement = document.createElement('div')
    messageElement.textContent = 'Loading citations...'
    loadingElement.appendChild(messageElement)
    return loadingElement
  }

  /**
   * Loads the cell citations from the server
   */
  loadCellCitations() {
    const element = this.getElement()
    element.appendChild(this.loadingElement)
    this.matrixModel
      .getCellCitations(this.taxonId, this.characterId)
      .then((citations) => this.redrawCellCitations(citations))
      .catch(() => alert('Failed to load cell citations'))
      .finally(() => element.removeChild(this.loadingElement))
  }

  /**
   * Redraws the cell citations within the citation grid.
   * @param citations the citations that will be used to redraw the grid
   */
  redrawCellCitations(citations: Citation[]) {
    const rows: DataRow[] = []
    for (let x = 0; x < citations.length; x++) {
      const citation = citations[x]
      const row = {
        labels: [
          mb.htmlEscape(citation.getName()),
          mb.htmlEscape(citation.getPages()),
          mb.htmlEscape(citation.getNotes()),
        ],
        removeable: false,
      }
      rows.push(row)
    }
    this.citationsGridTable.clearRows()
    this.citationsGridTable.addRows(rows)
    this.citationsGridTable.redraw()
  }

  /**
   * @return The HTML content for the citations pane
   */
  static htmlContent(): string {
    return '<div class="citationsPane"></div>'
  }
}
