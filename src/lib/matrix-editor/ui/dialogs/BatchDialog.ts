import { SavingLabel } from '../SavingLabel'
import { MatrixModel } from '../../MatrixModel'
import { CharacterType } from '../../data/Characters'
import { Checkbox } from '../Checkbox'
import { DataGridTable, DataRow } from '../DataGridTable'
import { Dialog } from '../Dialog'
import { ModalDefaultButtons } from '../Modal'
import { Component, EventType } from '../Component'
import { Dropdown } from '../Dropdown'
import { Select } from '../Select'
import { TabNavigator } from '../TabNavigator'
import { MediaGridItem } from '../MediaGrid'
import { AddMediaDialog } from './AddMediaDialog'
import { AddCitationDialog } from './AddCitationDialog'
import { AddNoteDialog } from './AddNoteDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { EditContinuousScoreDialog } from './EditContinuousScoreDialog'
import { EditScoreDialog, Score } from './EditScoreDialog'
import type { CellInfoStatus } from '../../data/Cells'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import * as CharacterRulesAddedEvents from '../../events/CharacterRulesAddedEvent'
import * as CharacterRulesRemovedEvents from '../../events/CharacterRulesRemovedEvent'
import * as TaxaAddedEvents from '../../events/TaxaAddedEvent'
import * as TaxaChangedEvents from '../../events/TaxaChangedEvent'
import * as TaxaRemovedEvents from '../../events/TaxaRemovedEvent'
import * as mb from '../../mb'

/**
 * Batch dialog.
 *
 * @param matrixModel the data associated with the matrix.
 */
export class BatchDialog extends Dialog {
  /**
   * The last selected tab index. Used to keep the tab the same across batch dialogs.
   */
  private static LAST_SELECTED_TAB_INDEX: number = 0
  private tabNavigator: TabNavigator

  constructor(private matrixModel: MatrixModel) {
    super()
    this.tabNavigator = new TabNavigator()
    this.registerDisposable(this.tabNavigator)
    this.setTitle('Batch')
    this.setHasBackdrop(false)
    this.addButton(ModalDefaultButtons.DONE)
    this.addButton(Buttons.SET_ROW_NOTES)
    this.addButton(Buttons.SET_ROW_CITATIONS)
    this.addButton(Buttons.SET_ROW_SCORES)
    this.addButton(Buttons.REMOVE_ROW_MEDIA)
    this.addButton(Buttons.SET_ROW_MEDIA)
    this.addButton(Buttons.SET_COLUMN_NOTE)
    this.addButton(Buttons.SET_COLUMN_CITATIONS)
    this.addButton(Buttons.SET_COLUMN_SCORES)
    this.addButton(Buttons.COPY_ROW)
    this.addButton(Buttons.REFRESH_UNDO)
    this.addButton(Buttons.UNDO)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('batchDialog', 'modal-xl')
    const contentElement = this.getContentElement()
    this.tabNavigator.addTab(
      'Batch a row',
      new BatchRowPane(this.matrixModel, this)
    )
    this.tabNavigator.addTab(
      'Batch a column',
      new BatchColumnPane(this.matrixModel, this)
    )
    this.tabNavigator.addTab(
      'Copy a row',
      new BatchCopyPane(this.matrixModel, this)
    )
    this.tabNavigator.addTab('Undo', new BatchUndoPane(this.matrixModel, this))
    this.tabNavigator.setSelectedTabIndex(BatchDialog.LAST_SELECTED_TAB_INDEX)
    this.tabNavigator.render(contentElement)
    this.updateLastSelectedTabIndex()
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler.listen(
      this.tabNavigator,
      EventType.SELECT,
      () => this.updateLastSelectedTabIndex()
    )
  }

  /**
   * Sets a default position in batch dialog which is focused on the given character and taxon id.
   *
   * @param characterId The id of the character to scroll to.
   * @param taxonId The id of the taxon to scroll to.
   */
  setSelectedPositions(characterId: number, taxonId: number) {
    const characterIndex = this.matrixModel.getCharacterIndexById(characterId)
    const taxonIndex = this.matrixModel.getTaxonIndexById(taxonId)
    const component = this.tabNavigator.getSelectedTabComponent<BasePane>()
    component.setSelectedPositionsByIndices(characterIndex, taxonIndex)
  }

  /**
   * @return  Return this dialog's saving label
   * But only use within this file
   */
  getSavingLabel(): SavingLabel {
    return this.savingLabel
  }

  /**
   * Updates the last selected tab index.
   */
  updateLastSelectedTabIndex() {
    BatchDialog.LAST_SELECTED_TAB_INDEX =
      this.tabNavigator.getSelectedTabIndex()
    this.tabNavigator.getSelectedTabComponent<BasePane>().setDialogButtons()
  }
}

/**
 * The keys used to identify additional buttons in events.
 */
const ButtonKeys = {
  COPY_ROW: 'copy_row',
  REFRESH_UNDO: 'refresh_undo',
  REMOVE_ROW_MEDIA: 'remove_row_media',
  SET_COLUMN_CITATIONS: 'set_column_citations',
  SET_COLUMN_NOTE: 'set_column_note',
  SET_COLUMN_SCORES: 'set_column_scores',
  SET_ROW_CITATIONS: 'set_row_citations',
  SET_ROW_MEDIA: 'set_row_media',
  SET_ROW_NOTES: 'set_row_notes',
  SET_ROW_SCORES: 'set_row_scores',
  UNDO: 'undo',
}

/**
 * The keys used to identify additional buttons in events.
 */
const ButtonLabels = {
  COPY_ROW: 'Copy row',
  REFRESH_UNDO: 'Refresh',
  REMOVE_ROW_MEDIA: 'Remove media',
  SET_COLUMN_CITATIONS: 'Set citations',
  SET_COLUMN_NOTE: 'Set note',
  SET_COLUMN_SCORES: 'Set scores',
  SET_ROW_CITATIONS: 'Set citations',
  SET_ROW_MEDIA: 'Set media',
  SET_ROW_NOTES: 'Set notes',
  SET_ROW_SCORES: 'Set scores',
  UNDO: 'Undo',
}

/**
 * The standard buttons (keys associated with captions).
 */
const Buttons = {
  COPY_ROW: {
    text: ButtonLabels.COPY_ROW,
    key: ButtonKeys.COPY_ROW,
    dismissable: false,
  },
  REFRESH_UNDO: {
    text: ButtonLabels.REFRESH_UNDO,
    key: ButtonKeys.REFRESH_UNDO,
    dismissable: false,
  },
  REMOVE_ROW_MEDIA: {
    text: ButtonLabels.REMOVE_ROW_MEDIA,
    key: ButtonKeys.REMOVE_ROW_MEDIA,
    dismissable: false,
  },
  SET_COLUMN_CITATIONS: {
    text: ButtonLabels.SET_COLUMN_CITATIONS,
    key: ButtonKeys.SET_COLUMN_CITATIONS,
    dismissable: false,
  },
  SET_COLUMN_NOTE: {
    text: ButtonLabels.SET_COLUMN_NOTE,
    key: ButtonKeys.SET_COLUMN_NOTE,
    dismissable: false,
  },
  SET_COLUMN_SCORES: {
    text: ButtonLabels.SET_COLUMN_SCORES,
    key: ButtonKeys.SET_COLUMN_SCORES,
    dismissable: false,
  },
  SET_ROW_CITATIONS: {
    text: ButtonLabels.SET_ROW_CITATIONS,
    key: ButtonKeys.SET_ROW_CITATIONS,
    dismissable: false,
  },
  SET_ROW_MEDIA: {
    text: ButtonLabels.SET_ROW_MEDIA,
    key: ButtonKeys.SET_ROW_MEDIA,
    dismissable: false,
  },
  SET_ROW_NOTES: {
    text: ButtonLabels.SET_ROW_NOTES,
    key: ButtonKeys.SET_ROW_NOTES,
    dismissable: false,
  },
  SET_ROW_SCORES: {
    text: ButtonLabels.SET_ROW_SCORES,
    key: ButtonKeys.SET_ROW_SCORES,
    dismissable: false,
  },
  UNDO: { text: ButtonLabels.UNDO, key: ButtonKeys.UNDO, dismissable: false },
}

/**
 * Batch Row pane
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog the root dialog
 */
abstract class BasePane extends Component {
  protected readonly matrixModel: MatrixModel
  protected readonly dialog: BatchDialog
  protected isRedrawing: boolean

  constructor(matrixModel: MatrixModel, dialog: BatchDialog) {
    super()

    this.matrixModel = matrixModel
    this.dialog = dialog
    this.isRedrawing = false
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(
      this.dialog,
      EventType.SELECT,
      (e: CustomEvent<any>) => this.onHandleSelect(e)
    )
  }

  /**
   * Sets the dialog's buttons based on the current pane.
   */
  public abstract setDialogButtons(): void

  /**
   * Sets the current position for the Batch Dialog.
   *
   * @param characterIndex The index of the character to select.
   * @param taxonIndex The index of the taxon to select.
   */
  public abstract setSelectedPositionsByIndices(
    characterIndex: number,
    taxonIndex: number
  ): void

  /**
   * Handles the clicks on the dialog buttons.
   *
   * @param e The event that triggered this callback.
   * @return Whether this function handled this event.
   */
  protected abstract onHandleSelect(e: CustomEvent): boolean
}

/**
 * Batch Row pane
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog the root dialog
 */
class BatchRowPane extends BasePane {
  /**
   * The text caption for the warning to remove the media.
   */
  protected static readonly removeMediaText: string =
    'Are you sure you want to remove media for the specified ' +
    'characters? This will remove ALL media in cells for these characters and taxon.'

  /**
   * The text caption for the batch column pane. Describes how to batch edit.
   */
  protected static readonly textCaption: string =
    'The batch editor allows you to quickly associate media or ' +
    'score a range of characters for a given taxa. Simply select a taxon, select one or more characters (to ' +
    'select contiguous characters, press the hold the SHIFT key; for non-contiguous characters, use the COMMAND ' +
    'key on Macs or CTRL key on PCs) and then click on one of the "set" buttons. Changes made with the batch ' +
    'editor can be undone. See the "Undo" tab.'

  protected characterSelect: Select
  private taxaSelect: Dropdown

  constructor(matrixModel: MatrixModel, dialog: BatchDialog) {
    super(matrixModel, dialog)
    this.characterSelect = new Select()
    this.characterSelect.setAllowMultipleSelection(true)
    this.registerDisposable(this.characterSelect)
    this.taxaSelect = new Dropdown()
    this.registerDisposable(this.taxaSelect)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('batchRowPane')
    element.innerHTML = BatchRowPane.htmlContent()
    const taxonSelectElement = this.getElementByClass('taxaSelect')
    this.taxaSelect.render(taxonSelectElement)
    this.updateTaxaSelectUI()
    const characterSelectElement = this.getElementByClass('characterSelect')
    this.characterSelect.render(characterSelectElement)
    this.updateCharactersSelectUI()
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(this.taxaSelect, EventType.CHANGE, () => this.onHandleChange())
      .listen(
        this.characterSelect,
        EventType.SELECT,
        () => this.onHandleChange()
      )
      .listen(
        this.matrixModel,
        [
          CharacterRulesAddedEvents.TYPE,
          CharacterRulesRemovedEvents.TYPE,
          CharacterChangedEvents.TYPE,
        ],
        () => this.updateCharactersSelectUI()
      )
      .listen(
        this.matrixModel,
        [TaxaAddedEvents.TYPE, TaxaChangedEvents.TYPE, TaxaRemovedEvents.TYPE],
        () => this.updateTaxaSelectUI()
      )
  }

  /**
   * handles when either the taxaSelect or characterSelectElement has changed, and will
   * enable the batchRow buttonSet when a taxa and 1 or more characters are selected.
   */
  protected onHandleChange() {
    if (this.isRedrawing) {
      return
    }
    const taxonId = parseInt(this.taxaSelect.getSelectedValue(), 10)
    const characterIds = this.characterSelect.getSelectedValues()
    const enabled = taxonId > 0 && characterIds.length > 0
    this.shouldEnableButtons(enabled)
  }

  override setDialogButtons() {
    this.dialog.showButtons([
      ModalDefaultButtons.DONE,
      Buttons.SET_ROW_NOTES,
      Buttons.SET_ROW_CITATIONS,
      Buttons.SET_ROW_SCORES,
      Buttons.REMOVE_ROW_MEDIA,
      Buttons.SET_ROW_MEDIA,
    ])
    this.onHandleChange()
  }

  override setSelectedPositionsByIndices(
    characterIndex: number,
    taxonIndex: number
  ) {
    // Increment by one since we want to skip the first option.
    this.characterSelect.setSelectedIndex(characterIndex)
    this.taxaSelect.setSelectedIndex(taxonIndex + 1)
  }

  /**
   * enables or disables the buttons for the batchRowPane
   */
  private shouldEnableButtons(enabled: boolean) {
    if (!this.isInDocument()) {
      return
    }
    this.dialog.setButtonEnabled(Buttons.SET_ROW_NOTES, enabled)
    this.dialog.setButtonEnabled(Buttons.SET_ROW_CITATIONS, enabled)
    this.dialog.setButtonEnabled(Buttons.SET_ROW_SCORES, enabled)
    this.dialog.setButtonEnabled(Buttons.REMOVE_ROW_MEDIA, enabled)
    this.dialog.setButtonEnabled(Buttons.SET_ROW_MEDIA, enabled)
  }

  override onHandleSelect(e: CustomEvent) {
    switch (e.detail.key) {
      case ButtonKeys.SET_ROW_NOTES:
        this.handleShowAddNoteDialog()
        return false
      case ButtonKeys.SET_ROW_CITATIONS:
        this.handleShowAddCitationsDialog()
        return false
      case ButtonKeys.SET_ROW_SCORES:
        this.handleShowEditScoreDialog()
        return false
      case ButtonKeys.REMOVE_ROW_MEDIA:
        this.showRemoveMediaConfirmDialog()
        return false
      case ButtonKeys.SET_ROW_MEDIA:
        this.showAddMediaDialog()
        return false
      default:
        return true
    }
  }

  /**
   * Handles the add media event on this taxon.
   */
  protected showAddMediaDialog() {
    const addMediaDialog = new AddMediaDialog(
      () => this.getTaxonMediaItems(),
      (mediaIds) => this.addCellMedia(mediaIds)
    )
    addMediaDialog.setVisible(true)
  }

  /**
   * @return The list of media items which are associated with this
   *		taxon.
   */
  protected getTaxonMediaItems(): Promise<MediaGridItem[]> {
    const taxonId = parseInt(this.taxaSelect.getSelectedValue(), 10)
    return this.matrixModel.loadTaxaMedia(taxonId).then((results) => {
      const mediaItems: MediaGridItem[] = []
      for (let x = 0; x < results.length; x++) {
        const result = results[x]
        const mediaId = parseInt(result['media_id'], 10)
        const tiny = result['tiny']
        const mediaItem = { id: mediaId, image: tiny }
        mediaItems.push(mediaItem)
      }
      return mediaItems
    })
  }

  /**
   * Saves the cell media
   *
   * @param mediaIds the ids of the media to add to this cell
   * @return The promise that the cell media was saved
   */
  protected addCellMedia(mediaIds: number[]): Promise<void> {
    const taxonId = parseInt(this.taxaSelect.getSelectedValue(), 10)
    const selectedCharacterIds = mb.convertToNumberArray(
      this.characterSelect.getSelectedValues()
    )
    this.dialog.getSavingLabel().saving()
    return this.matrixModel
      .addCellMedia(taxonId, selectedCharacterIds, mediaIds, true)
      .then(() => {
        this.dialog.getSavingLabel().saved()
      })
      .catch((e) => {
        this.dialog.getSavingLabel().failed()
        throw e
      })
  }

  /**
   * Handles the add media event on this taxon.
   */
  protected showRemoveMediaConfirmDialog() {
    const warningDialog = new ConfirmDialog(
      'Confirm',
      BatchRowPane.removeMediaText,
      () => this.handleRemoveMedia()
    )
    warningDialog.setVisible(true)
  }

  /**
   * Removes media from the cells.
   */
  protected handleRemoveMedia() {
    const taxonId = parseInt(this.taxaSelect.getSelectedValue(), 10)
    const selectedCharacterIds = mb.convertToNumberArray(
      this.characterSelect.getSelectedValues()
    )
    this.dialog.getSavingLabel().saving()
    return this.matrixModel
      .removeCellsMedia(taxonId, selectedCharacterIds)
      .then(() => {
        this.dialog.getSavingLabel().saved()
      })
      .catch((e) => {
        this.dialog.getSavingLabel().failed()
        alert(e)
        throw e
      })
  }

  /**
   * Shows the citation dialog
   */
  protected handleShowAddCitationsDialog() {
    const addCitationDialog = new AddCitationDialog(
      this.matrixModel,
      (citationId, pages, notes) =>
        this.handleAddCellCitation(citationId, pages, notes)
    )
    addCitationDialog.setVisible(true)
  }

  /**
   * Adds a citation
   *
   * @param citationId the id of the citation to add
   * @param pages the pages that this citation refers to
   * @param notes the notes about this citation
   */
  protected handleAddCellCitation(
    citationId: number,
    pages: string,
    notes: string
  ): Promise<void> {
    const taxonId = parseInt(this.taxaSelect.getSelectedValue(), 10)
    const selectedCharacterIds = mb.convertToNumberArray(
      this.characterSelect.getSelectedValues()
    )
    const batchmode = 1
    this.dialog.getSavingLabel().saving()
    return this.matrixModel
      .addCellCitations(
        [taxonId],
        selectedCharacterIds,
        citationId,
        pages,
        notes,
        batchmode
      )
      .then(() => {
        this.dialog.getSavingLabel().saved()
      })
      .catch((e) => {
        this.dialog.getSavingLabel().failed()
        alert(e)
        throw e
      })
  }

  /**
   * Shows the notes dialog
   */
  protected handleShowAddNoteDialog() {
    const addNoteDialog = new AddNoteDialog(
      (status: CellInfoStatus, notes: string) =>
        this.handleAddCellNote(status, notes)
    )
    addNoteDialog.setVisible(true)
  }

  /**
   * Adds a note
   * @param status the status of the cells
   * @param notes the note about the cells
   */
  protected handleAddCellNote(
    status: CellInfoStatus,
    notes: string
  ): Promise<void> {
    const taxonId = parseInt(this.taxaSelect.getSelectedValue(), 10)
    const selectedCharacterIds = mb.convertToNumberArray(
      this.characterSelect.getSelectedValues()
    )
    const batchmode = 1
    this.dialog.getSavingLabel().saving()
    return this.matrixModel
      .setCellNotes([taxonId], selectedCharacterIds, notes, status, batchmode)
      .then(() => {
        this.dialog.getSavingLabel().saved()
      })
      .catch((e) => {
        this.dialog.getSavingLabel().failed()
        alert(e)
        throw e
      })
  }

  /**
   * Shows the notes dialog
   */
  protected handleShowEditScoreDialog() {
    const selectedCharacterIds = mb.convertToNumberArray(
      this.characterSelect.getSelectedValues()
    )
    const characters = this.matrixModel
      .getCharacters()
      .getByIds(selectedCharacterIds)
    const isAllDiscrete = characters.every(
      (character) => character.getType() === CharacterType.DISCRETE
    )
    const addNoteDialog = new EditScoreDialog([], isAllDiscrete, (scores) =>
      this.handleEditScore(scores)
    )
    addNoteDialog.setVisible(true)
  }

  /**
   * Edits the cell scores
   * @param scores The scores to set for the cells
   */
  handleEditScore(scores: (number | null)[]): Promise<void> {
    const taxonId = parseInt(this.taxaSelect.getSelectedValue(), 10)
    const selectedCharacterIds = mb.convertToNumberArray(
      this.characterSelect.getSelectedValues()
    )
    const options = { batchmode: 1 }
    this.dialog.getSavingLabel().saving()
    return this.matrixModel
      .setCellStates([taxonId], selectedCharacterIds, scores, options)
      .then(() => {
        this.dialog.getSavingLabel().saved()
      })
      .catch((e) => {
        this.dialog.getSavingLabel().failed()
        alert(e)
        throw e
      })
  }

  /**
   * Updates the character select ui
   */
  updateCharactersSelectUI() {
    this.isRedrawing = true
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const partitionedCharacters = this.matrixModel.getPartitionCharacters()

    // Get the selected values so that we can restore them when after we redraw the matrix.
    const selectedValues = this.characterSelect.getSelectedValues()
    const selectedIndicies: number[] = []
    for (let x = 0, length = selectedValues.length; x < length; ++x) {
      const characterId = parseInt(selectedValues[x], 10)
      const characterIndex = this.matrixModel.getCharacterIndexById(characterId)
      if (characterIndex >= 0) {
        selectedIndicies.push(characterIndex)
      }
    }

    // clear character items
    this.characterSelect.clearItems()

    // set up character items
    for (let x = 0; x < partitionedCharacters.length; x++) {
      const character = partitionedCharacters[x]
      const characterId = character.getId()
      const characterName =
        '[' +
        (character.getNumber() - numberingMode) +
        '] ' +
        character.getName()
      this.characterSelect.addItem(characterName, characterId)
    }

    // redraw character items
    this.characterSelect.redraw()
    if (selectedIndicies) {
      this.characterSelect.setSelectedIndices(selectedIndicies)
    }
    this.isRedrawing = false
  }

  /**
   * Updates the taxa select ui
   */
  updateTaxaSelectUI() {
    const projectPreferences = this.matrixModel.getProjectProperties()
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const partitionedTaxa = this.matrixModel.getPartitionTaxa()
    this.isRedrawing = true

    // Get the selected values so that we can restore them when after we redraw the matrix.
    const selectedTaxonId = parseInt(this.taxaSelect.getSelectedValue(), 10)
    const selectedIndex = this.matrixModel.getTaxonIndexById(selectedTaxonId)

    // Remove previous menu items.
    this.taxaSelect.removeAllItems()
    for (let x = 0; x < partitionedTaxa.length; x++) {
      const taxon = partitionedTaxa[x]
      const taxonName =
        '[' +
        (taxon.getNumber() - numberingMode) +
        '] ' +
        mb.truncateString(taxon.getDisplayName(), 90)
      const taxonId = taxon.getId()
      this.taxaSelect.addItem({
        text: taxonName,
        value: taxonId,
        disabled: !taxon.hasAccess(projectPreferences),
      })
    }
    this.taxaSelect.redraw()
    this.isRedrawing = false

    // This is done after drawing so that we can enable the buttons.
    this.taxaSelect.setSelectedIndex(selectedIndex)
  }

  /**
   * @return The HTML content for the batch row pane
   */
  static htmlContent(): string {
    return (
      '<section>' +
      '<i>' +
      BatchRowPane.textCaption +
      '</i>' +
      '<header>Taxon</header>' +
      '<div class="taxaSelect"></div>' +
      '<header>Characters</header>' +
      '<div class="characterSelect"></div>' +
      '</section>'
    )
  }
}

/**
 * Batch Column pane
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog the root dialog
 */
class BatchColumnPane extends BasePane {
  /**
   * The text caption for the batch column pane. Describes how to batch edit.
   */
  private static readonly textCaption: string =
    'The batch editor allows you to quickly score a range of ' +
    'taxa for a given character. Simply select a character, select one or more taxa (to select contiguous taxa, ' +
    'press the hold the SHIFT key; for non-contiguous taxa, use the COMMAND key on Macs or CTRL key on PCs) and ' +
    'then click the "set scoring" button in order to choose the character states to associate to the selected ' +
    'taxa. Changes made with the batch editor can be undone. See the "Undo" tab.'
  private characterSelect: Dropdown
  private taxaSelect: Select

  constructor(matrixModel: MatrixModel, dialog: BatchDialog) {
    super(matrixModel, dialog)
    this.characterSelect = new Dropdown()
    this.registerDisposable(this.characterSelect)
    this.taxaSelect = new Select()
    this.taxaSelect.setAllowMultipleSelection(true)
    this.registerDisposable(this.taxaSelect)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('batchColumnPane')
    element.innerHTML = BatchColumnPane.htmlContent()
    const taxonSelectElement = this.getElementByClass('taxaSelect')
    this.taxaSelect.render(taxonSelectElement)
    this.updateTaxaSelectUI()
    const characterSelectElement = this.getElementByClass('characterSelect')
    this.characterSelect.render(characterSelectElement)
    this.updateCharactersSelectUI()
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(
        this.characterSelect,
        EventType.CHANGE,
        () => this.onHandleSelectionChange()
      )
      .listen(
        this.taxaSelect,
        EventType.SELECT,
        () => this.onHandleSelectionChange()
      )
      .listen(
        this.matrixModel,
        [
          CharacterRulesAddedEvents.TYPE,
          CharacterRulesRemovedEvents.TYPE,
          CharacterChangedEvents.TYPE,
        ],
        () => this.updateCharactersSelectUI()
      )
      .listen(
        this.matrixModel,
        [TaxaAddedEvents.TYPE, TaxaChangedEvents.TYPE, TaxaRemovedEvents.TYPE],
        () => this.updateTaxaSelectUI()
      )
  }

  override setDialogButtons() {
    this.dialog.showButtons([
      ModalDefaultButtons.DONE,
      Buttons.SET_COLUMN_NOTE,
      Buttons.SET_COLUMN_CITATIONS,
      Buttons.SET_COLUMN_SCORES,
    ])

    // Ensure that the buttons are properly enabled
    this.onHandleSelectionChange()
  }

  override setSelectedPositionsByIndices(
    characterIndex: number,
    taxonIndex: number
  ) {
    // Increment by one since we want to skip the first option.
    this.characterSelect.setSelectedIndex(characterIndex + 1)
    this.taxaSelect.setSelectedIndex(taxonIndex)
  }

  override onHandleSelect(e: CustomEvent) {
    switch (e.detail.key) {
      case ButtonKeys.SET_COLUMN_NOTE:
        this.handleShowAddNoteDialog()
        return false
      case ButtonKeys.SET_COLUMN_SCORES:
        this.handleShowEditScoreDialog()
        return false
      case ButtonKeys.SET_COLUMN_CITATIONS:
        this.handleShowAddCitationsDialog()
        return false
      default:
        return true
    }
  }

  /**
   * Handles when taxa or characters have changed
   */
  protected onHandleSelectionChange() {
    if (this.isRedrawing) {
      return
    }
    const characterId = parseInt(this.characterSelect.getSelectedValue(), 10)
    const selectedTaxonIds = this.taxaSelect.getSelectedValues()
    const enable = characterId !== -1 && selectedTaxonIds.length !== 0
    this.shouldEnableButtons(enable)
  }

  /**
   * Enables or Disables the 'Add' button
   * @param enabled Whether to enable or disable the add button
   */
  protected shouldEnableButtons(enabled: boolean) {
    if (!this.isInDocument()) {
      return
    }
    this.dialog.setButtonEnabled(Buttons.SET_COLUMN_NOTE, enabled)
    this.dialog.setButtonEnabled(Buttons.SET_COLUMN_CITATIONS, enabled)
    this.dialog.setButtonEnabled(Buttons.SET_COLUMN_SCORES, enabled)
  }

  /**
   * Updates the character select ui
   */
  protected updateCharactersSelectUI() {
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const partitionedCharacters = this.matrixModel.getPartitionCharacters()
    this.isRedrawing = true

    // Get the selected values so that we can restore them when after we redraw the matrix.
    const selectedCharacterId = parseInt(
      this.characterSelect.getSelectedValue(),
      10
    )
    const selectedIndex =
      this.matrixModel.getCharacterIndexById(selectedCharacterId)

    // Remove previous menu items.
    this.characterSelect.removeAllItems()

    // Default character.
    this.characterSelect.addItem({ text: 'Choose a character', value: -1 })

    // Set up character items
    for (let x = 0; x < partitionedCharacters.length; x++) {
      const character = partitionedCharacters[x]
      const characterId = character.getId()
      const characterName =
        '[' +
        (character.getNumber() - numberingMode) +
        '] ' +
        mb.truncateString(character.getName(), 90)
      this.characterSelect.addItem({ text: characterName, value: characterId })
    }
    this.characterSelect.redraw()
    this.isRedrawing = false

    // This is done after drawing so that we can enable the buttons.
    this.characterSelect.setSelectedIndex(selectedIndex + 1)
  }

  /**
   * Updates the taxa select ui
   */
  protected updateTaxaSelectUI() {
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const partitionedTaxa = this.matrixModel.getPartitionTaxa()
    this.isRedrawing = true

    // Get the selected values so that we can restore them when after we redraw the matrix.
    const selectedValues = this.taxaSelect.getSelectedValues()
    const selectedIndicies: number[] = []
    for (let x = 0, length = selectedValues.length; x < length; ++x) {
      const taxonId = parseInt(selectedValues[x], 10)
      const taxonIndex = this.matrixModel.getTaxonIndexById(taxonId)
      if (taxonIndex >= 0) {
        selectedIndicies.push(taxonIndex)
      }
    }
    this.taxaSelect.clearItems()
    for (let x = 0; x < partitionedTaxa.length; x++) {
      const taxon = partitionedTaxa[x]
      const taxonName =
        '[' +
        (taxon.getNumber() - numberingMode) +
        '] ' +
        mb.truncateString(mb.decodeHTMLEntities(taxon.getName()), 90)
      const taxonId = taxon.getId()
      this.taxaSelect.addItem(taxonName, taxonId)
    }
    this.taxaSelect.redraw()
    if (selectedIndicies.length) {
      this.taxaSelect.setSelectedIndices(selectedIndicies)
    }
    this.isRedrawing = false
  }

  /**
   * Shows the citation dialog
   */
  protected handleShowAddCitationsDialog() {
    const addCitationDialog = new AddCitationDialog(
      this.matrixModel,
      (citationId, pages, notes) =>
        this.handleAddCellCitation(citationId, pages, notes)
    )
    addCitationDialog.setVisible(true)
  }

  /**
   * Adds a citation
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
    const characterId = parseInt(this.characterSelect.getSelectedValue(), 10)
    const selectedTaxonIds = mb.convertToNumberArray(
      this.taxaSelect.getSelectedValues()
    )
    const batchmode = 2
    this.dialog.getSavingLabel().saving()
    return this.matrixModel
      .addCellCitations(
        selectedTaxonIds,
        [characterId],
        citationId,
        pages,
        notes,
        batchmode
      )
      .then(() => {
        this.dialog.getSavingLabel().saved()
      })
      .catch((e) => {
        this.dialog.getSavingLabel().failed()
        alert(e)
        throw e
      })
  }

  /**
   * Shows the notes dialog
   */
  protected handleShowAddNoteDialog() {
    const addNoteDialog = new AddNoteDialog(
      (status: CellInfoStatus, notes: string) =>
        this.handleAddCellNote(status, notes)
    )
    addNoteDialog.setVisible(true)
  }

  /**
   * Adds a note
   * @param status the status of the cells
   * @param notes the note about the cells
   */
  handleAddCellNote(status: CellInfoStatus, notes: string): Promise<void> {
    const characterId = parseInt(this.characterSelect.getSelectedValue(), 10)
    const selectedTaxonIds = mb.convertToNumberArray(
      this.taxaSelect.getSelectedValues()
    )
    const batchmode = 2
    this.dialog.getSavingLabel().saving()
    return this.matrixModel
      .setCellNotes(selectedTaxonIds, [characterId], notes, status, batchmode)
      .then(() => {
        this.dialog.getSavingLabel().saved()
      })
      .catch((e) => {
        this.dialog.getSavingLabel().failed()
        alert(e)
        throw e
      })
  }

  /**
   * Shows the edit scores dialog.
   */
  protected handleShowEditScoreDialog() {
    const characterId = parseInt(this.characterSelect.getSelectedValue(), 10)
    const character = this.matrixModel.getCharacters().getById(characterId)
    let editScoreDialog
    if (character!.getType() === CharacterType.DISCRETE) {
      const characterStates = character!.getStates()
      const scores: Score[] = []
      for (let x = 0; x < characterStates.length; x++) {
        const characterState = characterStates[x]
        scores.push({
          id: characterState.getId(),
          num: characterState.getNumber(),
          name: characterState.getName(),
        })
      }
      editScoreDialog = new EditScoreDialog(scores, true, (scores) =>
        this.handleEditScore(scores)
      )
    } else {
      editScoreDialog = new EditContinuousScoreDialog(
        character!.getType(),
        (startValue, endValue) =>
          this.handleEditContinuousScore(startValue, endValue)
      )
    }
    editScoreDialog.setVisible(true)
  }

  /**
   * Edits the cell scores
   * @param scores The scores to set for the cells
   */
  handleEditScore(scores: (number | null)[]): Promise<void> {
    const characterId = parseInt(this.characterSelect.getSelectedValue(), 10)
    const selectedTaxonIds = mb.convertToNumberArray(
      this.taxaSelect.getSelectedValues()
    )
    const options = { batchmode: 2 }
    this.dialog.getSavingLabel().saving()
    return this.matrixModel
      .setCellStates(selectedTaxonIds, [characterId], scores, options)
      .then(() => {
        this.dialog.getSavingLabel().saved()
      })
      .catch((e) => {
        this.dialog.getSavingLabel().failed()
        alert(e)
        throw e
      })
  }

  /**
   * Edits the cell continuous scores
   * @param startValue The start value.
   * @param endValue The end value.
   */
  handleEditContinuousScore(
    startValue: number,
    endValue: number
  ): Promise<void> {
    const characterId = parseInt(this.characterSelect.getSelectedValue(), 10)
    const selectedTaxonIds = mb.convertToNumberArray(
      this.taxaSelect.getSelectedValues()
    )
    const options = { batchmode: 2 }
    this.dialog.getSavingLabel().saving()
    return this.matrixModel
      .setContinuousValues(
        selectedTaxonIds,
        [characterId],
        startValue,
        endValue,
        options
      )
      .then(() => {
        this.dialog.getSavingLabel().saved()
      })
      .catch((e) => {
        this.dialog.getSavingLabel().failed()
        alert(e)
        throw e
      })
  }

  /**
   * @return The HTML content for the batch column pane
   */
  static htmlContent(): string {
    return (
      '<section>' +
      '<i>' +
      BatchColumnPane.textCaption +
      '</i>' +
      '<header>Characters</header>' +
      '<div class="characterSelect"></div>' +
      '<header>Taxon</header>' +
      '<div class="taxaSelect"></div>' +
      '</section>'
    )
  }
}

/**
 * Copy row pane
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog the root dialog
 */
class BatchCopyPane extends BasePane {
  /**
   * The text caption for the batch copy pane. Describes how to batch edit.
   */
  private static textCaption: string =
    'The batch copy editor allows you to quickly copy rows for a ' +
    'given taxon. Simply select a source taxon, a target taxon, one or more characters (to select contiguous ' +
    'characters, press the hold the SHIFT key; for non-contiguous characters, use the COMMAND key on Macs or ' +
    'CTRL key on PCs) and then click on one of the "set" buttons. Changes made with the batch editor can be ' +
    'undone. See the "Undo" tab.'
  private characterSelect: Select
  private sourceTaxaSelect: Dropdown
  private destinationTaxaSelect: Dropdown
  private copyNotesCheckbox: Checkbox

  constructor(matrixModel: MatrixModel, dialog: BatchDialog) {
    super(matrixModel, dialog)

    this.characterSelect = new Select()
    this.characterSelect.setAllowMultipleSelection(true)
    this.registerDisposable(this.characterSelect)
    this.sourceTaxaSelect = new Dropdown()
    this.registerDisposable(this.sourceTaxaSelect)
    this.destinationTaxaSelect = new Dropdown()
    this.registerDisposable(this.destinationTaxaSelect)
    this.copyNotesCheckbox = new Checkbox(1)
    this.registerDisposable(this.copyNotesCheckbox)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('batchCopyPane')
    element.innerHTML = BatchCopyPane.htmlContent()
    const sourceTaxaSelectElement = this.getElementByClass('source-taxaSelect')
    this.sourceTaxaSelect.render(sourceTaxaSelectElement)
    const destinationTaxaSelectElement = this.getElementByClass(
      'destination-taxaSelect'
    )
    this.destinationTaxaSelect.render(destinationTaxaSelectElement)
    this.updateTaxaSelectUI()
    const characterSelectElement = this.getElementByClass('characterSelect')
    this.characterSelect.render(characterSelectElement)
    this.updateCharactersSelectUI()
    const checkboxElement = this.getElementByClass<HTMLLabelElement>('checkbox')
    this.copyNotesCheckbox.setLabel(checkboxElement)
    this.copyNotesCheckbox.render(checkboxElement)
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(
        this.sourceTaxaSelect,
        EventType.CHANGE,
        () => this.onHandleSelectionChange()
      )
      .listen(
        this.destinationTaxaSelect,
        EventType.CHANGE,
        () => this.onHandleSelectionChange()
      )
      .listen(
        this.characterSelect,
        EventType.SELECT,
        () => this.onHandleSelectionChange()
      )
      .listen(
        this.matrixModel,
        [
          CharacterRulesAddedEvents.TYPE,
          CharacterRulesRemovedEvents.TYPE,
          CharacterChangedEvents.TYPE,
        ],
        () => this.updateCharactersSelectUI()
      )
      .listen(
        this.matrixModel,
        [TaxaAddedEvents.TYPE, TaxaChangedEvents.TYPE, TaxaRemovedEvents.TYPE],
        () => this.updateTaxaSelectUI()
      )
  }

  override setDialogButtons() {
    this.dialog.showButtons([ModalDefaultButtons.DONE, Buttons.COPY_ROW])

    // Ensure that the buttons are properly enabled
    this.onHandleSelectionChange()
  }

  override setSelectedPositionsByIndices(
    characterIndex: number,
    taxonIndex: number
  ) {
    this.characterSelect.setSelectedIndex(characterIndex)

    // Increment by one since we want to skip the first option.
    this.sourceTaxaSelect.setSelectedIndex(taxonIndex + 1)
    this.destinationTaxaSelect.setSelectedIndex(taxonIndex + 1)
  }

  override onHandleSelect(e: CustomEvent) {
    switch (e.detail.key) {
      case ButtonKeys.COPY_ROW:
        this.copyRow()
        return false
      default:
        return true
    }
  }

  /**
   * Handles when taxa or characters have changed
   */
  protected onHandleSelectionChange() {
    if (this.isRedrawing) {
      return
    }
    const sourceTaxonId = parseInt(this.sourceTaxaSelect.getSelectedValue(), 10)
    const destinationTaxonId = parseInt(
      this.destinationTaxaSelect.getSelectedValue(),
      10
    )
    const selectedCharacterIds = this.characterSelect.getSelectedValues()
    const enable =
      sourceTaxonId !== -1 &&
      destinationTaxonId !== -1 &&
      sourceTaxonId !== destinationTaxonId &&
      selectedCharacterIds.length !== 0
    this.shouldEnableButtons(enable)
  }

  /**
   * Enables or Disables the 'Add' button
   * @param enabled Whether to enable or disable the add button
   */
  protected shouldEnableButtons(enabled: boolean) {
    if (!this.isInDocument()) {
      return
    }
    this.dialog.setButtonEnabled(Buttons.COPY_ROW, enabled)
  }

  /**
   * Updates the character select ui
   */
  updateCharactersSelectUI() {
    this.isRedrawing = true
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const partitionedCharacters = this.matrixModel.getPartitionCharacters()

    // Get the selected values so that we can restore them when after we redraw the matrix.
    const selectedValues = this.characterSelect.getSelectedValues()
    const selectedIndicies: number[] = []
    for (let x = 0, length = selectedValues.length; x < length; ++x) {
      const characterId = parseInt(selectedValues[x], 10)
      const characterIndex = this.matrixModel.getCharacterIndexById(characterId)
      if (characterIndex >= 0) {
        selectedIndicies.push(characterIndex)
      }
    }

    // clear character items
    this.characterSelect.clearItems()

    // set up character items
    for (let x = 0; x < partitionedCharacters.length; x++) {
      const character = partitionedCharacters[x]
      const characterId = character.getId()
      const characterName =
        '[' +
        (character.getNumber() - numberingMode) +
        '] ' +
        character.getName()
      this.characterSelect.addItem(characterName, characterId)
    }

    // redraw character items
    this.characterSelect.redraw()
    if (selectedIndicies.length > 0) {
      this.characterSelect.setSelectedIndices(selectedIndicies)
    }
    this.isRedrawing = false
  }

  /**
   * Updates the taxa select ui
   */
  updateTaxaSelectUI() {
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const partitionedTaxa = this.matrixModel.getPartitionTaxa()
    this.isRedrawing = true

    // Get the selected values so that we can restore them when after we redraw the matrix.
    const selectedSourceTaxonId = parseInt(
      this.sourceTaxaSelect.getSelectedValue(),
      10
    )
    const selectedSourceIndex = this.matrixModel.getTaxonIndexById(
      selectedSourceTaxonId
    )
    const selectedDestinationTaxonId = parseInt(
      this.destinationTaxaSelect.getSelectedValue(),
      10
    )
    const selectedDestinationIndex = this.matrixModel.getTaxonIndexById(
      selectedDestinationTaxonId
    )

    // Remove previous menu items.
    this.sourceTaxaSelect.removeAllItems()
    this.destinationTaxaSelect.removeAllItems()
    this.sourceTaxaSelect.addItem({ text: 'Choose a taxon', value: -1 })
    this.destinationTaxaSelect.addItem({ text: 'Choose a taxon', value: -1 })
    for (let x = 0; x < partitionedTaxa.length; x++) {
      const taxon = partitionedTaxa[x]
      const taxonName =
        '[' +
        (taxon.getNumber() - numberingMode) +
        '] ' +
        mb.truncateString(mb.decodeHTMLEntities(taxon.getName()), 90)
      const taxonId = taxon.getId()
      this.sourceTaxaSelect.addItem({ text: taxonName, value: taxonId })
      this.destinationTaxaSelect.addItem({ text: taxonName, value: taxonId })
    }
    this.sourceTaxaSelect.redraw()
    this.destinationTaxaSelect.redraw()
    this.isRedrawing = false

    // This is done after drawing so that we can enable the buttons.
    this.sourceTaxaSelect.setSelectedIndex(selectedSourceIndex + 1)
    this.destinationTaxaSelect.setSelectedIndex(selectedDestinationIndex + 1)
  }

  /**
   * Handles when taxa or characters have changed
   */
  private copyRow() {
    const sourceTaxonId = parseInt(this.sourceTaxaSelect.getSelectedValue(), 10)
    const destinationTaxonId = parseInt(
      this.destinationTaxaSelect.getSelectedValue(),
      10
    )
    const selectedCharacterIds = mb.convertToNumberArray(
      this.characterSelect.getSelectedValues()
    )
    const shouldCopyNotes = this.copyNotesCheckbox.isChecked()
    const options = { batchmode: 1, copyNotes: +shouldCopyNotes }
    const savingLabel = this.dialog.getSavingLabel()
    savingLabel.saving()
    this.matrixModel
      .copyCellScores(
        sourceTaxonId,
        destinationTaxonId,
        selectedCharacterIds,
        options
      )
      .then(() => savingLabel.saved())
      .catch(() => savingLabel.failed())
  }

  /**
   * @return The HTML content for the batch row pane
   */
  static htmlContent(): string {
    return (
      '<section>' +
      '<i>' +
      BatchCopyPane.textCaption +
      '</i>' +
      '<header>Source Taxon</header>' +
      '<div class="source-taxaSelect"></div>' +
      '<header>Destination Taxon</header>' +
      '<div class="destination-taxaSelect"></div>' +
      '<header>Characters<label class="checkbox">Copy notes:&nbsp;&nbsp;</label></header>' +
      '<div class="characterSelect"></div>' +
      '</section>'
    )
  }
}

/**
 * Undo pane
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog the root dialog
 */
class BatchUndoPane extends BasePane {
  /**
   * The text caption for the undo pane. Describes how to batch undo.
   */
  private static readonly textCaption: string =
    'Changes that were made with the batch editor which can be undone.'
  private loadingElement: Element
  private gridTable: DataGridTable
  private selectedId: number = 0

  constructor(matrixModel: MatrixModel, dialog: BatchDialog) {
    super(matrixModel, dialog)
    this.loadingElement = this.getLoadingElement()
    this.gridTable = new DataGridTable()
    this.gridTable.setSelectable(true)
    this.registerDisposable(this.gridTable)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('mb-batch-undo-pane')
    element.innerHTML = BatchUndoPane.htmlContent()
    this.gridTable.addColumn('Date')
    this.gridTable.addColumn('Status')
    this.gridTable.addColumn('Description')
    const gridPane = this.getElementByClass('gridPane')
    this.gridTable.render(gridPane)
    this.loadUndoableOperations()
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(
      this.gridTable,
      EventType.SELECT,
      (e: CustomEvent<any>) => this.onHandleSelectionChange(e)
    )
  }

  override setDialogButtons() {
    this.dialog.showButtons([
      ModalDefaultButtons.DONE,
      Buttons.REFRESH_UNDO,
      Buttons.UNDO,
    ])
  }

  override onHandleSelect(e: CustomEvent) {
    switch (e.detail.key) {
      case ButtonKeys.REFRESH_UNDO:
        this.loadUndoableOperations()
        return false
      case ButtonKeys.UNDO:
        this.undoCellBatch()
        return false
      default:
        return true
    }
  }

  override setSelectedPositionsByIndices(
    characterIndex: number,
    taxonIndex: number
  ) {
    // Do nothing.
  }

  /**
   * Handles when taxa or characters have changed
   * @param e The event that triggerd this callback.
   */
  protected onHandleSelectionChange(e: CustomEvent) {
    this.selectedId = parseInt(e.detail.id, 10)
    const reverted = parseInt(e.detail.reverted, 10)
    this.shouldEnableButtons(!!this.selectedId && !reverted)
  }

  /**
   * Enables or Disables the 'Add' button
   * @param enabled Whether to enable or disable the add button
   */
  protected shouldEnableButtons(enabled: boolean) {
    if (!this.isInDocument()) {
      return
    }
    this.dialog.setButtonEnabled(Buttons.UNDO, enabled)
  }

  /**
   * @return an element which shows a loading indicator.
   */
  getLoadingElement(): Element {
    const loadingElement = document.createElement('div')
    loadingElement.classList.add('loadingMessage')
    const messageElement = document.createElement('div')
    messageElement.textContent = 'Loading...'
    loadingElement.appendChild(messageElement)
    return loadingElement
  }

  /**
   * Loads the cell comments from the server
   */
  loadUndoableOperations() {
    const element = this.getElement()
    element.appendChild(this.loadingElement)
    this.matrixModel
      .getCellBatchLogs()
      .then((operations) => {
        this.selectedId = 0
        this.redrawUndoGrid(operations)
      })
      .catch(() => alert('Failed to load undoable operations'))
      .finally(() => element.removeChild(this.loadingElement))
  }

  /**
   * Loads the cell comments from the server
   */
  undoCellBatch() {
    this.dialog.getSavingLabel().saving()
    this.matrixModel
      .undoCellBatch(this.selectedId)
      .then(() => {
        this.dialog.getSavingLabel().saved()
        this.loadUndoableOperations()
      })
      .catch((e) => {
        this.dialog.getSavingLabel().failed()
        alert(e)
        throw e
      })
  }

  /**
   * Redraws the grid table
   * @param operations the operations that will be used to redraw the grid
   */
  protected redrawUndoGrid(operations: { [key: string]: any }[]) {
    const rows: DataRow[] = []
    for (let x = 0; x < operations.length; x++) {
      const operation = operations[x]
      const date = new Date(operation['t'] * 1000)
      const datetime = date.toLocaleString()
      const revertedText = operation['r'] ? 'Undone' : 'Applied to Matrix'
      const row = {
        labels: [datetime, revertedText, operation['d']],
        data: { id: operation['id'], reverted: operation['r'] },
      }
      rows.push(row)
    }
    this.gridTable.clearRows()
    this.gridTable.addRows(rows)
    this.gridTable.redraw()
    this.shouldEnableButtons(false)
  }

  /**
   * @return The HTML content for the undo pane
   */
  static htmlContent(): string {
    return (
      '<section>' +
      '<i>' +
      BatchUndoPane.textCaption +
      '</i>' +
      '<p/>' +
      '<div class="gridPane"></div>' +
      '</section>'
    )
  }
}
