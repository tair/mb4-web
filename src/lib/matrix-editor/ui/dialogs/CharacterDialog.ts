import { Character, CharacterType } from '../../data/Characters'
import { SavingLabel } from '../SavingLabel'
import { Dropdown } from '../Dropdown'
import { CharacterState } from '../../data/Characters'
import { Partitions } from '../../data/Partitions'
import * as mb from '../../mb'
import { MatrixModel } from '../../MatrixModel'
import { AbstractItems } from '../../data/AbstractItems'
import { Citation } from '../../data/Citation'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import { CharacterRefreshedEvent } from '../../events/CharacterRefreshedEvent'
import * as CharacterRefreshedEvents from '../../events/CharacterRefreshedEvent'
import { MediaDroppedEvent } from '../../events/MediaDroppedEvent'
import * as MediaDroppedEvents from '../../events/MediaDroppedEvent'
import { ReorderEvent } from '../../events/ReorderEvent'
import * as ReorderEvents from '../../events/ReorderEvent'
import { AddCharacterCommentDialog } from './AddCharacterCommentDialog'
import { Checkbox } from '../Checkbox'
import { DataGridTable, DataRow } from '../DataGridTable'
import { Dialog } from '../Dialog'
import { DraggableMediaGrid } from '../DraggableMediaGrid'
import { LabelInput } from '../LabelInput'
import { TabNavigator } from '../TabNavigator'
import { AddCharacterMediaDialog } from './AddCharacterMediaDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { ImageViewerDialog } from './ImageViewerDialog'
import { ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'
import {
  Component,
  EventType,
  KeyCodes,
  MobileFriendlyClickEventType,
} from '../Component'
import { MediaGridItemEvent } from '../MediaGrid'
import { AddCitationDialog } from './AddCitationDialog'
import { EditCitationDialog } from './EditCitationDialog'

/**
 * The character list dialog which edits characters in the matrix.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxa, and cells.
 * @param characterId the id of the character to render for this dialog
 */
export class CharacterDialog extends Dialog {
  /**
   * The last selected tab index. Used to keep the tab the same across character dialogs.
   */
  private static LAST_SELECTED_TAB_INDEX: number = 0

  private readonly matrixModel: MatrixModel
  private characterId: number
  private readonly tabNavigator: TabNavigator

  constructor(matrixModel: MatrixModel, characterId: number) {
    super()
    this.matrixModel = matrixModel
    this.characterId = characterId

    this.tabNavigator = new TabNavigator()
    this.registerDisposable(this.tabNavigator)
  }

  protected override initialize(): void {
    this.setTitle('Character Editor')
    this.setDisposeOnHide(true)

    this.addButton(ModalDefaultButtons.DONE)
    this.addButton(Buttons.SAVE_CHANGES)
    this.addButton(Buttons.SAVE_CONTINOUS_CHANGES)
    this.addButton(Buttons.SET_UNREAD_COMMENT)
  }

  override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('characterDialog', 'modal-lg')

    const contentElement = this.getContentElement()
    contentElement.innerHTML = CharacterDialog.htmlContent()

    this.redraw()
    this.tabNavigator.render(contentElement)
    this.updateLastSelectedTabIndex()
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(this.tabNavigator, EventType.SELECT, () =>
        this.updateLastSelectedTabIndex()
      )
      .listen(this.getElement(), EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.checkPendingChangesOnKeyDown(e)
      )
      .listen(this.matrixModel, CharacterChangedEvents.TYPE, () =>
        this.updateCharacterName()
      )
      .listen(this.matrixModel, CharacterRefreshedEvents.TYPE, () =>
        this.updateCharacterName()
      )
  }

  /**
   * Redraws the character dialog
   */
  redraw() {
    const character = this.matrixModel.getCharacters().getById(this.characterId)
    if (character == null) {
      throw 'Failed to get character'
    }
    this.tabNavigator.clearTabs()
    const type = character!.getType()
    if (type === CharacterType.DISCRETE) {
      this.tabNavigator.addTab(
        'Character states',
        new CharacterPane(this.matrixModel, character, this.savingLabel, this)
      )
    } else {
      const title =
        type === CharacterType.CONTINUOUS
          ? 'Continuous character'
          : 'Meristic character'
      this.tabNavigator.addTab(
        title,
        new ContinuousCharacterPane(
          this.matrixModel,
          character,
          this.savingLabel,
          this
        )
      )
    }
    this.tabNavigator.addTab(
      'Media',
      new MediaPane(this.matrixModel, character, this.savingLabel, this)
    )
    this.tabNavigator.addTab(
      'Comments',
      new CommentsPane(this.matrixModel, character, this.savingLabel, this)
    )
    this.tabNavigator.addTab(
      'Citations',
      new CitationsPane(this.matrixModel, character, this.savingLabel, this)
    )
    this.tabNavigator.addTab(
      'Partitions',
      new PartitionsPane(this.matrixModel, character, this.savingLabel, this)
    )
    this.tabNavigator.addTab(
      'Change Log',
      new ChangelogPane(this.matrixModel, character, this.savingLabel, this)
    )
    this.tabNavigator.setSelectedTabIndex(
      CharacterDialog.LAST_SELECTED_TAB_INDEX
    )
    this.updateCharacterName()
  }

  /**
   * Updates the last selected tab index.
   */
  private updateLastSelectedTabIndex() {
    CharacterDialog.LAST_SELECTED_TAB_INDEX =
      this.tabNavigator.getSelectedTabIndex()
    this.tabNavigator.getSelectedTabComponent<BasePane>().setDialogButtons()
  }

  /**
   * Handles when the key down event is triggered on the dialog
   * @param e The event that triggerd this callback.
   * @return Whether this function handle the event.
   */
  private checkPendingChangesOnKeyDown(e: KeyboardEvent): boolean {
    if (
      (e.code === KeyCodes.LEFT || e.code === KeyCodes.RIGHT) &&
      this.tabNavigator.getSelectedTabComponent<BasePane>().hasPendingChanges()
    ) {
      const confirmDialog = new ConfirmDialog(
        'Confirm',
        EXIT_CONFIRM_CONTENT_TEXT,
        () => this.onKeyDown(e)
      )
      confirmDialog.setVisible(true)
      return true
    }
    return this.onKeyDown(e)
  }

  /**
   * Handles when the key down event is triggered on the dialog
   * @param e The event that triggerd this callback.
   * @return Whether this function handle the event.
   */
  private onKeyDown(e: KeyboardEvent): boolean {
    if (e.code === KeyCodes.LEFT || e.code === KeyCodes.RIGHT) {
      const pos = e.code === KeyCodes.LEFT ? -1 : 1
      const partitionCharacters = this.matrixModel.getPartitionCharacters()
      const nextCharacterIndex =
        this.matrixModel.getCharacterIndexById(this.characterId) + pos
      const nextCharacter = partitionCharacters[nextCharacterIndex]
      if (nextCharacter) {
        this.characterId = nextCharacter.getId()
        this.redraw()
        return true
      }
    }
    return false
  }

  /** @return The HTML content of the dialog */
  static htmlContent(): string {
    return '<div class="characterName"></div>'
  }

  /**
   * Update the character's name from the model
   */
  protected updateCharacterName() {
    const character = this.matrixModel.getCharacters().getById(this.characterId)
    const characterNameElement = this.getElementByClass('characterName')
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const characterName =
      '[' +
      (character!.getNumber() - numberingMode) +
      '] ' +
      mb.htmlEscape(character!.getName())
    characterNameElement.innerHTML =
      '<b>Now Editing</b>: ' +
      mb.truncateString(
        characterName,
        /* name database limit */
        1024
      )
  }
}

/**
 * Base pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param character the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 * @param dialog the containing dialog
 */
class BasePane extends Component {
  protected readonly matrixModel: MatrixModel
  protected character: Character
  protected savingLabel: SavingLabel
  protected dialog: Dialog

  protected constructor(
    matrixModel: MatrixModel,
    character: Character,
    savingLabel: SavingLabel,
    dialog: Dialog
  ) {
    super()

    this.matrixModel = matrixModel
    this.character = character
    this.savingLabel = savingLabel
    this.dialog = dialog
  }

  /**
   * Sets the dialog's buttons
   */
  setDialogButtons() {
    this.dialog.showButtons([ModalDefaultButtons.DONE])
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(
      this.matrixModel,
      CharacterRefreshedEvents.TYPE,
      (e: CustomEvent<CharacterRefreshedEvent>) =>
        this.handleCharacterRefreshedEvent(e)
    )
  }

  /**
   * Handles when characters have been refreshed.
   */
  private handleCharacterRefreshedEvent(
    e: CustomEvent<CharacterRefreshedEvent>
  ) {
    const charcterIds = e && e.detail.characterIds
    if (charcterIds && mb.contains(charcterIds, this.character.getId())) {
      this.reloadCharacter()
      this.redraw()
    }
  }

  /** Fetches the character again to pick up the changes. */
  reloadCharacter() {
    const character = this.matrixModel
      .getCharacters()
      .getById(this.character.getId())
    if (character) {
      this.character = character
    }
  }

  /** @return Indicates whether the pane has pending changes */
  hasPendingChanges(): boolean {
    return false
  }

  /** @return Indicates whether the pane's pending changes are valid. */
  isPendingChangesValid(): boolean {
    return true
  }

  /** Redraws the base pane based on event changes. */
  redraw() {}
}

/**
 * Continuous Character pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param character the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 * @param dialog the containing dialog
 */
class ContinuousCharacterPane extends BasePane {
  private characterChanged: boolean = false
  private majorEdit: boolean = false

  constructor(
    matrixModel: MatrixModel,
    character: Character,
    savingLabel: SavingLabel,
    dialog: Dialog
  ) {
    super(matrixModel, character, savingLabel, dialog)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = ContinuousCharacterPane.htmlContent(this.character)
    const nameInputElement =
      this.getElementByClass<HTMLInputElement>('nameInput')
    nameInputElement.value = this.character.getName()
    const descriptionElement =
      this.getElementByClass<HTMLInputElement>('descriptionInput')
    descriptionElement.value = this.character.getDescription()
  }

  override enterDocument() {
    super.enterDocument()
    const nameInputElement = this.getElementByClass('nameInput')
    const descriptionElement = this.getElementByClass('descriptionInput')
    const hasCharacterChangedCheck = () => this.hasCharacterChanged(false)
    this.getHandler()
      .listen(nameInputElement, EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.handleEnterPress(e)
      )
      .listen(nameInputElement, EventType.KEYUP, hasCharacterChangedCheck)
      .listen(descriptionElement, EventType.KEYUP, hasCharacterChangedCheck)
      .listen(descriptionElement, [EventType.KEYDOWN], (e: KeyboardEvent) =>
        this.handleEnterPress(e)
      )
      .listen(this.dialog, EventType.SELECT, (e: CustomEvent<any>) =>
        this.onHandleSelect(e)
      )
  }

  override setDialogButtons() {
    this.dialog.showButtons([
      ModalDefaultButtons.DONE,
      Buttons.SAVE_CONTINOUS_CHANGES,
    ])
    this.hasCharacterChanged(false)
  }

  override hasPendingChanges() {
    return this.characterChanged
  }

  /**
   * Determines whether the character has changed.
   * @param changed boolean indicating whether the character has changed
   */
  hasCharacterChanged(changed?: boolean) {
    const nameInputElement =
      this.getElementByClass<HTMLInputElement>('nameInput')
    const descriptionElement =
      this.getElementByClass<HTMLInputElement>('descriptionInput')
    this.characterChanged =
      this.characterChanged ||
      !!changed ||
      this.character.getName() !== nameInputElement.value ||
      mb.normalizeWhitespace(this.character.getDescription()) !==
        mb.normalizeWhitespace(descriptionElement.value)
    if (this.isInDocument()) {
      this.dialog.setButtonEnabled(
        Buttons.SAVE_CONTINOUS_CHANGES,
        this.characterChanged
      )
    }
  }

  /**
   * Updates the character with the current information
   * @param isMinorEdit Whether the character edited such that scores need to be revaluated
   */
  updateCharacter(isMinorEdit: boolean) {
    this.savingLabel.saving()
    const id = this.character.getId()
    const nameInputElement =
      this.getElementByClass<HTMLInputElement>('nameInput')
    const name = nameInputElement.value
    const descriptionElement =
      this.getElementByClass<HTMLInputElement>('descriptionInput')
    const description = descriptionElement.value
    this.matrixModel
      .updateCharacter(id, name, description, 0, [], isMinorEdit)
      .then(() => {
        nameInputElement.value = this.character.getName()
        descriptionElement.value = this.character.getDescription()
        this.characterChanged = false
        this.majorEdit = false
        this.hasCharacterChanged(false)
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * When the user clicks on the save button
   */
  handleSave() {
    const nameInputElement =
      this.getElementByClass<HTMLInputElement>('nameInput')
    this.majorEdit =
      this.majorEdit || this.character.getName() !== nameInputElement.value

    // The character should not be shown the warning confirmation dialog if the character was never
    // scored or if the change is a minor change.
    if (!this.majorEdit) {
      this.updateCharacter(true)
      return
    }
    const warningDialog = new ConfirmDialog(
      'Action',
      MINOR_CHANGES_CONTENT_TEXT,
      () => this.updateCharacter(false),
      () => this.updateCharacter(true)
    )
    warningDialog.setVisible(true)
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: CustomEvent) {
    if (e.detail.key === ButtonKeys.SAVE_CONTINOUS_CHANGES) {
      this.handleSave()
      return false
    }
    if (
      e.detail.key === ModalDefaultButtonKeys.CANCEL &&
      this.characterChanged
    ) {
      const confirmDialog = new ConfirmDialog(
        'Confirm',
        EXIT_CONFIRM_CONTENT_TEXT,
        () => this.dialog.dispose()
      )
      confirmDialog.setVisible(true)
      return false
    }
  }

  /**
   * Handlers events when for user key down events.
   *
   * @param e The event that triggerd this callback.
   */
  protected handleEnterPress(e: KeyboardEvent) {
    // Prevent the dialog from receiving the enter keycode which will close it.
    if (e.code === KeyCodes.ENTER) {
      const element = <HTMLElement>e.currentTarget
      element.blur()
      e.preventDefault()
    }
    e.stopPropagation()
  }

  /**
   * @param character the data associated with the matrix.
   * @return The HTML content for the comments pane
   */
  static htmlContent(character: Character): string {
    const type =
      character.getType() === CharacterType.CONTINUOUS
        ? 'Continuous'
        : 'Meristic'
    return (
      '<div class="characterPane">' +
      '<div class="label">Type</div>' +
      type +
      '<p></p>' +
      '<div class="label">Name</div>' +
      '<input class="nameInput" />' +
      '<p></p>' +
      '<div class="label">Notes</div>' +
      '<textarea class="descriptionInput"></textarea>' +
      '</div>'
    )
  }
}

/**
 * Character pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param character the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 * @param dialog the containing dialog
 */
class CharacterPane extends BasePane {
  private statesGridTable: DataGridTable
  protected orderingSelect: Dropdown
  private stateNameInputs: LabelInput[]
  private characterChanged: boolean
  private majorEdit: boolean
  private modifiedCharacterStates: CharacterState[]

  constructor(
    matrixModel: MatrixModel,
    character: Character,
    savingLabel: SavingLabel,
    dialog: Dialog
  ) {
    super(matrixModel, character, savingLabel, dialog)

    this.statesGridTable = new DataGridTable()
    this.statesGridTable.setDraggable(true)
    this.registerDisposable(this.statesGridTable)

    this.orderingSelect = new Dropdown()
    this.registerDisposable(this.orderingSelect)

    this.stateNameInputs = []
    this.characterChanged = false
    this.majorEdit = false

    this.modifiedCharacterStates = character.getStates()
    this.modifiedCharacterStates.sort(AbstractItems.sortNumberComparator)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = CharacterPane.htmlContent()

    const nameInputElement =
      this.getElementByClass<HTMLInputElement>('nameInput')
    nameInputElement.value = this.character.getName()

    const descriptionElement =
      this.getElementByClass<HTMLInputElement>('descriptionInput')
    descriptionElement.value = this.character.getDescription()

    const statesPane = this.getElementByClass('statesPane')
    this.statesGridTable.addColumn('#')
    this.statesGridTable.addColumn('State')
    this.statesGridTable.render(statesPane)

    this.orderingSelect.addItem({ text: 'Unordered', value: 0 })
    this.orderingSelect.addItem({ text: 'Ordered', value: 1 })
    this.orderingSelect.setSelectedIndex(this.character.getOrdering())
    this.orderingSelect.render()

    this.redrawCharacterStates()
  }

  override enterDocument() {
    super.enterDocument()
    const nameInputElement = this.getElementByClass('nameInput')
    const descriptionElement = this.getElementByClass('descriptionInput')
    const addStateElement = this.getElementByClass('addCharacterState')
    this.getHandler()
      .listen(nameInputElement, EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.handleEnterPress(e)
      )
      .listen(nameInputElement, EventType.KEYUP, () =>
        this.hasCharacterChanged(false)
      )
      .listen(nameInputElement, [EventType.PASTE, EventType.CUT], () =>
        this.hasCharacterChanged(true)
      )
      .listen(descriptionElement, EventType.KEYUP, () =>
        this.hasCharacterChanged(false)
      )
      .listen(descriptionElement, EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.handleEnterPress(e)
      )
      .listen(descriptionElement, [EventType.PASTE, EventType.CUT], () =>
        this.hasCharacterChanged(true)
      )
      .listen(this.dialog, EventType.SELECT, (e: CustomEvent<any>) =>
        this.onHandleSelect(e)
      )
      .listen(this.statesGridTable, EventType.CUT, (e: CustomEvent) =>
        this.handleRemoveCharacterState(e)
      )
      .listen(
        this.statesGridTable,
        ReorderEvents.TYPE,
        (e: CustomEvent<ReorderEvent>) => this.handleReorderCharacterState(e)
      )
      .listen(this.orderingSelect, EventType.CHANGE, () =>
        this.hasCharacterChanged(true)
      )
      .listen(addStateElement, EventType.CLICK, () =>
        this.handleAddCharacterState()
      )
  }

  override setDialogButtons() {
    this.dialog.showButtons([ModalDefaultButtons.DONE, Buttons.SAVE_CHANGES])
    this.hasCharacterChanged(false)
  }

  override hasPendingChanges() {
    return this.characterChanged
  }

  override isPendingChangesValid() {
    for (let x = 0, l = this.modifiedCharacterStates.length; x < l; ++x) {
      const modifiedCharacterStates = this.modifiedCharacterStates[x]
      if (modifiedCharacterStates.getName() === '') {
        return false
      }
    }
    return true
  }

  override redraw() {
    const nameInputElement =
      this.getElementByClass<HTMLInputElement>('nameInput')
    nameInputElement.value = this.character.getName()

    const descriptionElement =
      this.getElementByClass<HTMLInputElement>('descriptionInput')
    descriptionElement.value = this.character.getDescription()

    this.orderingSelect.setSelectedIndex(this.character.getOrdering())

    // Reset the cached character states and redraw the state grid.
    this.modifiedCharacterStates = this.character.getStates()
    this.modifiedCharacterStates.sort(AbstractItems.sortNumberComparator)
    this.redrawCharacterStates()
  }

  /**
   * Redraws the character states in the grid.
   */
  private redrawCharacterStates() {
    // dispose previous inputs
    const handler = this.getHandler()
    for (let x = 0; x < this.stateNameInputs.length; x++) {
      const stateNameInput = this.stateNameInputs[x]
      handler.unlisten(stateNameInput, [EventType.CHANGE, EventType.KEYDOWN])
      stateNameInput.dispose()
    }
    this.stateNameInputs = []
    const rows: DataRow[] = []
    for (let x = 0; x < this.modifiedCharacterStates.length; x++) {
      const characterState = this.modifiedCharacterStates[x]
      const characterStateId = characterState.getId()
      const characterName = characterState.getName()
      const stateInput = new LabelInput()
      stateInput.setValue(characterName)
      if (characterName.length > 85) {
        stateInput.setTooltip(characterName)
      }
      this.stateNameInputs.push(stateInput)
      const row = {
        labels: [characterState.getNumber().toString(), stateInput],
        removeable: true,
        removeableIndex: 1,
        data: { id: characterStateId },
      }
      rows.push(row)
    }
    this.statesGridTable.clearRows()
    this.statesGridTable.addRows(rows)
    this.statesGridTable.redraw()

    // We will need to attach the events when the labels have been rendered.
    for (let x = 0; x < this.stateNameInputs.length; x++) {
      const stateNameInput = this.stateNameInputs[x]
      const characterState = this.modifiedCharacterStates[x]
      const characterStateId = characterState.getId()
      handler.listen(stateNameInput, EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.handleEnterPress(e)
      )
      handler.listen(stateNameInput, EventType.CHANGE, () =>
        this.handleCharacterStateNameChanged(characterStateId, stateNameInput)
      )
    }
  }

  /**
   * Handlers events when for user key down events.
   *
   * @param e The event that triggerd this callback.
   */
  protected handleEnterPress(e: KeyboardEvent) {
    // Prevent the dialog from receiving the enter keycode which will close it.
    const target = <HTMLElement>e.currentTarget
    const descriptionElement = this.getElementByClass('descriptionInput')
    if (target !== descriptionElement && e.code === KeyCodes.ENTER) {
      target.blur()
      e.preventDefault()
    }
    e.stopPropagation()
  }

  /**
   * Handlers events when for user clicks on the add new character state link
   */
  private handleAddCharacterState() {
    const characterState = new CharacterState({
      id: -this.stateNameInputs.length,
      r: this.stateNameInputs.length,
      n: 'New State',
    })
    this.modifiedCharacterStates.push(characterState)

    // redraw character states
    this.redrawCharacterStates()

    // Focus and scroll into view
    const length = this.stateNameInputs.length
    const lastInsertedStateNameInput = this.stateNameInputs[length - 1]
    lastInsertedStateNameInput.focus()
    mb.scrollIntoContainerView(
      lastInsertedStateNameInput.getElement(),
      this.statesGridTable.getElement()
    )

    // enable the save button
    this.hasCharacterChanged(true)
    this.majorEdit = true
  }

  /**
   * Handlers events when for user clicks on the remove icon for the character
   * @param e The event that triggered this callback.
   */
  private handleRemoveCharacterState(e: CustomEvent) {
    // if the number of states is less than one don't remove the last state
    const stateId = parseInt(e.detail.id, 10)
    let x = 0
    for (; x < this.modifiedCharacterStates.length; ++x) {
      const characterState = this.modifiedCharacterStates[x]
      if (stateId === characterState.getId()) {
        mb.removeAt(this.modifiedCharacterStates, x)
        break
      }
    }

    // update numbers
    for (; x < this.modifiedCharacterStates.length; ++x) {
      const characterState = this.modifiedCharacterStates[x]
      characterState.setNumber(x)
    }

    // redraw
    this.redrawCharacterStates()
    this.hasCharacterChanged(true)
    this.majorEdit = true
  }

  /**
   * Handlers events when for user changes the character states in some way.
   * @param e The event that triggered this callback.
   */
  private handleReorderCharacterState(e: CustomEvent<ReorderEvent>) {
    const sourceIndex = e.detail.sourceIndex
    let targetIndex = e.detail.targetIndex
    if (sourceIndex === targetIndex) {
      return
    } else {
      if (sourceIndex < targetIndex) {
        --targetIndex
      }
    }
    const states = this.modifiedCharacterStates
    mb.moveItem(states, sourceIndex, targetIndex)

    // update numbers
    for (let x = 0; x < this.modifiedCharacterStates.length; ++x) {
      const characterState = this.modifiedCharacterStates[x]
      characterState.setNumber(x)
    }

    // redraw
    this.redrawCharacterStates()
    this.hasCharacterChanged(true)
    this.majorEdit = true
  }

  /**
   * Handlers events when for user modifies the character state name
   * @param labelInput The input.
   */
  private handleCharacterStateNameChanged(
    stateId: number,
    labelInput: LabelInput
  ) {
    let characterState
    for (let x = 0; x < this.modifiedCharacterStates.length; ++x) {
      if (stateId === this.modifiedCharacterStates[x].getId()) {
        characterState = this.modifiedCharacterStates[x]
        break
      }
    }
    if (characterState == null) {
      throw 'Failed to find state'
    }
    const stateName = labelInput.getValue()
    if (stateName.trim() === '') {
      alert('State name cannot be empty')
      labelInput.setValue(characterState.getName())
      return
    }
    characterState.setName(stateName)
    this.hasCharacterChanged(true)
    this.majorEdit = true
  }

  /**
   * Determines whether the character has changed.
   * @param changed boolean indicating whether the character has changed
   */
  hasCharacterChanged(changed?: boolean) {
    const nameInputElement =
      this.getElementByClass<HTMLInputElement>('nameInput')
    const descriptionElement =
      this.getElementByClass<HTMLInputElement>('descriptionInput')
    this.characterChanged =
      this.characterChanged ||
      !!changed ||
      this.character.getOrdering() !==
        parseInt(this.orderingSelect.getSelectedValue(), 10) ||
      this.character.getName() !== nameInputElement.value ||
      mb.normalizeWhitespace(this.character.getDescription()) !==
        mb.normalizeWhitespace(descriptionElement.value)
    if (this.isInDocument()) {
      const pendingChangesValid = this.isPendingChangesValid()
      this.dialog.setButtonEnabled(
        Buttons.SAVE_CHANGES,
        this.characterChanged && pendingChangesValid
      )
    }
  }

  /**
   * Updates the character with the current information
   * @param isMinorEdit Whether the character edited such that scores need to be revaluated
   */
  updateCharacter(isMinorEdit: boolean) {
    this.savingLabel.saving()
    const id = this.character.getId()
    const nameInputElement =
      this.getElementByClass<HTMLInputElement>('nameInput')
    const name = nameInputElement.value
    const descriptionElement =
      this.getElementByClass<HTMLInputElement>('descriptionInput')
    const description = descriptionElement.value
    const ordering = parseInt(this.orderingSelect.getSelectedValue(), 10)
    const states = this.modifiedCharacterStates.map((value) =>
      value.serialize()
    )
    this.matrixModel
      .updateCharacter(id, name, description, ordering, states, isMinorEdit)
      .then(() => {
        nameInputElement.value = this.character.getName()
        descriptionElement.value = this.character.getDescription()
        this.modifiedCharacterStates = this.character.getStates()
        this.redrawCharacterStates()
        this.characterChanged = false
        this.majorEdit = false
        this.hasCharacterChanged(false)
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * When the user clicks on the save button
   */
  handleSave() {
    const cells = this.matrixModel.getCells()
    const isScored = cells.isCharactersScored([this.character.getId()])
    const nameInputElement =
      this.getElementByClass<HTMLInputElement>('nameInput')
    this.majorEdit =
      this.majorEdit || this.character.getName() !== nameInputElement.value

    // The character should not be shown the warning confirmation dialog if the character was never
    // scored or if the change is a minor change.
    if (!isScored || !this.majorEdit) {
      this.updateCharacter(true)
      return
    }
    const warningDialog = new ConfirmDialog(
      'Action',
      MINOR_CHANGES_CONTENT_TEXT,
      () => this.updateCharacter(false),
      () => this.updateCharacter(true)
    )
    warningDialog.setVisible(true)
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: CustomEvent) {
    if (e.detail.key === ButtonKeys.SAVE_CHANGES) {
      this.handleSave()
      return false
    }
    if (
      e.detail.key === ModalDefaultButtonKeys.CANCEL &&
      this.characterChanged
    ) {
      const confirmDialog = new ConfirmDialog(
        'Confirm',
        EXIT_CONFIRM_CONTENT_TEXT,
        () => this.dialog.dispose()
      )
      confirmDialog.setVisible(true)
      return false
    }
  }

  /**
   * @return The HTML content for the comments pane
   */
  static htmlContent(): string {
    return (
      '<div class="characterPane">' +
      '<div class="label">Type</div> Discrete<p></p>' +
      '<div class="label">Name</div>' +
      '<input class="nameInput" />' +
      '<p></p>' +
      '<div class="label">Notes</div>' +
      '<textarea class="descriptionInput"></textarea>' +
      '<p></p>' +
      '<span class="addCharacterState">+ Add new</span>' +
      '<div class="statesPane"></div>' +
      '</div>'
    )
  }
}

/**
 * Media pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param character the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 * @param dialog the containing dialog
 */
class MediaPane extends BasePane {
  private readonly mediaGridTable: DataGridTable
  private readonly characterStateMedia: Map<number | null, DraggableMediaGrid>

  constructor(
    matrixModel: MatrixModel,
    character: Character,
    savingLabel: SavingLabel,
    dialog: Dialog
  ) {
    super(matrixModel, character, savingLabel, dialog)
    this.mediaGridTable = new DataGridTable()
    this.registerDisposable(this.mediaGridTable)
    this.characterStateMedia = new Map()
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = MediaPane.htmlContent()
    this.mediaGridTable.addColumn('#')
    this.mediaGridTable.addColumn('State')
    this.mediaGridTable.addColumn('Media')
    const mediaPane = this.getElementByClass('mediaPane')
    this.mediaGridTable.render(mediaPane)
    this.redrawCharacterMediaGrid()
  }

  override enterDocument() {
    super.enterDocument()
    const addCharacterMedia = this.getElementByClass('addCharacterMedia')
    this.getHandler()
      .listen(addCharacterMedia, EventType.CLICK, (e: CustomEvent<any>) =>
        this.handleShowAddCharacterMediaDialog(e)
      )
      .listen(
        this.mediaGridTable,
        MobileFriendlyClickEventType,
        (e: CustomEvent<any>) => this.handleShowAddCharacterMediaDialog(e)
      )
  }

  /**
   * Handles events when media are selected.
   * @param e The event that triggerd this callback.
   */
  protected handleDoubleClickCharacterMedia(
    e: CustomEvent<MediaGridItemEvent>
  ) {
    const item = e.detail.item
    const media = this.character.getMediaByIds([item.id])
    if (media && media.length > 0) {
      // Don't propagate the event
      e.stopPropagation()
      e.preventDefault()
      const medium = media[0]
      
      // Get project ID from matrix model
      const projectId = this.matrixModel.getProjectId()
      // medium.getId() returns link_id, medium.getMediaId() returns media_id
      const mediaId = medium.getMediaId() // Use actual media ID
      
      // Use new signature with project ID, respect matrix readonly state
      const readonly = this.matrixModel.isReadonly()
      const published = this.matrixModel.isPublished()
      ImageViewerDialog.show('C', mediaId, projectId, {}, readonly, null, published)
    }
    return true
  }

  /**
   * Redraws the character media grid
   */
  redrawCharacterMediaGrid() {
    const handler = this.getHandler()
    const characterStates = this.character.getStates()
    const rows: DataRow[] = []
    for (let x = 0; x < characterStates.length; x++) {
      const characterState = characterStates[x]
      const mediaGrid = new DraggableMediaGrid()
      mediaGrid.setRemoveable(true)
      const stateId = characterState.getId()
      this.characterStateMedia.set(stateId, mediaGrid)
      const row = {
        labels: [
          characterState.getNumber(),
          characterState.getName(),
          mediaGrid,
        ],
        data: { id: characterState.getId() },
      }
      rows.push(row)
    }
    const characterMediaGrid = new DraggableMediaGrid()
    characterMediaGrid.setRemoveable(true)
    this.characterStateMedia.set(null, characterMediaGrid)
    const row = { labels: [' ', 'Character', characterMediaGrid] }
    rows.push(row)
    const characterMedia = this.character.getMedia()
    for (let x = 0; x < characterMedia.length; x++) {
      const characterStateMedium = characterMedia[x]
      const stateId = characterStateMedium.getStateId()
      const mediaGrid = this.characterStateMedia.get(stateId)
      if (mediaGrid) {
        mediaGrid.addItem({
          id: characterStateMedium.getMediaId(),
          image: characterStateMedium.getTiny(),
        })
      }
    }

    this.mediaGridTable.clearRows()
    this.mediaGridTable.addRows(rows)
    this.mediaGridTable.redraw()

    // Attach the scrollable container after the element has been rendered.
    const characterStateMedia = this.characterStateMedia
    const scrollableContainer = this.mediaGridTable.getElementByClass('topGrid')
    characterStateMedia.forEach(function (firstMediaGrid) {
      firstMediaGrid.addScrollableContainer(scrollableContainer)
    })

    // Attach the event listeners after the grid has been rendered.
    for (const grid of Array.from(characterStateMedia.values())) {
      handler.listen(grid, EventType.CUT, (e) =>
        this.onRemoveCharacterMedia(grid, e)
      )
      handler.listen(grid, MediaDroppedEvents.TYPE, (e) =>
        this.onMoveCharacterMedia(grid, e)
      )
      handler.listen(
        grid,
        MobileFriendlyClickEventType,
        (e: CustomEvent<MediaGridItemEvent>) =>
          this.handleDoubleClickCharacterMedia(e)
      )
    }
  }

  /**
   * Add media ids to the character or character state
   *
   * @param stateId the state id to add the media to or zero for the character
   * @param mediaIds the media ids to add
   */
  protected addCharacterMedia(
    stateId: number | null,
    mediaIds: number[]
  ): Promise<void> {
    const characterId = this.character.getId()
    return this.matrixModel
      .addCharacterMedia(characterId, stateId, mediaIds)
      .then(() => {
        this.redrawMediaGrid(stateId)
      })
  }

  /**
   * Show the Add Character Media Dialog
   * @param e The event that triggered this callback.
   */
  protected handleShowAddCharacterMediaDialog(e: CustomEvent) {
    const stateId = parseInt(e && e.detail && e.detail.id, 10)
    const characterMediaDialog = new AddCharacterMediaDialog(
      this.character,
      (searchText) =>
        this.matrixModel.findCharacterMedia(this.character.getId(), searchText),
      (stateId, mediaIds) => this.addCharacterMedia(stateId, mediaIds),
      stateId
    )
    characterMediaDialog.setVisible(true)
  }

  /**
   * Handles when the users clicks the remove button for the character media
   *
   * @param mediaGrid The media grid invoked.
   * @param e The event that triggered this callback.
   */
  protected onRemoveCharacterMedia(
    mediaGrid: DraggableMediaGrid,
    e: CustomEvent
  ) {
    const item = e.detail.item
    const mediaId = parseInt(item.id, 10)
    const characterId = this.character.getId()
    const characterMedia = this.character.getMediaByIds([mediaId])
    const characterMedium = characterMedia[0]
    this.savingLabel.saving()
    return this.matrixModel
      .removeCharacterMedia(characterId, characterMedium.getId(), mediaId)
      .then(() => {
        this.savingLabel.saved()
        mediaGrid.removeItem(item)
        mediaGrid.redraw()
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
      })
  }

  /**
   * Redraws the media grid for a particular state
   * @param stateId The state to redraw
   */
  protected redrawMediaGrid(stateId: number | null) {
    const mediaGrid = this.characterStateMedia.get(stateId)
    if (mediaGrid == null) {
      return
    }

    mediaGrid.clear()
    const characterMedia = this.character.getMedia()
    for (let x = 0; x < characterMedia.length; x++) {
      const characterMedium = characterMedia[x]
      const characterMediumStateId = characterMedium.getStateId()
      if (characterMediumStateId === stateId) {
        mediaGrid.addItem({
          id: characterMedium.getMediaId(),
          image: characterMedium.getTiny(),
        })
      }
    }
    mediaGrid.redraw()
  }

  /**
   * Handles when the users drop and drag media to other states
   * @param mediaGrid The media grid invoked.
   * @param e The event that triggered this callback.
   */
  protected onMoveCharacterMedia(
    mediaGrid: DraggableMediaGrid,
    e: CustomEvent<MediaDroppedEvent>
  ) {
    let newStateId: number
    this.characterStateMedia.forEach(function (grid, key) {
      if (mediaGrid === grid) {
        newStateId = key
      }
    })
    if (newStateId === undefined) {
      alert('Unable to determine moved character state')
      return
    }
    const characterId = this.character.getId()
    const mediaId = e.detail.mediaId
    const characterMedia = this.character.getMediaByIds([mediaId])
    const characterMedium = characterMedia[0]

    // If the states are the same, we should not move the character state
    if (characterMedium.getStateId() === newStateId) {
      return
    }

    this.savingLabel.saving()
    return this.matrixModel
      .moveCharacterMedia(
        characterId,
        newStateId,
        characterMedium.getId(),
        mediaId
      )
      .then((oldStateId) => {
        this.savingLabel.saved()
        this.redrawMediaGrid(newStateId)
        this.redrawMediaGrid(oldStateId)
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
      })
  }

  /**
   * @return The HTML content for the comments pane
   */
  static htmlContent(): string {
    return '<span class="addCharacterMedia">+ Add new</span><div class="mediaPane"></div>'
  }
}

/**
 * Comments pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param character the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 * @param dialog the containing dialog
 */
class CommentsPane extends BasePane {
  private loadingElement: Element
  private commentsGridTable: DataGridTable

  constructor(
    matrixModel: MatrixModel,
    character: Character,
    savingLabel: SavingLabel,
    dialog: Dialog
  ) {
    super(matrixModel, character, savingLabel, dialog)
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
    this.commentsGridTable.addColumn('State')
    this.commentsGridTable.addColumn('Comment')
    const commentsPane = this.getElementByClass('commentsPane')
    this.commentsGridTable.render(commentsPane)
    this.loadCharacterComments()
  }

  override enterDocument() {
    super.enterDocument()
    const addCommentElement = this.getElementByClass('addCellComment')
    this.getHandler()
      .listen(addCommentElement, EventType.CLICK, () =>
        this.handleShowAddCharacterCommentDialog()
      )
      .listen(this.dialog, EventType.SELECT, (e: KeyboardEvent) =>
        this.onHandleSelect(e)
      )
  }

  override setDialogButtons() {
    this.dialog.showButtons([
      ModalDefaultButtons.DONE,
      Buttons.SET_UNREAD_COMMENT,
    ])
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: KeyboardEvent) {
    if (e.key === ButtonKeys.SET_UNREAD_COMMENT) {
      this.savingLabel.saving()
      this.matrixModel
        .setCharacterCommentsAsUnread(this.character.getId())
        .then(() => {
          this.savingLabel.saved()
        })
        .catch((e) => {
          this.savingLabel.failed()
          alert(e)
          throw e
        })
      return false
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
  loadCharacterComments() {
    const element = this.getElement()
    element.appendChild(this.loadingElement)
    const characterId = this.character.getId()
    this.matrixModel
      .getCharacterComments(characterId)
      .then((comments) => {
        if (this.isInDocument()) {
          this.redrawCharacterComments(comments)
        }
      })
      .catch(() => alert('Failed to load character comments'))
      .finally(() => element.removeChild(this.loadingElement))
  }

  /**
   * Adds a cell comment
   * @param stateId the id of state to add the comment to
   * @param comment the comment to add
   */
  addCharacterComments(stateId: number, comment: string) {
    this.savingLabel.saving()
    const characterId = this.character.getId()
    return this.matrixModel
      .addCharacterComment(characterId, stateId, comment)
      .then(() => {
        // reload comments grid
        this.loadCharacterComments()
        this.savingLabel.saved()
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
        throw e
      })
  }

  /**
   * Redraws the character comments within the comment grid.
   * @param comments the comments that will be used to redraw the grid
   */
  redrawCharacterComments(comments: { [key: string]: any }[]) {
    const rows: DataRow[] = []
    for (let x = 0; x < comments.length; x++) {
      const comment = comments[x]
      const date = new Date(comment['created_on'] * 1000)
      const datetime = date.toLocaleString()
      const row = {
        labels: [
          datetime,
          comment['user'],
          comment['statename'],
          mb.htmlEscapeWithLineBreaks(comment['comment']),
        ],
        data: { id: comment['id'] },
      }
      rows.push(row)
    }
    this.commentsGridTable.clearRows()
    this.commentsGridTable.addRows(rows)
    this.commentsGridTable.redraw()
  }

  /**
   * Shows the comment dialog
   */
  handleShowAddCharacterCommentDialog() {
    const commentDialog = new AddCharacterCommentDialog(
      this.character,
      (stateId, comment) => this.addCharacterComments(stateId, comment)
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
 * Citations pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param character the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 * @param dialog the containing dialog
 */
class CitationsPane extends BasePane {
  /**
   * The duplicate citation error text
   */
  private static DUPLICATE_CITATION_TEXT: string =
    'You have already added this citation to this ' +
    'character. You can only add a citation to a Character once.'

  /**
   * The last inserted citation will be used to re-insert citations across character dialogs.
   */
  private static lastInsertedCitation: {
    id: number
    pages: string
    notes: string
    title: string
  } | null

  private loadingElement: Element
  private citationsGridTable: DataGridTable

  constructor(
    matrixModel: MatrixModel,
    character: Character,
    savingLabel: SavingLabel,
    dialog: Dialog
  ) {
    super(matrixModel, character, savingLabel, dialog)
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
    this.loadCharacterCitations()
  }

  override enterDocument() {
    super.enterDocument()
    const addCitationElement = this.getElementByClass('addCitation')
    const addLastCitationElement = this.getElementByClass('addLastCitation')
    this.getHandler()
      .listen(this.citationsGridTable, EventType.CUT, (e: CustomEvent<any>) =>
        this.handleRemoveCharacterCitation(e)
      )
      .listen(
        this.citationsGridTable,
        EventType.SELECT,
        (e: CustomEvent<any>) => this.handleSelectCharacterCitation(e)
      )
      .listen(addCitationElement, EventType.CLICK, () =>
        this.handleShowAddCharacterCitationDialog()
      )
      .listen(addLastCitationElement, EventType.CLICK, () =>
        this.handleAddLastCharacterCitationClick()
      )
  }

  /**
   * @return an element which shows a loading indicator.
   */
  getLoadingElement(): Element {
    const loadingElement = document.createElement('div')
    loadingElement.classList.add('loadingComments')
    const messageElement = document.createElement('div')
    messageElement.textContent = 'Loading citations...'
    loadingElement.appendChild(messageElement)
    return loadingElement
  }

  /**
   * Loads the cell citations from the server
   */
  loadCharacterCitations() {
    const element = this.getElement()
    element.appendChild(this.loadingElement)
    const characterId = this.character.getId()
    this.matrixModel
      .getCharacterCitations(characterId)
      .then((citations) => {
        if (this.isInDocument()) {
          this.redrawCharacterCitations(citations)
        }
      })
      .catch(() => alert('Failed to load character citations'))
      .finally(() => element.removeChild(this.loadingElement))
  }

  /**
   * Handles events when citations are removed.
   * @param e The event that triggerd this callback.
   */
  protected handleSelectCharacterCitation(e: CustomEvent) {
    const id = parseInt(e.detail['id'], 10)
    const citation = this.character.getCitationById(id)
    if (!citation) {
      alert('Citation no longer exists')
      return
    }
    const editCitationDialog = new EditCitationDialog(
      citation,
      (pages, notes) => this.handleEditCharacterCitation(id, pages, notes)
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
  handleEditCharacterCitation(
    id: number,
    pages: string,
    notes: string
  ): Promise<void> {
    const citation = this.character.getCitationById(id)
    if (citation == null) {
      return Promise.resolve()
    }

    // nothing has changed so we don't have to update citation
    if (citation.getPages() === pages && citation.getNotes() === notes) {
      return Promise.resolve()
    }

    this.savingLabel.saving()
    const characterId = this.character.getId()
    return this.matrixModel
      .upsertCharacterCitation(
        characterId,
        id,
        citation.getCitationId(),
        pages,
        notes
      )
      .then(() => {
        const citations = this.character.getCitations()
        this.redrawCharacterCitations(citations)
        this.savingLabel.saved()
      })
      .catch(() => {
        alert('Failed to save character citations')
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
  handleAddCharacterCitation(
    citationId: number,
    pages: string,
    notes: string
  ): Promise<void> {
    // Ensure that the citation is not already present in the character
    const citations = this.character.getCitationsByCitationId(citationId)
    for (let x = 0, l = citations.length; x < l; x++) {
      const citation = citations[x]
      if (citation.getPages() === pages) {
        return Promise.reject(CitationsPane.DUPLICATE_CITATION_TEXT)
      }
    }

    this.savingLabel.saving()
    const characterId = this.character.getId()
    return this.matrixModel
      .upsertCharacterCitation(characterId, null, citationId, pages, notes)
      .then((addedCitation) => {
        CitationsPane.lastInsertedCitation = {
          id: addedCitation.getCitationId(),
          pages: addedCitation.getPages(),
          notes: addedCitation.getNotes(),
          title: addedCitation.getName(),
        }
        const citations = this.character.getCitations()
        this.redrawCharacterCitations(citations)
        this.savingLabel.saved()
      })
      .catch((e) => {
        this.savingLabel.failed()
        throw e
      })
  }

  /**
   * Adds the last citation used.
   */
  handleAddLastCharacterCitationClick() {
    const lastCitation = CitationsPane.lastInsertedCitation
    if (lastCitation) {
      // We temporarily remove the last inserted citation so that the user doesn't double click the link.
      CitationsPane.lastInsertedCitation = null
      this.handleAddCharacterCitation(
        lastCitation.id,
        lastCitation.pages,
        lastCitation.notes
      ).catch((e) => {
        CitationsPane.lastInsertedCitation = lastCitation
        alert(e)
      })
    }
  }

  /**
   * Show the add character citation dialog.
   */
  handleShowAddCharacterCitationDialog() {
    const addCitationDialog = new AddCitationDialog(
      this.matrixModel,
      (citationId, pages, notes) =>
        this.handleAddCharacterCitation(citationId, pages, notes)
    )
    addCitationDialog.setVisible(true)
  }

  /**
   * Redraws the cell citations within the citation grid.
   * @param citations the citations that will be used to redraw the grid
   */
  redrawCharacterCitations(citations: Citation[]) {
    const rows: DataRow[] = []
    for (let x = 0; x < citations.length; x++) {
      const citation = citations[x]
      const row = {
        labels: [citation.getName(), citation.getPages(), citation.getNotes()],
        removeable: true,
        data: { id: citation.getId() },
      }
      rows.push(row)
    }
    this.citationsGridTable.clearRows()
    this.citationsGridTable.addRows(rows)
    this.citationsGridTable.redraw()
    const lastInsertedCitation = CitationsPane.lastInsertedCitation
    if (lastInsertedCitation) {
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
  protected handleRemoveCharacterCitation(e: CustomEvent) {
    const id = parseInt(e.detail.id, 10)
    this.savingLabel.saving()
    const characterId = this.character.getId()
    return this.matrixModel
      .removeCharacterCitation(characterId, id)
      .then(() => {
        this.redrawCharacterCitations(this.character.getCitations())
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
 * Partitions pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param character the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 * @param dialog the containing dialog
 */
class PartitionsPane extends BasePane {
  private partitions: Partitions
  private partitionGridTable: DataGridTable
  private partitionCheckboxes: Checkbox[] = []

  constructor(
    matrixModel: MatrixModel,
    character: Character,
    savingLabel: SavingLabel,
    dialog: Dialog
  ) {
    super(matrixModel, character, savingLabel, dialog)
    this.partitions = this.matrixModel.getPartitions()
    this.partitionGridTable = new DataGridTable()
    this.registerDisposable(this.partitionGridTable)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('partitionPane')
    this.partitionGridTable.addColumn('&nbsp;')
    this.partitionGridTable.addColumn('Partition')
    this.partitionGridTable.render(element)
    this.setCharacterPartitions()
  }

  /** Render the character's partitions */
  setCharacterPartitions() {
    this.partitionGridTable.clearRows()

    // clear out the previous checkboxes
    for (let x = 0; x < this.partitionCheckboxes.length; x++) {
      const checkbox = this.partitionCheckboxes[x]
      checkbox.dispose()
    }
    const characterId = this.character.getId()
    const partitions = this.partitions.getPartitions()
    const rows: DataRow[] = []
    for (let x = 0; x < partitions.length; x++) {
      const partition = partitions[x]
      const checkbox = new Checkbox(characterId)
      checkbox.setChecked(partition.containsCharacter(characterId))
      this.partitionGridTable.registerDisposable(checkbox)
      this.partitionCheckboxes.push(checkbox)
      const row = {
        labels: [checkbox, partition.getName()],
        data: { partitionid: partition.getId() },
      }
      rows.push(row)
    }
    this.partitionGridTable.addRows(rows)
    this.partitionGridTable.redraw()

    // Draw this after the grid was rendered because the checkbox's element is not rendered yet.
    const handler = this.getHandler()
    for (let x = 0; x < this.partitionCheckboxes.length; x++) {
      const checkbox = this.partitionCheckboxes[x]
      const partition = partitions[x]
      handler.listen(checkbox, EventType.CHANGE, () =>
        this.onPartitionChange(partition.getId(), checkbox)
      )
    }
  }

  /**
   * Change the inclusion of this character in the specified partition.
   *
   * @param partitionId the id of the partition to change
   * @param checkbox The checkbox that was clicked.
   */
  onPartitionChange(partitionId: number, checkbox: Checkbox) {
    // Depending on whether the partition checkbox is checked, let's add/remove the character to/from the partition.
    const alterCharacterInPartition = checkbox.isChecked()
      ? (partitionId: number, characterIds: number[]) =>
          this.matrixModel.addCharactersToPartition(partitionId, characterIds)
      : (partitionId: number, characterIds: number[]) =>
          this.matrixModel.removeCharactersFromPartition(
            partitionId,
            characterIds
          )
    const characterId = this.character.getId()
    this.savingLabel.saving()
    alterCharacterInPartition(partitionId, [characterId])
      .then(() => {
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }
}

/**
 * Change log pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param character the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 * @param dialog the containing dialog
 */
class ChangelogPane extends BasePane {
  private readonly loadingElement: Element
  private readonly changelogGridTable: DataGridTable

  constructor(
    matrixModel: MatrixModel,
    character: Character,
    savingLabel: SavingLabel,
    dialog: Dialog
  ) {
    super(matrixModel, character, savingLabel, dialog)

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
    this.changelogGridTable.addColumn('Change')
    this.changelogGridTable.addColumn('Changes')
    this.changelogGridTable.render(element)
    this.loadCharacterChanges()
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
  loadCharacterChanges() {
    const id = this.character.getId()
    const element = this.getElement()
    element.appendChild(this.loadingElement)
    this.matrixModel
      .getCharacterChanges(id)
      .then((changes: { [key: string]: any }[]) => {
        if (!this.isInDocument()) {
          return
        }
        const rows: DataRow[] = []
        for (let x = 0; x < changes.length; x++) {
          const change = changes[x]
          const row = {
            labels: [
              change['datetime'],
              change['user'],
              change['changetype'],
              change['changes'],
            ],
          }
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

/**
 * The warning text for the confirmation dialog after a user has scored the character.
 */
const MINOR_CHANGES_CONTENT_TEXT: string =
  'You have just changed the wording of a ' +
  'character or state that has already been scored for some taxa. Do you wish to trigger a warning (!) that ' +
  "taxa already coded must be checked or is the change trivial?<p/> Selecting 'Yes' means that the change " +
  "was major and will trigger a (!) warning for the character. Selecting 'No' means that this change is " +
  'trival and will not trigger a warning'

/**
 * The warning text for the confirmation dialog after the user tries to close the character dialog while there are
 * changes that have not been saved.
 */
const EXIT_CONFIRM_CONTENT_TEXT: string =
  'You have not saved changes to this ' +
  "character and/or it's states. Are you sure you want to exit without saving?"

/**
 * The keys used to identify additional buttons in events.
 */
const ButtonKeys = {
  SAVE_CHANGES: 'save',
  SAVE_CONTINOUS_CHANGES: 'save_cont',
  SET_UNREAD_COMMENT: 'unread',
}

/**
 * The keys used to identify additional buttons in events.
 */
const ButtonLabels = {
  SAVE_CHANGES: 'Save Changes',
  SET_UNREAD_COMMENT: 'Mark comments as unread',
}

/**
 * The standard buttons (keys associated with captions).
 */
const Buttons = {
  SAVE_CHANGES: {
    text: ButtonLabels.SAVE_CHANGES,
    key: ButtonKeys.SAVE_CHANGES,
    dismissable: false,
  },
  SAVE_CONTINOUS_CHANGES: {
    text: ButtonLabels.SAVE_CHANGES,
    key: ButtonKeys.SAVE_CONTINOUS_CHANGES,
    dismissable: false,
  },
  SET_UNREAD_COMMENT: {
    text: ButtonLabels.SET_UNREAD_COMMENT,
    key: ButtonKeys.SET_UNREAD_COMMENT,
    dismissable: false,
  },
}
