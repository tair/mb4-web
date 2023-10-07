import * as GoToCellEvents from '../../events/GoToCellEvent'
import { GoToCellEvent } from '../../events/GoToCellEvent'
import * as CellsChangedEvents from '../../events/CellsChangedEvent'
import { SavingLabel } from '../SavingLabel'
import * as mb from '../../mb'
import { MatrixModel } from '../../MatrixModel'
import { Citation } from '../../data/Citation'
import { Character, CharacterType } from '../../data/Characters'
import { CharacterChangedEvent } from '../../events/CharacterChangedEvent'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
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

  /**
   * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
   * @param taxonId the id of the taxon to render for this dialog
   * @param characterId the id of the character to render for this dialog
   */
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

  protected override createDom() {
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

  protected override enterDocument() {
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
  private redraw() {
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
  private updateLastSelectedTabIndex() {
    CellDialog.LAST_SELECTED_TAB_INDEX = this.tabNavigator.getSelectedTabIndex()
  }

  /**
   * Update the cells's name from the model
   */
  private updateCellName() {
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
  private static htmlContent(): string {
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
abstract class BasePane extends Component {
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
  private readonly scoringGridTable: DataGridTable
  private readonly statusSelect: Dropdown
  private readonly polymorphicSelect: Dropdown

  private cellStateSavingPromise: Promise<void>
  private scoringCheckboxes: Checkbox[]

  constructor(
    matrixModel: MatrixModel,
    taxonId: number,
    characterId: number,
    hasAccess: boolean,
    savingLabel: SavingLabel
  ) {
    super(matrixModel, taxonId, characterId, hasAccess, savingLabel)

    this.scoringGridTable = new DataGridTable()
    this.scoringGridTable.setFocusable(false)
    this.registerDisposable(this.scoringGridTable)

    this.statusSelect = new Dropdown()
    this.registerDisposable(this.statusSelect)

    this.polymorphicSelect = new Dropdown()
    this.registerDisposable(this.polymorphicSelect)

    this.cellStateSavingPromise = Promise.resolve()
    this.scoringCheckboxes = []
  }

  protected override createDom() {
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

  protected override enterDocument() {
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
        CharacterChangedEvents.TYPE,
        (e: CustomEvent<CharacterChangedEvent>) =>
          this.handleCharacterChangedEvent(e)
      )
      .listen(
        this.scoringGridTable,
        MobileFriendlyClickEventType,
        (e: CustomEvent<CellDataGridModel>) => this.handleGridSelect(e)
      )
      .listen(this.getElement(), EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.handleKeyDown(e)
      )
  }

  /** Render the cell scores */
  private updateCellScores() {
    this.scoringGridTable.clearRows()

    // Clear out the previous checkboxes
    this.scoringCheckboxes.forEach((checkbox) => checkbox.dispose())
    this.scoringCheckboxes = []

    // Get cell status
    const cells = this.matrixModel.getCells()
    const cellInfo = cells.getCellInfo(this.taxonId, this.characterId)
    const cellStatus = cellInfo.getStatus()
    this.statusSelect.setSelectedIndex(cellStatus / 50)

    // Get cell scores
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

    // Set the certainty
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
        characterStateId,
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
        data: <CellDataGridModel>{ position: x },
      }
      rows.push(row)
    }

    // not defined score
    const notDefinedCheckbox = this.createCheckBox(
      NaN,
      cellStateIds.length === 0
    )
    this.scoringCheckboxes.push(notDefinedCheckbox)
    rows.push({
      labels: [notDefinedCheckbox, '?', '?'],
      data: <CellDataGridModel>{ position: rows.length },
    })

    // not applicable score
    const notApplicableCheckbox = this.createCheckBox(0, isNotApplicable)
    this.scoringCheckboxes.push(notApplicableCheckbox)
    rows.push({
      labels: [notApplicableCheckbox, '-', '-'],
      data: <CellDataGridModel>{ position: rows.length },
    })

    // NPA score
    const NPACheckbox = this.createCheckBox(-1, isNPA)
    this.scoringCheckboxes.push(NPACheckbox)
    rows.push({
      labels: [
        NPACheckbox,
        'NPA',
        'Not presently available (= ? in nexus file)',
      ],
      data: <CellDataGridModel>{ position: rows.length },
    })
    this.scoringGridTable.addRows(rows)
    this.scoringGridTable.redraw()

    // Attach events after the grid is rendered.
    for (let x = 0; x < characterStates.length; x++) {
      const characterState = characterStates[x]
      const characterStateId = characterState.getId()
      const checkbox = this.scoringCheckboxes[x]
      handler.listen(checkbox, EventType.CHANGE, () =>
        this.setCellScore(checkbox)
      )
    }
    handler.listen(notDefinedCheckbox, EventType.CHANGE, () =>
      this.setCellScore(notDefinedCheckbox)
    )
    handler.listen(notApplicableCheckbox, EventType.CHANGE, () =>
      this.setCellScore(notApplicableCheckbox)
    )
    handler.listen(NPACheckbox, EventType.CHANGE, () =>
      this.setCellScore(NPACheckbox)
    )

    // We also have to display a warning to the user to inform that of
    // polymorphic scores which have "-" and another state. This is usually not
    // the intention of the user so we want to make sure that they are aware of
    // the change.
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
   * Handles when the grid has been double-clicked.
   *
   * @param e The event that triggered this callback.
   */
  private handleGridSelect(e: CustomEvent<CellDataGridModel>) {
    const position = parseInt(e.detail.position as any, 10)
    if (position === undefined) {
      return
    }

    const targetCheckbox = this.scoringCheckboxes[position]
    if (targetCheckbox == null || !targetCheckbox.isEnabled()) {
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
    const cellStateIds = this.getScoredCellStateIds()
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
   * Updates the cell score based on whether the user enabled or disabled a
   * given state.
   *
   * @param stateId The state id that should be added or removed.
   * @param checkbox The checkbox of the state to update.
   */
  private setCellScore(checkbox: Checkbox) {
    const stateId = checkbox.getValue()
    const enableScore = checkbox.isChecked()

    // Get from the checkboxs rather than the cells because we want to
    // determine which states we want to add. Note that there can be pending
    // save requests so the UI should represent the user's selection rather
    // than the matrix model.
    const scoredCellStateIds = this.getCheckedStateIds()
    mb.remove(scoredCellStateIds, stateId)

    // This determines whether the state should be a single score. This means
    // that the user selected '?' or 'NPA' as the score. We want to remove all
    // other scores when this happens.
    const shouldNextStateBeSingle = isNaN(stateId) || stateId == -1

    // This determines whether the last state was a single score. This means
    // that the last score was a '?' or 'NPA'. If so, we want to unmark these
    // in the UI.
    const wasLastStateSingle =
      scoredCellStateIds.length === 0 ||
      isNaN(scoredCellStateIds[0]) ||
      scoredCellStateIds[0] == -1

    let rollback = () => {}
    if (shouldNextStateBeSingle || wasLastStateSingle) {
      const previousStateIds = this.setUnCheckedAll(stateId)
      rollback = () => this.setCheckedAll(previousStateIds)
    }

    checkbox.setChecked(enableScore)

    // If the state is uncertain, it should have and multiple states. A single
    // state as uncertain is not a correct state combination. If the cell is
    // uncertain, the only single states that are allowed are '?' and 'NPA'.
    const isUncertain = parseInt(this.polymorphicSelect.getSelectedValue(), 10)
    if (
      isUncertain &&
      !shouldNextStateBeSingle &&
      this.getCheckedStateIds().length === 1
    ) {
      this.savingLabel.info('Not Saved')
      return
    }

    this.savingLabel.saving()
    this.cellStateSavingPromise = this.cellStateSavingPromise
      .then(() => {
        const cellStateIds =
          shouldNextStateBeSingle || wasLastStateSingle
            ? []
            : this.getScoredCellStateIds()
        if (enableScore) {
          cellStateIds.push(stateId)
        } else {
          mb.remove(cellStateIds, stateId)
        }

        const options: { [key: string]: number } = {}
        if (cellStateIds.length > 1 && isUncertain) {
          options['uncertain'] = isUncertain
        }

        return this.matrixModel.setCellStates(
          [this.taxonId],
          [this.characterId],
          cellStateIds,
          options
        )
      })
      .then(() => {
        if (this.isInDocument()) {
          this.ensureAtLeastOneCheckboxIsChecked()
          this.savingLabel.saved()
        }
      })
      .catch((e) => {
        if (this.isInDocument()) {
          rollback()
          checkbox.setChecked(!enableScore)
          this.savingLabel.failed()
        }
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
   * @return The state ids for the cells within the Matrix Model.
   */
  private getScoredCellStateIds(): number[] {
    const cells = this.matrixModel.getCells()
    const cellStates = cells.getCell(this.taxonId, this.characterId)
    const cellStateIds = []
    for (const cellState of cellStates) {
      cellStateIds.push(cellState.isNPA() ? -1 : cellState.getStateId())
    }
    return cellStateIds
  }

  /**
   * @Returns The state ids for the checkboxes that were checked.
   */
  private getCheckedStateIds(): number[] {
    const stateIds = []
    for (const checkbox of this.scoringCheckboxes) {
      if (checkbox.isChecked()) {
        stateIds.push(checkbox.getValue())
      }
    }
    return stateIds
  }

  /**
   * Update the polymorphic select based on the cell states.
   */
  private updatePolymorphicSelect() {
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
  private createCheckBox(stateId: number, isChecked: boolean): Checkbox {
    const checkbox = new Checkbox(stateId)
    checkbox.setChecked(isChecked)
    checkbox.setEnabled(this.hasAccess)
    return checkbox
  }

  /**
   * Uncheck all checkboxes except the given stateId
   * @return The indices of the checkboxes which were previously checked.
   */
  private setUnCheckedAll(stateId: number): number[] {
    const checkedIndices: number[] = []
    for (let x = 0; x < this.scoringCheckboxes.length; x++) {
      const checkbox = this.scoringCheckboxes[x]
      if (checkbox.getValue() == stateId) {
        continue
      }
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
  private setCheckedAll(indices: number[]) {
    for (const index of indices) {
      const checkbox = this.scoringCheckboxes[index]
      checkbox.setChecked(true)
    }
  }

  /**
   * Ensure that at least one checkbox is checked.
   */
  private ensureAtLeastOneCheckboxIsChecked() {
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

  /**
   * @return The HTML content of the scoring pane
   */
  private static htmlContent(): string {
    return (
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

  protected override createDom() {
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

  protected override enterDocument() {
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
   * Handles when the status select has been changed.
   */
  private handleValueChange() {
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

  /**
   * @return The HTML content of the scoring pane
   */
  private static htmlContent(character: Character): string {
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

  protected override createDom() {
    super.createDom()

    const cells = this.matrixModel.getCells()
    const cellInfo = cells.getCellInfo(this.taxonId, this.characterId)
    const notesElement = document.createElement('textarea')
    notesElement.classList.add('notesArea')
    notesElement.value = cellInfo.getNotes()
    notesElement.disabled = !this.hasAccess

    const element = this.getElement()
    element.classList.add('h-100')
    element.appendChild(notesElement)
  }

  protected override enterDocument() {
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
  private saveNotes() {
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
  private onHandleKeyDown(e: Event) {
    // Don't propagate events and only stay in the text area.
    e.stopPropagation()
  }
}

/**
 * Media pane
 */
class MediaPane extends BasePane {
  /**
   * Key to use to store in the user settings storage.
   */
  protected static AUTO_OPEN_MEDIA_WINDOW: string = 'autoOpenMediaWindow'

  private mediaGrid: MediaGrid
  private openMediaCheckbox: Checkbox

  /*
   * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
   * @param taxonId the id of the taxon to render for this dialog
   * @param characterId the id of the character to render for this dialog
   * @param hasAccess Whether the user has access to the cell
   * @param savingLabel the saving label associated with this dialog
   */
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

  protected override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('mediaPane')
    element.innerHTML = MediaPane.htmlContent()

    this.setMediaInGrid()
    this.mediaGrid.render(element)

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

  protected override enterDocument() {
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
  private removeMedia(e: CustomEvent) {
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
  private removeCellMedia(mediaId: number, shouldCopyCitations: boolean) {
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
  private setMediaInGrid() {
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
  private handleDoubleClickCellMedia(e: CustomEvent<MediaGridItemEvent>) {
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
  private handleMediaCheckboxChange() {
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
  private static htmlContent(): string {
    return (
      '<span class="addCellMedia">+ Add new</span>' +
      '<span class="openMediaWindow">' +
      '<span class="openMediaWindowCheckbox"></span>' +
      'Automatically open media browser when editing' +
      '</span>'
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

  protected override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('h-100')
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

  protected override enterDocument() {
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
  private getLoadingElement(): Element {
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
  private loadCellCitations() {
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
  private handleSelectCellCitation(e: CustomEvent) {
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
  private handleEditCellCitation(
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
  private handleAddCellCitation(
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
  private handleAddLastCellCitationDialog() {
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
  private handleShowAddCellCitationDialog() {
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
  private redrawCellCitations(citations: Citation[]) {
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
  private handleRemoveCellCitation(e: CustomEvent) {
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
  private static htmlContent(): string {
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

  protected override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('h-100')
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

  protected override enterDocument() {
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
  private getLoadingElement(): Element {
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
  private loadCellComments() {
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
  private addCellComments(comment: string) {
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
  private redrawCellComments(comments: { [key: string]: any }[]) {
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
  private handleShowAddCellCommentDialog() {
    const commentDialog = new AddCommentDialog((comment) =>
      this.addCellComments(comment)
    )
    commentDialog.setVisible(true)
  }

  /**
   * @return The HTML content for the comments pane
   */
  private static htmlContent(): string {
    return '<span class="addCellComment">+ Add new</span><div class="commentsPane"></div>'
  }
}

/**
 * Change log pane
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

  protected override createDom() {
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
  private getLoadingElement(): Element {
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
  private loadCellChanges() {
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

type CellDataGridModel = {
  position: number
}
