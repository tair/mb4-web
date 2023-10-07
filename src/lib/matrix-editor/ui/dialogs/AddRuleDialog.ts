import { TabNavigator } from '../TabNavigator'
import { MatrixModel } from '../../MatrixModel'
import { Component, EventType } from '../Component'
import { Dialog } from '../Dialog'
import { ModalDefaultButtons } from '../Modal'
import { Select } from '../Select'
import { CharacterRules } from '../../data/CharacterRules'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import * as mb from '../../mb'

/**
 * Add character rule dialog.
 *
 * @param matrixModel the data associated with the matrix.
 */
export class AddRuleDialog extends Dialog {
  /**
   * The keys used to label additional buttons in dialog.
   */
  private static readonly ButtonLabels = { ADD: 'Add' }

  /**
   * The keys used to keys additional buttons in dialog.
   */
  private static readonly ButtonKeys = { ADD: 'add' }

  /**
   * Buttons for this dialog.
   */
  private static readonly Buttons = {
    ADD: {
      text: AddRuleDialog.ButtonLabels.ADD,
      key: AddRuleDialog.ButtonKeys.ADD,
      dismissable: false,
    },
  }
  private tabNavigator: TabNavigator

  constructor(private matrixModel: MatrixModel) {
    super()

    this.tabNavigator = new TabNavigator()
    this.registerDisposable(this.tabNavigator)
  }

  protected override initialize() {
    this.savingLabel.setText('Adding...')

    this.setTitle('Add ontology')
    this.setHasTitleCloseButton(false)
    this.addButton(AddRuleDialog.Buttons.ADD)
    this.addButton(ModalDefaultButtons.DONE)
  }

  protected override createDom() {
    super.createDom()
    const element = this.getContentElement()
    element.classList.add('addRuleDialog')

    this.tabNavigator.addTab(
      'Scoring',
      new AddScoringPane(this.matrixModel, this)
    )
    this.tabNavigator.addTab(
      'Add media',
      new AddMediaPane(this.matrixModel, this)
    )

    const contentElement = this.getContentElement()
    this.tabNavigator.render(contentElement)
  }

  protected override enterDocument() {
    super.enterDocument()

    const handler = this.getHandler()
    handler.listen(this, EventType.SELECT, (e: CustomEvent<any>) =>
      this.onHandleSelect(e)
    )
  }

  /**
   * Selects the tab at the given index.
   * @param index Index of the tab to select (-1 to select none).
   */
  setSelectedTabIndex(index: number) {
    this.tabNavigator.setSelectedTabIndex(index)
  }

  /**
   * Enables or Disables the 'Add' button
   * @param enabled Whether to enable or disable the add button
   */
  enableAddButton(enabled: boolean) {
    if (!this.isInDocument()) {
      return
    }
    this.setButtonEnabled(AddRuleDialog.Buttons.ADD, enabled)
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: CustomEvent) {
    if (e.detail.key === AddRuleDialog.ButtonKeys.ADD) {
      this.addCharacterRule()
      return false
    }
  }

  /**
   * Adds a partition.
   */
  private addCharacterRule() {
    this.savingLabel.saving()
    const pane = this.tabNavigator.getSelectedTabComponent<AddRuleComponent>()
    pane
      .addCharacterRule()
      .then(() => {
        this.savingLabel.saved()
      })
      .catch((e: Error) => {
        this.savingLabel.failed()
        alert(e)
        throw e
      })
  }
}

abstract class AddRuleComponent extends Component {
  /**
   * Adds a character rule to the matrix.
   *
   * @return The promise that the character rule was added
   */
  abstract addCharacterRule(): Promise<void>
}

/**
 * Pane for the Add Scoring Rules tab.
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog The owning dialog
 */
class AddScoringPane extends AddRuleComponent {
  private readonly characterSelect: Select
  private readonly characterStateSelect: Select
  private readonly actionCharacterSelect: Select
  private readonly actionCharacterStateSelect: Select

  constructor(private matrixModel: MatrixModel, private dialog: AddRuleDialog) {
    super()

    this.characterSelect = new Select()
    this.registerDisposable(this.characterSelect)

    this.characterStateSelect = new Select()
    this.registerDisposable(this.characterStateSelect)

    this.actionCharacterSelect = new Select()
    this.actionCharacterSelect.setAllowMultipleSelection(true)
    this.registerDisposable(this.actionCharacterSelect)

    this.actionCharacterStateSelect = new Select()
    this.registerDisposable(this.actionCharacterStateSelect)
  }

  protected override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('addStateRule')
    element.innerHTML = AddScoringPane.htmlContent()

    setCharacterSelect(this.matrixModel, this.characterSelect)
    setCharacterSelect(this.matrixModel, this.actionCharacterSelect)

    const characterElement = this.getElementByClass('charactersSelect')
    this.characterSelect.render(characterElement)

    const characterStatesElement = this.getElementByClass(
      'characterstatesSelect'
    )
    this.characterStateSelect.render(characterStatesElement)

    const actionCharacterElement = this.getElementByClass(
      'actionCharactersSelect'
    )
    this.actionCharacterSelect.render(actionCharacterElement)

    const actionCharacterStatesElement = this.getElementByClass(
      'actionCharacterstatesSelect'
    )
    this.actionCharacterStateSelect.render(actionCharacterStatesElement)
  }

  protected override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(this.matrixModel, CharacterChangedEvents.TYPE, () =>
        this.handleCharacterChange()
      )
      .listen(this.characterSelect, EventType.SELECT, () =>
        this.handleCharacterSelect()
      )
      .listen(this.actionCharacterSelect, EventType.SELECT, () =>
        this.handleActionCharacterSelect()
      )
      .listen(this.actionCharacterStateSelect, EventType.SELECT, () =>
        this.handleActionCharacterStateSelect()
      )
    this.characterSelect.setSelectedIndex(0)
  }

  addCharacterRule(): Promise<void> {
    const characterStateSelectedValue =
      this.characterStateSelect.getSelectedValue()
    const stateId = characterStateSelectedValue
      ? parseInt(characterStateSelectedValue, 10)
      : 0

    const actionCharacterStateSelectValue =
      this.actionCharacterStateSelect.getSelectedValue()
    const actionStateId = actionCharacterStateSelectValue
      ? parseInt(actionCharacterStateSelectValue, 10)
      : 0

    const characterSelectValue = this.characterSelect.getSelectedValue()
    const characterId = characterSelectValue
      ? parseInt(characterSelectValue, 10)
      : 0
    const actionCharacterId = this.actionCharacterSelect
      .getSelectedValues()
      .map((v) => parseInt(v))
    return this.matrixModel.addCharacterRuleAction(
      CharacterRules.SET_STATE,
      characterId,
      stateId || null,
      actionCharacterId,
      actionStateId || null
    )
  }

  /**
   * Handles when characters have changed
   */
  private handleCharacterChange() {
    setCharacterSelect(this.matrixModel, this.characterSelect)
    setCharacterSelect(this.matrixModel, this.actionCharacterSelect)
  }

  /**
   * Handles the select event on the character select.
   */
  private handleCharacterSelect() {
    const selectedValue = this.characterSelect.getSelectedValue()
    const characterId = selectedValue ? parseInt(selectedValue, 10) : 0
    this.setCharacterStateSelect(this.characterStateSelect, characterId)

    const characterSelectIndex = this.characterSelect.getLastSelectedIndex()
    this.actionCharacterSelect.setSelectedIndex(characterSelectIndex + 1)

    this.characterStateSelect.setSelectedIndex(0)
    this.dialog.enableAddButton(
      isDistinctCharacterSelect(
        this.characterSelect,
        this.actionCharacterSelect
      )
    )
  }

  /**
   * Handles the select event on the action character select.
   */
  private handleActionCharacterSelect() {
    const selectedValue = this.actionCharacterSelect.getSelectedValue()
    const characterId = selectedValue ? parseInt(selectedValue, 10) : 0
    this.setCharacterStateSelect(this.actionCharacterStateSelect, characterId)

    this.actionCharacterStateSelect.setSelectedIndex(0)
    this.dialog.enableAddButton(
      isDistinctCharacterSelect(
        this.characterSelect,
        this.actionCharacterSelect
      )
    )
  }

  /**
   * Handles the select event on the action character state select
   */
  private handleActionCharacterStateSelect() {
    const actionCharacterStateSelectValue =
      this.actionCharacterStateSelect.getSelectedValue()
    const selectedCharacterStates = actionCharacterStateSelectValue
      ? parseInt(actionCharacterStateSelectValue, 10)
      : 0

    // this will ensure that if we're selecting multiple characters, we only want to select the inapplicable state
    // otherwise let's set it to the last selected character
    if (
      selectedCharacterStates !== 0 &&
      this.actionCharacterSelect.getSelectedValues().length > 1
    ) {
      const selectedCharacterStateIndex =
        this.actionCharacterStateSelect.getLastSelectedIndex()
      this.actionCharacterSelect.setSelectedIndex(
        this.actionCharacterSelect.getLastSelectedIndex()
      )

      // since the action character will reset the state, let's set it back
      this.actionCharacterStateSelect.setSelectedIndex(
        selectedCharacterStateIndex
      )
    }
  }

  /**
   * Updates the character state select
   *
   * @param characterStateSelect The character state select
   * @param characterId The character id to retrieve the states.
   */
  private setCharacterStateSelect(
    characterStateSelect: Select,
    characterId: number
  ) {
    const character = this.matrixModel.getCharacters().getById(characterId)
    if (!character) {
      return
    }
    characterStateSelect.clearItems()
    characterStateSelect.addItem('[-] Inapplicable', 0)
    const characterStates = character.getStates()
    for (let x = 0; x < characterStates.length; x++) {
      const characterState = characterStates[x]
      const characterStateId = characterState.getId()
      const characterStateName =
        '[' + characterState.getNumber() + '] ' + characterState.getName()
      characterStateSelect.addItem(characterStateName, characterStateId)
    }
    if (characterStateSelect.isInDocument()) {
      characterStateSelect.redraw()
    }
  }

  /**
   * @return The HTML content of the Add Scoring pane
   */
  private static htmlContent(): string {
    return (
      '<div class="header">When setting this character to this state...</div>' +
      '<div class="characters nonSelectable">' +
      '<div class="charactersSelect">Character</div>' +
      '<div class="characterstatesSelect">State</div>' +
      '</div>' +
      '<div class="header">... automatically set this character to this state</div>' +
      '<div class="actionCharacters nonSelectable">' +
      '<div class="actionCharactersSelect">Character</div>' +
      '<div class="actionCharacterstatesSelect">State</div>' +
      '</div>'
    )
  }
}

/**
 * Pane for the Add Media Rules tab.
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog The owning dialog
 */

class AddMediaPane extends AddRuleComponent {
  private characterSelect: Select
  private actionCharacterSelect: Select

  constructor(private matrixModel: MatrixModel, private dialog: AddRuleDialog) {
    super()

    this.characterSelect = new Select()
    this.registerDisposable(this.characterSelect)

    this.actionCharacterSelect = new Select()
    this.actionCharacterSelect.setAllowMultipleSelection(true)
    this.registerDisposable(this.actionCharacterSelect)
  }

  protected override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('addMediaRule')
    element.innerHTML = AddMediaPane.htmlContent()

    setCharacterSelect(this.matrixModel, this.characterSelect)
    setCharacterSelect(this.matrixModel, this.actionCharacterSelect)

    const characterElement = this.getElementByClass('charactersSelect')
    this.characterSelect.render(characterElement)
    const actionCharacterElement = this.getElementByClass(
      'actionCharactersSelect'
    )
    this.actionCharacterSelect.render(actionCharacterElement)
  }

  protected override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(
        this.matrixModel,
        CharacterChangedEvents.TYPE,
        this.handleCharacterChange
      )
      .listen(this.characterSelect, EventType.SELECT, () =>
        this.handleCharacterSelect()
      )
      .listen(this.actionCharacterSelect, EventType.SELECT, () =>
        this.handleCharacterSelect()
      )
    this.characterSelect.setSelectedIndex(0)
    this.actionCharacterSelect.setSelectedIndex(0)
  }

  addCharacterRule(): Promise<void> {
    const characterSelectedValue = this.characterSelect.getSelectedValue()
    const characterId = characterSelectedValue
      ? parseInt(characterSelectedValue, 10)
      : 0
    const actionCharacterIds = this.actionCharacterSelect
      .getSelectedValues()
      .map((v) => parseInt(v, 10))
    return this.matrixModel.addCharacterRuleAction(
      CharacterRules.ADD_MEDIA,
      characterId,
      null,
      actionCharacterIds,
      null
    )
  }

  /**
   * Handles the select event on the partitions.
   */
  private handleCharacterSelect() {
    this.dialog.enableAddButton(
      isDistinctCharacterSelect(
        this.characterSelect,
        this.actionCharacterSelect
      )
    )
  }

  /**
   * Handles when characters have changed
   */
  private handleCharacterChange() {
    setCharacterSelect(this.matrixModel, this.characterSelect)
    setCharacterSelect(this.matrixModel, this.actionCharacterSelect)
  }

  /**
   * @return The HTML content of the Add Scoring pane
   */
  private static htmlContent(): string {
    return (
      '<div class="header">When adding media to this character...</div>' +
      '<div class="characters nonSelectable">' +
      '<div class="charactersSelect">Character</div>' +
      '</div>' +
      '<div class="header">... automatically add the same media to these characters</div>' +
      '<div class="actionCharacters nonSelectable">' +
      '<div class="actionCharactersSelect">Character</div>' +
      '</div>'
    )
  }
}

/**
 * Determines whether one character select has items in another
 */
function isDistinctCharacterSelect(
  characterSelect: Select,
  otherCharacterSelect: Select
) {
  const value = characterSelect.getSelectedValue()
  const otherValues = otherCharacterSelect.getSelectedValues()
  return !mb.contains(otherValues, value)
}

/**
 * Renders a character select
 */
function setCharacterSelect(matrixModel: MatrixModel, characterSelect: Select) {
  const characters = matrixModel.getCharacters()
  const userPreferences = matrixModel.getUserPreferences()
  const numberingMode = userPreferences.getDefaultNumberingMode()
  characterSelect.clearItems()
  for (let x = 0; x < characters.size(); x++) {
    const character = characters.getAt(x)
    const characterId = character.getId()
    const characterName =
      '[' + (character.getNumber() - numberingMode) + '] ' + character.getName()
    characterSelect.addItem(characterName, characterId)
  }
  if (characterSelect.isInDocument()) {
    characterSelect.redraw()
  }
}
