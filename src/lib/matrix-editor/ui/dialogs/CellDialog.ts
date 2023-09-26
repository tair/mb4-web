import * as GoToCellEvents from '../../events/GoToCellEvent'
import { GoToCellEvent } from '../../events/GoToCellEvent'
import { CellsChangedEvent } from '../../events/CellsChangedEvent'
import * as CellsChangedEvents from '../../events/CellsChangedEvent'
import { SavingLabel } from '../SavingLabel'
import * as mb from '../../mb'
import { MatrixModel } from '../../MatrixModel'
import { Citation } from '../../data/Citation'
import { Character, CharacterType } from '../../data/Characters'
import { CharacterChangedEvent } from '../../events/CharacterChangedEvent'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import { CharacterRefreshedEvent } from '../../events/CharacterRefreshedEvent'
import * as CharacterRefreshedEvents from '../../events/CharacterRefreshedEvent'
import { Checkbox } from '../Checkbox'
import { DataGridTable, DataRow } from '../DataGridTable'
import { Dialog } from '../Dialog'
import { Dropdown } from '../Dropdown'
import { MediaGrid, MediaGridItem, MediaGridItemEvent } from '../MediaGrid'
import { TabNavigator } from '../TabNavigator'
import { AddCitationDialog } from './AddCitationDialog'
import { AddCommentDialog } from './AddCommentDialog'
import { AddMediaDialog } from './AddMediaDialog'
import { CancelableConfirmDialog } from './CancelableConfirmDialog'
import { EditCitationDialog } from './EditCitationDialog'
import { ImageViewerDialog } from './ImageViewerDialog'
import {
  Component,
  EventType,
  KeyCodes,
  MobileFriendlyClickEventType,
} from '../Component'
import { ModalDefaultButtons } from '../Modal'
import { CellInfo, type CellInfoStatus } from '../../data/Cells'

/**
 * The cell list dialog which edits cells within this matrix.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 */
export class CellDialog extends Dialog {
  /**
   * The last selected tab index. Used to keep the tab the same across cell dialogs.
   */
  private static LAST_SELECTED_TAB_INDEX: number = 0

  /**
   * Message to indicate that the row is locked by the Project Administrator
   */
  static LOCKED_MESSAGE: string =
    'The Project Administrator has locked this row for you. You cannot edit it unless the lock is removed.'

  private matrixModel: MatrixModel
  private taxonId: number
  private characterId: number
  private hasAccess: boolean
  private tabNavigator: TabNavigator

  constructor(matrixModel: MatrixModel, taxonId: number, characterId: number) {
    super()

    this.matrixModel = matrixModel
    this.taxonId = taxonId
    this.characterId = characterId

    const taxon = matrixModel.getTaxa().getById(taxonId)
    this.hasAccess =
      taxon != null && taxon.hasAccess(this.matrixModel.getProjectProperties())
    this.tabNavigator = new TabNavigator()
    this.registerDisposable(this.tabNavigator)
    this.setTitle('Cell Editor')
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(ModalDefaultButtons.DONE)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('cellDialog', 'modal-lg')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = CellDialog.htmlContent()
    this.redraw()

    this.tabNavigator.render(contentElement)
    const summaryElement = document.createElement('span')
    summaryElement.className = 'summary'
    summaryElement.textContent = 'Use keyboard to move between cells'
    contentElement.appendChild(summaryElement)
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(this.tabNavigator, EventType.SELECT, () =>
        this.updateLastSelectedTabIndex()
      )
      .listen(
        window,
        GoToCellEvents.TYPE,
        (e: CustomEvent<GoToCellEvents.GoToCellEvent>) =>
          this.onCellSelection(e)
      )
      .listen(this.getElement(), EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.onKeyDown(e)
      )
  }

  /**
   * Handles when the key down event is triggered on the dialog
   * @param e The event that triggerd this callback.
   */
  protected onKeyDown(e: KeyboardEvent) {
    if (
      this.tabNavigator.getSelectedTabComponent<BasePane>().handleKeyDown(e)
    ) {
      return
    }
    if (e.code === KeyCodes.LEFT || e.code === KeyCodes.RIGHT) {
      const pos = e.code === KeyCodes.LEFT ? -1 : 1
      const nextCharacterIndex =
        this.matrixModel.getCharacterIndexById(this.characterId) + pos
      const taxonIndex = this.matrixModel.getTaxonIndexById(this.taxonId)
      window.dispatchEvent(
        GoToCellEvents.create(taxonIndex, nextCharacterIndex, true)
      )
    } else {
      if (e.code === KeyCodes.UP || e.code === KeyCodes.DOWN) {
        const pos = e.code === KeyCodes.UP ? -1 : 1
        const nextTaxonIndex =
          this.matrixModel.getTaxonIndexById(this.taxonId) + pos
        const characterIndex = this.matrixModel.getCharacterIndexById(
          this.characterId
        )
        window.dispatchEvent(
          GoToCellEvents.create(nextTaxonIndex, characterIndex, true)
        )
      }
    }
  }

  /**
   * Handles when the user selected a cell.
   * @param e event to go to a cell
   */
  protected onCellSelection(e: CustomEvent<GoToCellEvent>) {
    // Only update the cell dialog when the cell is highlighted and the character and taxon
    // are specified. This is to ensure that all highlighted cells are displayed in the
    // cell dialog.
    const characterIndex = e.detail.characterIndex
    const taxonIndex = e.detail.taxonIndex
    if (taxonIndex >= 0 && characterIndex >= 0 && e.detail.highlight) {
      const partitionCharacters = this.matrixModel.getPartitionCharacters()
      const nextCharacter = partitionCharacters[characterIndex]
      if (nextCharacter) {
        this.characterId = nextCharacter.getId()
      }
      const partitionTaxa = this.matrixModel.getPartitionTaxa()
      const nextTaxon = partitionTaxa[taxonIndex]
      if (nextTaxon) {
        this.taxonId = nextTaxon.getId()
        this.hasAccess = nextTaxon.hasAccess(
          this.matrixModel.getProjectProperties()
        )
      }
      this.redraw()
    }
  }

  /**
   * Redraws the cell dialog
   */
  redraw() {
    this.tabNavigator.clearTabs()
    const character = this.matrixModel.getCharacters().getById(this.characterId)
    const type = character!.getType()
    if (type === CharacterType.DISCRETE) {
      this.tabNavigator.addTab(
        'Scoring & Status',
        new ScoringPane(
          this.matrixModel,
          this.taxonId,
          this.characterId,
          this.hasAccess,
          this.savingLabel
        )
      )
    } else {
      const title =
        type === CharacterType.CONTINUOUS
          ? 'Continuous Data & Status'
          : 'Mestic Data & Status'
      this.tabNavigator.addTab(
        title,
        new ContinousDataPane(
          this.matrixModel,
          this.taxonId,
          this.characterId,
          this.hasAccess,
          this.savingLabel
        )
      )
    }
    this.tabNavigator.addTab(
      'Notes',
      new NotesPane(
        this.matrixModel,
        this.taxonId,
        this.characterId,
        this.hasAccess,
        this.savingLabel
      )
    )
    this.tabNavigator.addTab(
      'Media',
      new MediaPane(
        this.matrixModel,
        this.taxonId,
        this.characterId,
        this.hasAccess,
        this.savingLabel
      )
    )
    this.tabNavigator.addTab(
      'Citations',
      new CitationsPane(
        this.matrixModel,
        this.taxonId,
        this.characterId,
        this.hasAccess,
        this.savingLabel
      )
    )
    this.tabNavigator.addTab(
      'Comments',
      new CommentsPane(
        this.matrixModel,
        this.taxonId,
        this.characterId,
        this.hasAccess,
        this.savingLabel
      )
    )
    this.tabNavigator.addTab(
      'Changes',
      new ChangelogPane(
        this.matrixModel,
        this.taxonId,
        this.characterId,
        this.hasAccess,
        this.savingLabel
      )
    )
    this.tabNavigator.setSelectedTabIndex(CellDialog.LAST_SELECTED_TAB_INDEX)
    this.updateCellName()

    // If there's a warning and we have access to the taxa, let's update the scored on timestamp
    if (
      this.hasAccess &&
      character!.getLastScoredOn() < character!.getLastChangedOn()
    ) {
      this.matrixModel.logCellCheck([this.taxonId], [this.characterId])
    }
  }

  /**
   * Updates the last selected tab index.
   */
  updateLastSelectedTabIndex() {
    CellDialog.LAST_SELECTED_TAB_INDEX = this.tabNavigator.getSelectedTabIndex()
  }

  /**
   * Update the cells's name from the model
   */
  protected updateCellName() {
    const taxon = this.matrixModel.getTaxa().getById(this.taxonId)
    const character = this.matrixModel.getCharacters().getById(this.characterId)
    const cellNameElement = this.getElementByClass('cell-name')
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const taxonName =
      '[Taxon ' +
      (taxon!.getNumber() - numberingMode) +
      '] ' +
      taxon!.getDisplayName()
    const characterName =
      '  [Character ' +
      (character!.getNumber() - numberingMode) +
      '] ' +
      mb.htmlEscape(character!.getName())
    const accessText = this.hasAccess
      ? 'Now Editing'
      : '&#128274;This row is locked for you (you cannot edit).'
    cellNameElement.innerHTML =
      '<b>' +
      accessText +
      '</b><br/><span class="taxonName ">' +
      taxonName +
      '</span><br/><span class="characterName">' +
      characterName +
      '</span>'
  }

  /** @return The HTML content of the dialog */
  static htmlContent(): string {
    return '<div class="cell-name"></div>'
  }
}

/**
 * Base pane which all of the panes inherit from.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 * @param hasAccess Whether the user has access to the cell
 * @param savingLabel the saving label associated with this dialog
 */
class BasePane extends Component {
  protected constructor(
    protected matrixModel: MatrixModel,
    protected taxonId: number,
    protected characterId: number,
    protected hasAccess: boolean,
    protected savingLabel: SavingLabel
  ) {
    super()
  }

  /**
   * Handles when the key down event is triggered on the dialog
   * @param e The event that triggerd this callback.
   * @return Whether this function handle the event.
   */
  handleKeyDown(e: KeyboardEvent): boolean {
    return false
  }
}

/**
 * Scoring pane. This is the pane used to score the cell.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 * @param hasAccess Whether the user has access to the cell
 * @param savingLabel the saving label associated with this dialog
 */
class ScoringPane extends BasePane {
  /**
   * This represents cells states that should be on the only value.
   */
  static SINGLE_CELL_STATES: (number | null)[] = [
    null,
    /* ? */
    -1,
    /* NPA */
    0,
  ]
  private selectedCellStateIds: (number | null)[]
  private cellStateSavingPromise: Promise<void>
  private scoringGridTable: DataGridTable
  private scoringCheckboxes: Checkbox[]
  private statusSelect: Dropdown
  private polymorphicSelect: Dropdown

  constructor(
    matrixModel: MatrixModel,
    taxonId: number,
    characterId: number,
    hasAccess: boolean,
    savingLabel: SavingLabel
  ) {
    super(matrixModel, taxonId, characterId, hasAccess, savingLabel)
    this.cellStateSavingPromise = Promise.resolve()

    this.scoringGridTable = new DataGridTable()
    this.scoringGridTable.setFocusable(false)
    this.registerDisposable(this.scoringGridTable)

    this.scoringCheckboxes = []

    this.statusSelect = new Dropdown()
    this.registerDisposable(this.statusSelect)

    this.polymorphicSelect = new Dropdown()
    this.registerDisposable(this.polymorphicSelect)
  }

  /**
   * @return The HTML content of the scoring pane
   */
  static htmlContent(): string {
    return (
      '' +
      '<div class="scoringGrid"></div>' +
      '<div class="scoringWarning"></div>' +
      '<div class="polymorphicControl">' +
      '<div class="field">Multistate Taxa</div>' +
      '</div>' +
      '<div class="statusControl">' +
      '<div class="field">Status</div>' +
      '</div>'
    )
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = ScoringPane.htmlContent()
    element.classList.add('scoringPane')
    this.scoringGridTable.addColumn('&nbsp;')
    this.scoringGridTable.addColumn('#')
    this.scoringGridTable.addColumn('State')

    const scoringGridElement =
      this.getElementByClass<HTMLElement>('scoringGrid')
    this.scoringGridTable.render(scoringGridElement)
    if (!this.hasAccess) {
      scoringGridElement.title = CellDialog.LOCKED_MESSAGE
    }
    const statusOptions = CellInfo.STATUS_OPTIONS
    for (const name in statusOptions) {
      this.statusSelect.addItem({ text: name, value: statusOptions[name] })
    }
    const statusControlElement = this.getElementByClass('statusControl')
    this.statusSelect.render(statusControlElement)
    this.statusSelect.setEnabled(this.hasAccess)
    const polymorphicOptions = CellInfo.POLYMORPHIC_OPTIONS
    const matrixOptions = this.matrixModel.getMatrixOptions()
    for (let name in polymorphicOptions) {
      const value = polymorphicOptions[name]
      if (value === matrixOptions.getDefaultMultiStateTaxaMode()) {
        name += ' (default)'
      }
      this.polymorphicSelect.addItem({ text: name, value: value })
    }
    const polymorphicControlElement =
      this.getElementByClass('polymorphicControl')
    this.polymorphicSelect.render(polymorphicControlElement)
    this.polymorphicSelect.setEnabled(this.hasAccess)
    this.updateCellScores()
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(this.statusSelect, EventType.CHANGE, () =>
        this.handleStatusChange()
      )
      .listen(this.polymorphicSelect, EventType.CHANGE, () =>
        this.handlePolymorphismChange()
      )
      .listen(
        this.matrixModel,
        CellsChangedEvents.TYPE,
        (e: CustomEvent<CellsChangedEvent>) => this.handleCellsChangeEvent(e)
      )
      .listen(
        this.matrixModel,
        CharacterRefreshedEvents.TYPE,
        (e: CustomEvent<CharacterRefreshedEvent>) =>
          this.handleCharacterRefreshedEvent(e)
      )
      .listen(
        this.matrixModel,
        CharacterChangedEvents.TYPE,
        (e: CustomEvent<CharacterChangedEvent>) =>
          this.handleCharacterChangedEvent(e)
      )
      .listen(this.scoringGridTable, MobileFriendlyClickEventType, (e: Event) =>
        this.handleGridSelect(e)
      )
      .listen(this.getElement(), EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.handleKeyDown(e)
      )
  }

  /** Render the cell's scores */
  updateCellScores() {
    this.scoringGridTable.clearRows()

    // clear out the previous checkboxes
    for (let x = 0; x < this.scoringCheckboxes.length; x++) {
      const checkbox = this.scoringCheckboxes[x]
      checkbox.dispose()
    }
    this.scoringCheckboxes = []
    const cells = this.matrixModel.getCells()

    // get cell status
    const cellInfo = cells.getCellInfo(this.taxonId, this.characterId)
    const cellStatus = cellInfo.getStatus()
    this.statusSelect.setSelectedIndex(cellStatus / 50)

    // get cell scores
    const cellStates = cells.getCell(this.taxonId, this.characterId)
    const cellStateIds: number[] = []
    let isNPA = false
    let isNotApplicable = false
    for (let x = 0; x < cellStates.length; x++) {
      const cellState = cellStates[x]
      cellStateIds.push(cellState.getStateId())

      // Update whether the scores contains NPA or Not Applicable score.
      isNPA = isNPA || (cellState.getStateId() === 0 && cellState.isNPA())
      isNotApplicable =
        isNotApplicable || (cellState.getStateId() === 0 && !cellState.isNPA())
    }

    // set the certainty
    this.updatePolymorphicSelect()
    const characters = this.matrixModel.getCharacters()
    const character = characters.getById(this.characterId)
    const characterStates = character!.getStates()
    const handler = this.getHandler()
    const rows: DataRow[] = []
    for (let x = 0; x < characterStates.length; x++) {
      const characterState = characterStates[x]
      const characterStateId = characterState.getId()
      const checkbox = this.createCheckBox(
        mb.contains(cellStateIds, characterStateId)
      )
      this.scoringGridTable.registerDisposable(checkbox)
      this.scoringCheckboxes.push(checkbox)
      const row = {
        labels: [
          checkbox,
          characterState.getNumber(),
          mb.htmlEscape(characterState.getName()),
        ],
        data: { stateid: characterStateId },
      }
      rows.push(row)
    }

    // not defined score
    const notDefinedCheckbox = this.createCheckBox(cellStateIds.length === 0)
    this.scoringCheckboxes.push(notDefinedCheckbox)
    rows.push({
      labels: [notDefinedCheckbox, '?', '?'],
      data: { stateid: null },
    })

    // not applicable score
    const notApplicableCheckbox = this.createCheckBox(isNotApplicable)
    this.scoringCheckboxes.push(notApplicableCheckbox)
    rows.push({
      labels: [notApplicableCheckbox, '-', '-'],
      data: { stateid: 0 },
    })

    // NPA score
    const NPACheckbox = this.createCheckBox(isNPA)
    this.scoringCheckboxes.push(NPACheckbox)
    rows.push({
      labels: [
        NPACheckbox,
        'NPA',
        'Not presently available (= ? in nexus file)',
      ],
      data: { stateid: -1 },
    })
    this.scoringGridTable.addRows(rows)
    this.scoringGridTable.redraw()

    // Attach events after the grid is rendered.
    for (let x = 0; x < characterStates.length; x++) {
      const characterState = characterStates[x]
      const characterStateId = characterState.getId()
      const checkbox = this.scoringCheckboxes[x]
      handler.listen(checkbox, EventType.CHANGE, () =>
        this.handleCheckboxSelect(characterStateId, checkbox)
      )
    }
    handler.listen(notDefinedCheckbox, EventType.CHANGE, () =>
      this.handleCheckboxSelect(null, notDefinedCheckbox)
    )
    handler.listen(notApplicableCheckbox, EventType.CHANGE, () =>
      this.handleCheckboxSelect(0, notApplicableCheckbox)
    )
    handler.listen(NPACheckbox, EventType.CHANGE, () =>
      this.handleCheckboxSelect(-1, NPACheckbox)
    )

    // We also have to display a warning to the user to inform that of polymorphic scores which have "-" and another
    // state. This is usually not the intention of the user so we want to make sure that they are aware of the change.
    const hasPolymorphicScores =
      cellStates.length > 1 &&
      cellStates.some((state) => state.getStateId() === 0)
    const scoringWarningElement = this.getElementByClass('scoringWarning')
    if (scoringWarningElement.childNodes.length === 0 && hasPolymorphicScores) {
      const polymorphicWarningElement = document.createElement('span')
      polymorphicWarningElement.innerHTML =
        'This score is polymorphic e.g, (-,1). Thus the matrix will not load in Mesquite.'
      scoringWarningElement.appendChild(polymorphicWarningElement)
    } else {
      if (
        scoringWarningElement.childNodes.length > 0 &&
        !hasPolymorphicScores
      ) {
        mb.removeChildren(scoringWarningElement)
      }
    }
  }

  /**
   * Scores the cell.
   *
   * @param stateId the id of the state to set in this matrix.
   * @param targetCheckbox The event that triggered this callback.
   */
  handleCheckboxSelect(stateId: number | null, targetCheckbox: Checkbox) {
    const enableScore = targetCheckbox.isChecked()
    this.setCellScore(stateId, enableScore, targetCheckbox)
  }

  /**
   * Handles when the grid has been double-clicked.
   *
   * @param e The event that triggered this callback.
   */
  private handleGridSelect(e: Event) {
    const target = <HTMLElement>e.target
    const tr = mb.getElementParent(target.parentElement, 'TR')
    if (tr == null) {
      return
    }

    const table = <HTMLElement>tr.parentElement
    const index = Array.prototype.indexOf.call(table.children, tr)
    const targetCheckbox = this.scoringCheckboxes[index]
    if (!targetCheckbox.isEnabled()) {
      return
    }

    const enableScore = !targetCheckbox.isChecked()
    targetCheckbox.setChecked(enableScore)
    targetCheckbox.dispatchEvent(new Event(EventType.CHANGE))
  }

  /**
   * Handles when the status select has been changed.
   */
  private handleStatusChange() {
    const statusSelectValue = parseInt(
      this.statusSelect.getSelectedValue(),
      10
    ) as CellInfoStatus
    this.savingLabel.saving()
    this.matrixModel
      .setCellNotes(
        [this.taxonId],
        [this.characterId],
        undefined,
        statusSelectValue
      )
      .then(() => {
        this.savingLabel.saved()
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
      })
  }

  /**
   * Handles when the polymorphism select has been changed.
   */
  private handlePolymorphismChange() {
    const selectedValue = parseInt(
      this.polymorphicSelect.getSelectedValue(),
      10
    )
    const cells = this.matrixModel.getCells()
    const cellStates = cells.getCell(this.taxonId, this.characterId)

    // If there is only one score and the user seleced an uncertain state, let's end early
    // since the server will not set a single score as uncertain.
    if (cellStates.length < 2 && selectedValue) {
      this.savingLabel.info('Not Saved')
      return
    }
    const options = { uncertain: selectedValue }

    // Get existing cells state ids
    const cellStateIds = this.getSelectedCellStateIds()
    this.savingLabel.saving()
    this.matrixModel
      .setCellStates([this.taxonId], [this.characterId], cellStateIds, options)
      .then(() => this.savingLabel.saved())
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
      })
      .finally(() => this.updatePolymorphicSelect())
  }

  /**
   * Handles when cells have been changed. This resets the selected cell state ids.
   */
  private handleCellsChangeEvent(e: CustomEvent<CellsChangedEvent>) {
    if (
      mb.contains(e.detail.taxaIds, this.taxonId) &&
      mb.contains(e.detail.characterIds, this.characterId)
    ) {
      this.selectedCellStateIds = []
    }
  }

  /**
   * Handles when characters have been refreshed. This will redraw the characters states.
   */
  private handleCharacterRefreshedEvent(
    e: CustomEvent<CharacterRefreshedEvent>
  ) {
    const charcterIds = e && e.detail.characterIds
    if (charcterIds && mb.contains(charcterIds, this.characterId)) {
      this.updateCellScores()
    }
  }

  /**
   * Handles when characters have been changed. This will redraw the characters states.
   */
  private handleCharacterChangedEvent(e: CustomEvent<CharacterChangedEvent>) {
    const charcterIds = e && e.detail.characterIds
    if (charcterIds && mb.contains(charcterIds, this.characterId)) {
      this.updateCellScores()
    }
  }

  override handleKeyDown(e: KeyboardEvent) {
    // The user must hold down the CTRL + ALT keys, otherwise this is not a shortcut.
    if (!e.ctrlKey || !e.altKey) {
      return false
    }
    let index = -1
    if (e.code.startsWith('Digit')) {
      index = parseInt(e.key, 10)
    } else {
      if (e.code === KeyCodes.SPACE) {
        index = this.scoringCheckboxes.length - 3
      } else {
        if (e.code === KeyCodes.DASH) {
          index = this.scoringCheckboxes.length - 2
        } else {
          if (e.code === KeyCodes.N) {
            index = this.scoringCheckboxes.length - 1
          }
        }
      }
    }
    if (index < 0 || this.scoringCheckboxes.length <= index) {
      return false
    }
    const targetCheckbox = this.scoringCheckboxes[index]
    if (!targetCheckbox.isEnabled()) {
      return false
    }
    const enableScore = !targetCheckbox.isChecked()
    targetCheckbox.setChecked(enableScore)
    targetCheckbox.dispatchEvent(new Event(EventType.CHANGE))
    return true
  }

  /**
   * Updates the cell score based on whether the user enabled or disabled a given state.
   *
   * @param stateId The state id to add or remove based on the enableScore parameter.
   * @param enableScore Whether to insert or remove the stateId
   * @param checkbox The checkbox of the state to update
   */
  setCellScore(
    stateId: number | null,
    enableScore: boolean,
    checkbox: Checkbox
  ) {
    // Get from the checkboxs rather than the cells.
    this.selectedCellStateIds = this.getSelectedCellStateIds()
    let rollback = () => {}

    // This determines whether the next state should be single such that it is the
    // only seletected state.
    const shouldNextStateBeSingle =
      stateId === null ||
      /* ? */
      stateId === -1

    /* NPA */

    // This determines whether the new transition should be marked indicates that
    // the currently selected score be single such that it is the only selected
    // state. This happens when the previous state was "?" or "NPA".
    const wasSingleState =
      this.selectedCellStateIds.length === 1 &&
      (this.selectedCellStateIds[0] === null ||
        this.selectedCellStateIds[0] === -1)
    const shouldSelectSingleState =
      this.selectedCellStateIds.length == 0 || wasSingleState
    if (shouldNextStateBeSingle || shouldSelectSingleState) {
      this.selectedCellStateIds = [stateId]
      rollback = () => this.setCheckedAll(this.setUnCheckedAll())
    } else {
      if (enableScore) {
        this.selectedCellStateIds.push(stateId)
      } else {
        mb.remove(this.selectedCellStateIds, stateId)
      }
    }
    const options: { [key: string]: number } = {}
    const isUncertain = parseInt(this.polymorphicSelect.getSelectedValue(), 10)
    if (this.selectedCellStateIds.length > 1 && isUncertain) {
      options['uncertain'] = isUncertain
    }

    // If the user selection is a single score which is a valid state and "-", we
    // don't want to save it since it's not a valid state combination.
    if (
      isUncertain &&
      !shouldNextStateBeSingle &&
      this.selectedCellStateIds.length === 1
    ) {
      this.savingLabel.info('Not Saved')
      return
    }

    // Assign the local variable here so that the instance variable can be reassigned and will not be
    // affected by the later calls to setCellStates.
    const selectedCellStateIds = this.selectedCellStateIds
    this.savingLabel.saving()
    this.cellStateSavingPromise = this.cellStateSavingPromise
      .then(() =>
        this.matrixModel.setCellStates(
          [this.taxonId],
          [this.characterId],
          selectedCellStateIds,
          options
        )
      )
      .then(() => {
        this.ensureAtLeastOneCheckboxIsChecked()
        this.savingLabel.saved()
      })
      .catch((e) => {
        rollback()
        checkbox.setChecked(!enableScore)
        this.savingLabel.failed()
        alert(e)

        // Return a resolved promise so that future successful calls will not
        // keep the previous error and continue to display the error alert.
        return Promise.resolve()
      })
      .finally(() => {
        // This call with change to saved state back to polymorphic if the user a "?" or a "NPA"
        // state so that it's consistent.
        if (shouldNextStateBeSingle) {
          this.updatePolymorphicSelect()
        }
      })
  }

  /**
   * @return Returns the selected cell state ids.
   */
  getSelectedCellStateIds(): (number | null)[] {
    if (!this.selectedCellStateIds) {
      const cells = this.matrixModel.getCells()
      const cellStates = cells.getCell(this.taxonId, this.characterId)
      this.selectedCellStateIds = []
      for (let x = 0; x < cellStates.length; x++) {
        const cellState = cellStates[x]
        this.selectedCellStateIds.push(
          cellState.isNPA() ? -1 : cellState.getStateId()
        )
      }
    }
    return this.selectedCellStateIds
  }

  /**
   * Update the polymorphic select based on the cell states.
   */
  updatePolymorphicSelect() {
    const cells = this.matrixModel.getCells()
    const cellStates = cells.getCell(this.taxonId, this.characterId)
    const uncertainIndex =
      cellStates.length > 0 && cellStates[0].isUncertain() ? 1 : 0
    this.polymorphicSelect.setSelectedIndex(uncertainIndex)
    this.polymorphicSelect.setEnabled(this.hasAccess)
  }

  /**
   * Create a checkbox.
   *
   * @param isChecked Whether the checkbox is currently selected.
   */
  createCheckBox(isChecked: boolean): Checkbox {
    const checkbox = new Checkbox(1)
    checkbox.setChecked(isChecked)
    checkbox.setEnabled(this.hasAccess)
    return checkbox
  }

  /**
   * Uncheck all checkboxes
   * @return The indices of the checkboxes which were previously checked.
   */
  setUnCheckedAll(): number[] {
    const checkedIndices: number[] = []
    for (let x = 0; x < this.scoringCheckboxes.length; x++) {
      const checkbox = this.scoringCheckboxes[x]
      if (checkbox.isChecked()) {
        checkedIndices.push(x)
      }
      checkbox.setChecked(false)
    }
    return checkedIndices
  }

  /**
   * Check the checkboxes in the indices.
   * @param indices the indices to check.
   */
  setCheckedAll(indices: number[]) {
    for (let x = 0; x < indices.length; x++) {
      const checkbox = this.scoringCheckboxes[indices[x]]
      checkbox.setChecked(true)
    }
  }

  /**
   * Ensure that at least one checkbox is checked.
   */
  ensureAtLeastOneCheckboxIsChecked() {
    // make sure that at least one checkbox is checked
    const checkBoxLength = this.scoringCheckboxes.length
    for (let x = 0; x < checkBoxLength; x++) {
      const checkbox = this.scoringCheckboxes[x]
      if (checkbox.isChecked()) {
        return
      }
    }

    // check the "?" checkbox which is the third to last one.
    this.scoringCheckboxes[checkBoxLength - 3].setChecked(true)
  }
}

/**
 * Continuous data pane. This is the pane used to score the cell.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 * @param hasAccess Whether the user has access to the cell
 * @param savingLabel the saving label associated with this dialog
 */
class ContinousDataPane extends BasePane {
  private statusSelect: Dropdown

  constructor(
    matrixModel: MatrixModel,
    taxonId: number,
    characterId: number,
    hasAccess: boolean,
    savingLabel: SavingLabel
  ) {
    super(matrixModel, taxonId, characterId, hasAccess, savingLabel)
    this.statusSelect = new Dropdown()
    this.registerDisposable(this.statusSelect)
  }

  /**
   * @return The HTML content of the scoring pane
   */
  static htmlContent(character: Character): string {
    const isContinuous = character.getType() === CharacterType.CONTINUOUS
    let text = '<div class="scoringPane">'
    if (isContinuous) {
      text +=
        '<div class="value-control">' +
        '<div class="label">Start value: </div><input type="text" class="start-input" size="20"/>' +
        '</div>' +
        '<div class="value-control">' +
        '<div class="label">End value: </div><input type="text" class="end-input" size="20"/>' +
        '</div>'
    } else {
      text +=
        '<div class="value-control">' +
        '<div class="label">Value: </div><input type="text" class="start-input" size="20"/>' +
        '</div>'
    }
    text +=
      '<div class="statusControl">' +
      '<div class="label">Status</div>' +
      '</div></div>'
    return text
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    const character = this.matrixModel.getCharacters().getById(this.characterId)
    element.innerHTML = ContinousDataPane.htmlContent(character)
    const statusOptions = CellInfo.STATUS_OPTIONS
    for (let name in statusOptions) {
      this.statusSelect.addItem({ text: name, value: statusOptions[name] })
    }
    const cells = this.matrixModel.getCells()
    const cellInfo = cells.getCellInfo(this.taxonId, this.characterId)
    const cellStates = cells.getCell(this.taxonId, this.characterId)
    const cellStatus = cellInfo.getStatus()
    this.statusSelect.setSelectedIndex(cellStatus / 50)
    const statusControlElement = this.getElementByClass('statusControl')
    this.statusSelect.render(statusControlElement)
    this.statusSelect.setEnabled(this.hasAccess)
    let startValue
    let endValue
    if (cellStates.length > 0 && cellStates[0].hasNumericValues()) {
      startValue = cellStates[0].getNumericStartValue()
      endValue = cellStates[0].getNumericEndValue()
    }
    const startInputElement =
      this.getElementByClass<HTMLInputElement>('start-input')
    startInputElement.value = String(startValue)
    startInputElement.disabled = !this.hasAccess
    if (character!.getType() === CharacterType.CONTINUOUS) {
      const endInputElement =
        this.getElementByClass<HTMLInputElement>('end-input')
      endInputElement.value = String(endValue)
      endInputElement.disabled = !this.hasAccess
    }
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    const startInputElement = this.getElementByClass('start-input')
    handler
      .listen(this.statusSelect, EventType.CHANGE, () =>
        this.handleStatusChange()
      )
      .listen(startInputElement, EventType.CHANGE, () =>
        this.handleValueChange()
      )
    const character = this.matrixModel.getCharacters().getById(this.characterId)
    if (character!.getType() == CharacterType.CONTINUOUS) {
      const endInputElement = this.getElementByClass('end-input')
      handler.listen(endInputElement, EventType.CHANGE, () =>
        this.handleValueChange()
      )
    }
  }

  /**
   * Handles when the status select has been changed.
   */
  handleStatusChange() {
    const statusSelectValue = parseInt(
      this.statusSelect.getSelectedValue(),
      10
    ) as CellInfoStatus
    this.savingLabel.saving()
    this.matrixModel
      .setCellNotes(
        [this.taxonId],
        [this.characterId],
        undefined,
        statusSelectValue
      )
      .then(() => {
        this.savingLabel.saved()
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
      })
  }

  /**
   * Handles when the status select has been changed.
   */
  handleValueChange() {
    const startInputElement =
      this.getElementByClass<HTMLInputElement>('start-input')
    const start = mb.isEmptyOrWhitespace(startInputElement.value)
      ? null
      : parseFloat(startInputElement.value)
    if (start !== null && isNaN(start)) {
      alert('Start value must be a number')
      return
    }
    const endInputElement =
      this.getElementByClass<HTMLInputElement>('end-input')
    const end = mb.isEmptyOrWhitespace(endInputElement.value)
      ? null
      : parseFloat(endInputElement.value)
    if (end !== null && isNaN(end)) {
      alert('End value must be a number')
      return
    }
    if (start === null && end !== null) {
      alert('Start must be defined if End value is defined.')
      return
    }
    if (start !== null && end !== null && start > end) {
      alert('Start must be less than the end value.')
      return
    }
    this.savingLabel.saving()
    this.matrixModel
      .setContinuousValues([this.taxonId], [this.characterId], start, end)
      .then(() => {
        this.savingLabel.saved()
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
      })
  }
}

/**
 * Notes pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 * @param hasAccess Whether the user has access to the cell
 * @param savingLabel the saving label associated with this dialog
 */
class NotesPane extends BasePane {
  constructor(
    matrixModel: MatrixModel,
    taxonId: number,
    characterId: number,
    hasAccess: boolean,
    savingLabel: SavingLabel
  ) {
    super(matrixModel, taxonId, characterId, hasAccess, savingLabel)
  }

  override createDom() {
    super.createDom()
    const cellInfo = this.matrixModel
      .getCells()
      .getCellInfo(this.taxonId, this.characterId)
    const notes = cellInfo.getNotes() || ''
    const element = this.getElement()
    element.innerHTML = NotesPane.htmlContent(notes)
    const notesElement =
      this.getElementByClass<HTMLTextAreaElement>('notesArea')
    notesElement.disabled = !this.hasAccess
  }

  override enterDocument() {
    super.enterDocument()
    const notesElement = this.getElementByClass('notesArea')
    this.getHandler()
      .listen(notesElement, EventType.BLUR, () => this.saveNotes())
      .listen(notesElement, EventType.KEYDOWN, (e: Event) =>
        this.onHandleKeyDown(e)
      )
  }

  /**
   * Save the notes if they were changed.
   */
  saveNotes() {
    const notesElement =
      this.getElementByClass<HTMLTextAreaElement>('notesArea')
    const newNotes = notesElement.value
    const cellInfo = this.matrixModel
      .getCells()
      .getCellInfo(this.taxonId, this.characterId)
    if (newNotes === cellInfo.getNotes()) {
      return
    }
    this.savingLabel.saving()
    this.matrixModel
      .setCellNotes([this.taxonId], [this.characterId], newNotes)
      .then(() => {
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
   * @param e The event that triggerd this callback.
   */
  protected onHandleKeyDown(e: Event) {
    // Don't propagate events and only stay in the text area.
    e.stopPropagation()
  }

  /**
   * The pane's HTML Content
   * @return HTML content
   */
  static htmlContent(notes: string): string {
    return (
      '<textarea class="notesArea" maxlength="65535">' + notes + '</textarea>'
    )
  }
}

/**
 * Media pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 * @param hasAccess Whether the user has access to the cell
 * @param savingLabel the saving label associated with this dialog
 */
class MediaPane extends BasePane {
  /**
   * Key to use to store in the user settings storage.
   */
  protected static AUTO_OPEN_MEDIA_WINDOW: string = 'autoOpenMediaWindow'
  private mediaGrid: MediaGrid
  private openMediaCheckbox: Checkbox

  constructor(
    matrixModel: MatrixModel,
    taxonId: number,
    characterId: number,
    hasAccess: boolean,
    savingLabel: SavingLabel
  ) {
    super(matrixModel, taxonId, characterId, hasAccess, savingLabel)
    this.mediaGrid = new MediaGrid()
    this.mediaGrid.setRemoveable(this.hasAccess)
    this.registerDisposable(this.mediaGrid)
    this.openMediaCheckbox = new Checkbox(1)
    this.registerDisposable(this.openMediaCheckbox)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = MediaPane.htmlContent()
    this.setMediaInGrid()
    const mediaPane = this.getElementByClass('mediaPane')
    this.mediaGrid.render(mediaPane)
    const openMediaElement = this.getElementByClass('openMediaWindowCheckbox')
    this.openMediaCheckbox.render(openMediaElement)
    const settingsStorage = this.matrixModel.getUserMatrixSettings()
    const isAutoOpenMediaWindowSelected = !!settingsStorage.get(
      MediaPane.AUTO_OPEN_MEDIA_WINDOW
    )
    this.openMediaCheckbox.setChecked(isAutoOpenMediaWindowSelected)
    if (isAutoOpenMediaWindowSelected) {
      setTimeout(() => this.handleAddCellMedia, 350)
    }
    if (!this.hasAccess) {
      const addTaxonMediaElement =
        this.getElementByClass<HTMLElement>('addCellMedia')
      addTaxonMediaElement.title = CellDialog.LOCKED_MESSAGE
      addTaxonMediaElement.classList.add('disabled')
      this.openMediaCheckbox.setEnabled(false)
    }
  }

  override enterDocument() {
    super.enterDocument()
    const addTaxonMediaElement = this.getElementByClass('addCellMedia')
    this.getHandler().listen(
      this.mediaGrid,
      MobileFriendlyClickEventType,
      (e: CustomEvent<MediaGridItemEvent>) => this.handleDoubleClickCellMedia(e)
    )
    if (this.hasAccess) {
      this.getHandler()
        .listen(addTaxonMediaElement, EventType.CLICK, () =>
          this.handleAddCellMedia()
        )
        .listen(this.openMediaCheckbox, EventType.CHANGE, () =>
          this.handleMediaCheckboxChange()
        )
        .listen(this.mediaGrid, EventType.CUT, (e: CustomEvent<any>) =>
          this.removeMedia(e)
        )
    }
  }

  /**
   * Handles when the cut event on the media grid. This is when the user wants to remove the media from the taxon.
   *
   * @param e The event that triggered this callback.
   */
  protected removeMedia(e: CustomEvent) {
    const mediaId = parseInt(e.detail.item.id, 10)
    const cellInfo = this.matrixModel
      .getCells()
      .getCellInfo(this.taxonId, this.characterId)
    if (cellInfo.getCitationCount()) {
      const confirmText =
        "You are deleting cell media, do you wish to retain the media's citation <citations> with this cell."
      const confirmDialog = new CancelableConfirmDialog(
        'Delete media',
        confirmText,
        (shouldCopyCitations) =>
          this.removeCellMedia(mediaId, shouldCopyCitations)
      )
      confirmDialog.setVisible(true)
    } else {
      this.removeCellMedia(mediaId, false)
    }
  }

  /**
   * Actually removes the media
   *
   * @param mediaId The id of the media to remove
   * @param shouldCopyCitations whether we should copy the media's citations
   */
  protected removeCellMedia(mediaId: number, shouldCopyCitations: boolean) {
    this.savingLabel.saving()
    this.matrixModel
      .removeCellMedia(
        this.taxonId,
        this.characterId,
        mediaId,
        shouldCopyCitations
      )
      .then(() => {
        this.setMediaInGrid()
        this.mediaGrid.redraw()
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /** Sets the media the in media grid */
  setMediaInGrid() {
    this.mediaGrid.clear()
    const cellInfo = this.matrixModel
      .getCells()
      .getCellInfo(this.taxonId, this.characterId)
    const cellMedia = cellInfo.getMedia()
    for (let x = 0; x < cellMedia.length; x++) {
      const cellMedium = cellMedia[x]
      const mediaItem = {
        id: cellMedium.getMediaId(),
        image: cellMedium.getTiny(),
      }
      this.mediaGrid.addItem(mediaItem)
    }
  }

  /**
   * Handles the add media event on this cell.
   */
  private handleAddCellMedia() {
    const addMediaDialog = new AddMediaDialog(
      () => this.getCellMediaItems(),
      (mediaIds) => this.saveCellMediaItems(mediaIds)
    )
    addMediaDialog.setVisible(true)
  }

  /**
   * Handles events when media are selected.
   * @param e The event that triggerd this callback.
   */
  protected handleDoubleClickCellMedia(e: CustomEvent<MediaGridItemEvent>) {
    const item = e.detail.item
    const cellInfo = this.matrixModel
      .getCells()
      .getCellInfo(this.taxonId, this.characterId)
    const medium = cellInfo.getMediaById(item.id)
    if (medium) {
      ImageViewerDialog.show('X', medium.getId())
    }
  }

  /**
   * Handles events when the open media automatically checkbox is changed.
   */
  protected handleMediaCheckboxChange() {
    const isChecked = this.openMediaCheckbox.isChecked()
    const settingsStorage = this.matrixModel.getUserMatrixSettings()
    if (isChecked) {
      settingsStorage.set(MediaPane.AUTO_OPEN_MEDIA_WINDOW, '1')
      this.handleAddCellMedia()
    } else {
      settingsStorage.remove(MediaPane.AUTO_OPEN_MEDIA_WINDOW)
    }
  }

  /**
   * @return The list of media items which are associated with this
   *		cell.
   */
  private getCellMediaItems(): Promise<MediaGridItem[]> {
    return this.matrixModel.loadTaxaMedia(this.taxonId).then((results) => {
      const cellInfo = this.matrixModel
        .getCells()
        .getCellInfo(this.taxonId, this.characterId)
      const mediaItems: MediaGridItem[] = []
      for (let x = 0; x < results.length; x++) {
        const result = results[x]
        const mediaId = parseInt(result['media_id'], 10)
        if (cellInfo.containsMediaId(mediaId)) {
          continue
        }
        const mediaItem = { id: mediaId, image: result['tiny'] }
        mediaItems.push(mediaItem)
      }
      return mediaItems
    })
  }

  /**
   * Saves the cell media
   *
   * @param mediaIds the ids of the media to add to this taxon
   * @return The promise that the media taxa was saved
   */
  private saveCellMediaItems(mediaIds: number[]): Promise<void> {
    return this.matrixModel
      .addCellMedia(this.taxonId, [this.characterId], mediaIds)
      .then(() => {
        this.setMediaInGrid()
        this.mediaGrid.redraw()
      })
  }

  /**
   * @return The HTML content for the media pane
   */
  static htmlContent(): string {
    return (
      '<span class="addCellMedia">+ Add new</span>' +
      '<span class="openMediaWindow">' +
      '<span class="openMediaWindowCheckbox"></span>' +
      'Automatically open media browser when editing' +
      '</span>' +
      '<div class="mediaPane"></div>'
    )
  }
}

/**
 * Citations pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 * @param hasAccess Whether the user has access to the cell
 * @param savingLabel the saving label associated with this dialog
 */
class CitationsPane extends BasePane {
  /**
   * The last inserted citation will be used to re-insert citations across cell dialogs.
   */
  private static lastInsertedCitation: {
    id: number
    pages: string
    notes: string
    title: string
  }
  private loadingElement: Element
  private citationsGridTable: DataGridTable

  constructor(
    matrixModel: MatrixModel,
    taxonId: number,
    characterId: number,
    hasAccess: boolean,
    savingLabel: SavingLabel
  ) {
    super(matrixModel, taxonId, characterId, hasAccess, savingLabel)
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
    if (!this.hasAccess) {
      const addCitationElement =
        this.getElementByClass<HTMLElement>('addCitation')
      addCitationElement.title = CellDialog.LOCKED_MESSAGE
      addCitationElement.classList.add('disabled')
    }
    this.loadCellCitations()
  }

  override enterDocument() {
    super.enterDocument()
    if (!this.hasAccess) {
      return
    }
    const addCitationElement = this.getElementByClass('addCitation')
    const addLastCitationElement = this.getElementByClass('addLastCitation')
    this.getHandler()
      .listen(this.citationsGridTable, EventType.CUT, (e: CustomEvent<any>) =>
        this.handleRemoveCellCitation(e)
      )
      .listen(
        this.citationsGridTable,
        EventType.SELECT,
        (e: CustomEvent<any>) => this.handleSelectCellCitation(e)
      )
      .listen(addCitationElement, EventType.CLICK, () =>
        this.handleShowAddCellCitationDialog()
      )
      .listen(addLastCitationElement, EventType.CLICK, () =>
        this.handleAddLastCellCitationDialog()
      )
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
      .then((citations) => {
        // Ensure that the cell dialog is not disposed before attempting to redraw
        // the citation grid.
        if (!this.isDisposed()) {
          this.redrawCellCitations(citations)
        }
      })
      .catch(() => alert('Failed to load cell citations'))
      .finally(() => element.removeChild(this.loadingElement))
  }

  /**
   * Handles events when citations are selected.
   * @param e The event that triggerd this callback.
   */
  protected handleSelectCellCitation(e: CustomEvent) {
    const id = parseInt(e.detail['id'], 10)
    const cellInfo = this.matrixModel
      .getCells()
      .getCellInfo(this.taxonId, this.characterId)
    const citation = cellInfo.getCitationById(id)
    if (!citation) {
      alert('The citation no longer exist')
      return
    }
    const editCitationDialog = new EditCitationDialog(
      citation,
      (pages, notes) => this.handleEditCellCitation(id, pages, notes)
    )
    editCitationDialog.setVisible(true)
  }

  /**
   * Edits an existing citation
   *
   * @param id the id of the cell citation to edit
   * @param pages the pages that this citation refers to
   * @param notes the notes about this citation
   */
  handleEditCellCitation(
    id: number,
    pages: string,
    notes: string
  ): Promise<void> {
    const cellInfo = this.matrixModel
      .getCells()
      .getCellInfo(this.taxonId, this.characterId)
    const citation = cellInfo.getCitationById(id)
    if (citation == null) {
      return Promise.resolve()
    }

    // nothing has changed so we don't have to update citation
    if (citation.getPages() === pages && citation.getNotes() === notes) {
      return Promise.resolve()
    }

    this.savingLabel.saving()
    return this.matrixModel
      .upsertCellCitation(
        this.taxonId,
        this.characterId,
        id,
        citation.getCitationId(),
        pages,
        notes
      )
      .then(() => {
        const citations = cellInfo.getCitations()
        this.redrawCellCitations(citations)
        this.savingLabel.saved()
      })
      .catch(() => {
        alert('Failed to save cell citations')
        this.savingLabel.failed()
      })
  }

  /**
   * Edits an existing citation
   *
   * @param citationId the id of the citation to add
   * @param pages the pages that this citation refers to
   * @param notes the notes about this citation
   */
  handleAddCellCitation(
    citationId: number,
    pages: string,
    notes: string
  ): Promise<void> {
    this.savingLabel.saving()
    return this.matrixModel
      .upsertCellCitation(
        this.taxonId,
        this.characterId,
        null,
        citationId,
        pages,
        notes
      )
      .then((addedCitation) => {
        const cellInfo = this.matrixModel
          .getCells()
          .getCellInfo(this.taxonId, this.characterId)
        CitationsPane.lastInsertedCitation = {
          id: addedCitation.getCitationId(),
          pages: addedCitation.getPages(),
          notes: addedCitation.getNotes(),
          title: addedCitation.getName(),
        }
        const citations = cellInfo.getCitations()
        this.redrawCellCitations(citations)
        this.savingLabel.saved()
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
        throw e
      })
  }

  /**
   * Adds the last citation used.
   */
  handleAddLastCellCitationDialog() {
    const lastCitation = CitationsPane.lastInsertedCitation
    if (lastCitation) {
      this.handleAddCellCitation(
        lastCitation.id,
        lastCitation.pages,
        lastCitation.notes
      )
    }
  }

  /**
   * Shows the add citation dialog
   */
  handleShowAddCellCitationDialog() {
    const addCitationDialog = new AddCitationDialog(
      this.matrixModel,
      (citationId, pages, notes) =>
        this.handleAddCellCitation(citationId, pages, notes)
    )
    addCitationDialog.setVisible(true)
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
        removeable: this.hasAccess,
        data: { id: citation.getId() },
      }
      rows.push(row)
    }
    this.citationsGridTable.clearRows()
    this.citationsGridTable.addRows(rows)
    this.citationsGridTable.redraw()
    const lastInsertedCitation = CitationsPane.lastInsertedCitation
    if (lastInsertedCitation && this.hasAccess) {
      const addLastCitationElement =
        this.getElementByClass<HTMLElement>('addLastCitation')
      addLastCitationElement.classList.remove('disabled')
      addLastCitationElement.title = lastInsertedCitation.title
    }
  }

  /**
   * Handles events when citations are removed.
   * @param e The event that triggerd this callback.
   */
  protected handleRemoveCellCitation(e: CustomEvent) {
    const id = parseInt(e.detail['id'], 10)
    this.savingLabel.saving()
    return this.matrixModel
      .removeCellCitation(this.taxonId, this.characterId, id)
      .then(() => {
        const cellInfo = this.matrixModel
          .getCells()
          .getCellInfo(this.taxonId, this.characterId)
        this.redrawCellCitations(cellInfo.getCitations())
        this.savingLabel.saved()
      })
      .catch(() => {
        this.savingLabel.failed()
      })
  }

  /**
   * @return The HTML content for the citations pane
   */
  static htmlContent(): string {
    return (
      '<span class="addCitation">+ Add new</span>' +
      '<span class="addLastCitation disabled">+ Add last citation used</span>' +
      '<div class="citationsPane"></div>'
    )
  }
}

/**
 * Comments pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 * @param hasAccess Whether the user has access to the cell
 * @param savingLabel the saving label associated with this dialog
 */
class CommentsPane extends BasePane {
  private loadingElement: Element
  private commentsGridTable: DataGridTable

  constructor(
    matrixModel: MatrixModel,
    taxonId: number,
    characterId: number,
    hasAccess: boolean,
    savingLabel: SavingLabel
  ) {
    super(matrixModel, taxonId, characterId, hasAccess, savingLabel)
    this.loadingElement = this.getLoadingElement()
    this.commentsGridTable = new DataGridTable()
    this.registerDisposable(this.commentsGridTable)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = CommentsPane.htmlContent()
    this.commentsGridTable.addColumn('Date/time')
    this.commentsGridTable.addColumn('User')
    this.commentsGridTable.addColumn('Comment')
    const commentsPane = this.getElementByClass('commentsPane')
    this.commentsGridTable.render(commentsPane)
    if (!this.hasAccess) {
      const addCommentElement =
        this.getElementByClass<HTMLElement>('addCellComment')
      addCommentElement.title = CellDialog.LOCKED_MESSAGE
      addCommentElement.classList.add('disabled')
    }
    this.loadCellComments()
  }

  override enterDocument() {
    super.enterDocument()
    const addCommentElement = this.getElementByClass('addCellComment')
    if (this.hasAccess) {
      this.getHandler().listen(addCommentElement, EventType.CLICK, () =>
        this.handleShowAddCellCommentDialog()
      )
    }
  }

  /**
   * @return an element which shows a loading indicator.
   */
  getLoadingElement(): Element {
    const loadingElement = document.createElement('div')
    loadingElement.classList.add('loadingComments')
    const messageElement = document.createElement('div')
    messageElement.textContent = 'Loading comments...'
    loadingElement.appendChild(messageElement)
    return loadingElement
  }

  /**
   * Loads the cell comments from the server
   */
  loadCellComments() {
    const element = this.getElement()
    element.appendChild(this.loadingElement)
    this.matrixModel
      .getCellComments(this.taxonId, this.characterId)
      .then((comments) => {
        // Ensure that the cell dialog is not disposed when attempting to redaw
        // the comments datagrid.
        if (this.isDisposed()) {
          return
        }
        this.redrawCellComments(comments)

        // Note that getCellInfo may return an empty cell info but this is a safe call because
        // a non-zero getUnreadCommentCount value indicates that the cell was not empty.
        const cellInfo = this.matrixModel
          .getCells()
          .getCellInfo(this.taxonId, this.characterId)
        if (cellInfo.getUnreadCommentCount()) {
          cellInfo.setUnreadCommentCount(0)
          this.matrixModel.dispatchEvent(
            CellsChangedEvents.create([this.taxonId], [this.characterId], true)
          )
        }
      })
      .catch(() => alert('Failed to load cell comments'))
      .finally(() => element.removeChild(this.loadingElement))
  }

  /**
   * Adds a cell comment
   * @param comment the comment to add
   */
  addCellComments(comment: string) {
    this.savingLabel.saving()
    return this.matrixModel
      .addCellComment(this.taxonId, this.characterId, comment)
      .then(() => {
        // reload comments grid
        this.loadCellComments()
        this.savingLabel.saved()
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
        throw e
      })
  }

  /**
   * Redraws the cell citations within the comment grid.
   * @param comments the comments that will be used to redraw the grid
   */
  redrawCellComments(comments: { [key: string]: any }[]) {
    // Ensure that the cell dialog is not disposed when attempting to redaw
    // the comments datagrid.
    if (this.isDisposed()) {
      return
    }
    const rows: DataRow[] = []
    for (let x = 0; x < comments.length; x++) {
      const comment = comments[x]
      const date = new Date(comment['date'] * 1000)
      const datetime = date.toLocaleString()
      const row = { labels: [datetime, comment['user'], comment['comment']] }
      rows.push(row)
    }
    this.commentsGridTable.clearRows()
    this.commentsGridTable.addRows(rows)
    this.commentsGridTable.redraw()
  }

  /**
   * Shows the comment dialog
   */
  handleShowAddCellCommentDialog() {
    const commentDialog = new AddCommentDialog((comment) =>
      this.addCellComments(comment)
    )
    commentDialog.setVisible(true)
  }

  /**
   * @return The HTML content for the comments pane
   */
  static htmlContent(): string {
    return '<span class="addCellComment">+ Add new</span><div class="commentsPane"></div>'
  }
}

/**
 * Change log pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 * @param characterId the id of the character to render for this dialog
 * @param hasAccess Whether the user has access to the cell
 * @param savingLabel the saving label associated with this dialog
 */
class ChangelogPane extends BasePane {
  private loadingElement: Element
  private changelogGridTable: DataGridTable

  constructor(
    matrixModel: MatrixModel,
    taxonId: number,
    characterId: number,
    hasAccess: boolean,
    savingLabel: SavingLabel
  ) {
    super(matrixModel, taxonId, characterId, hasAccess, savingLabel)
    this.loadingElement = this.getLoadingElement()
    this.changelogGridTable = new DataGridTable()
    this.registerDisposable(this.changelogGridTable)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('changePane')
    this.changelogGridTable.addColumn('Date/time')
    this.changelogGridTable.addColumn('User')
    this.changelogGridTable.addColumn('Changes')
    this.changelogGridTable.render(element)
    this.loadCellChanges()
  }

  /**
   * @return an element which shows a loading indicator.
   */
  getLoadingElement(): Element {
    const loadingElement = document.createElement('div')
    loadingElement.classList.add('loadingComments')
    const messageElement = document.createElement('div')
    messageElement.textContent = 'Loading change logs...'
    loadingElement.appendChild(messageElement)
    return loadingElement
  }

  /**
   * Loads the cell changes from the server
   */
  loadCellChanges() {
    const element = this.getElement()
    element.appendChild(this.loadingElement)
    this.matrixModel
      .getCellChanges(this.taxonId, this.characterId)
      .then((changes: { [key: string]: any }[]) => {
        // Ensure that the cell dialog is not disposed when attempting to redaw
        // the change datagrid.
        if (this.isDisposed()) {
          return
        }
        const rows: DataRow[] = []
        for (let x = 0; x < changes.length; x++) {
          const change = changes[x]
          const date = new Date(change['date'] * 1000)
          const datetime = date.toLocaleString()
          const row = { labels: [datetime, change['user'], change['log']] }
          rows.push(row)
        }
        this.changelogGridTable.clearRows()
        this.changelogGridTable.addRows(rows)
        this.changelogGridTable.redraw()
      })
      .catch(() => alert('Failed to load cell changes'))
      .finally(() => element.removeChild(this.loadingElement))
  }
}
