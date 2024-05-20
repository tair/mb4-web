import { MatrixModel } from '../../MatrixModel'
import * as mb from '../../mb'
import { Component, EventType, KeyCodes } from '../Component'
import { Dropdown } from '../Dropdown'
import { Modal, ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'

/**
 * Add character dialog.
 *
 * @param matrixModel The characters associated with the characters
 * @param selectedIndex The default index for the characters
 * @param saveCallback the callback when the user presses save
 */
export class AddCharacterDialog extends Modal {
  /**
   * The keys used to identify additional buttons in events.
   */
  private static readonly ButtonKeys = { ADD: 'Add' }

  /**
   * The keys used to identify additional buttons in events.
   */
  private static readonly ButtonLabels = { ADD: 'Add' }

  /**
   * The standard buttons (keys associated with captions).
   */
  private static readonly Buttons = {
    ADD: {
      text: AddCharacterDialog.ButtonLabels.ADD,
      key: AddCharacterDialog.ButtonKeys.ADD,
      dismissable: false,
    },
  }
  protected select: Dropdown
  protected charType: Dropdown

  constructor(
    protected readonly matrixModel: MatrixModel,
    protected readonly selectedIndex: number,
    protected readonly saveCallback: (
      p1: string,
      p2: number,
      p3: string
    ) => Promise<void>
  ) {
    super()
    this.select = new Dropdown()
    this.registerDisposable(this.select)
    this.charType = new Dropdown()
    this.registerDisposable(this.charType)
    this.setTitle('Add character')
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(AddCharacterDialog.Buttons.ADD)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('addCharacterDialog')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = AddCharacterDialog.htmlContent()
    this.setSelectMenuItems()
    const statusControlElement = this.getElementByClass('statusControl')
    this.select.render(statusControlElement)
    this.select.setSelectedIndex(
      /* add 1 for the first menu item */
      this.selectedIndex + 1
    )
    const isCategorical = this.matrixModel.getMatrix().getType() === 0
    if (isCategorical) {
      this.charType.addItem({ text: 'Discrete', value: 'D' })
      this.charType.addItem({ text: 'Continuous', value: 'C' })
    } else {
      this.charType.addItem({ text: 'Meristic', value: 'M' })
    }
    const charTypeElement = this.getElementByClass('character-type-control')
    this.charType.render(charTypeElement)
    this.charType.setSelectedIndex(0)
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler.listen(this, EventType.SELECT, (e) => this.onHandleSelect(e))
  }

  /**
   * Adds the characters to the select dropdown.
   */
  setSelectMenuItems() {
    const characters = this.matrixModel.getCharacters().getAll()
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    this.select.addItem({ text: '<First character>', value: 0 })
    for (let x = 0; x < characters.length; x++) {
      const character = characters[x]
      const characterName =
        '  [' +
        (character.getNumber() - numberingMode) +
        '] ' +
        mb.truncateString(character.getName(), 50)
      this.select.addItem({ text: characterName, value: character.getId() })
    }
  }

  /**
   * Handles when the users clicks one of the dialog buttons.
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleSelect(e: CustomEvent) {
    if (e.detail.key === AddCharacterDialog.ButtonKeys.ADD) {
      const nameElement = this.getElementByClass<HTMLInputElement>('name')
      const characterId = parseInt(this.select.getSelectedValue(), 10)
      const charType = mb.htmlEscape(String(this.charType.getSelectedValue()))
      const index =
        this.matrixModel.getCharacters().findIndexById(characterId) + 1
      this.saveCallback(nameElement.value, index, charType).then(() =>
        this.dispose()
      )
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
      e.preventDefault()
      this.onHandleSelect(new CustomEvent(ModalDefaultButtonKeys.OK))
      return true
    }
  }

  /**
   * Handlers events when for user key down events.
   */
  protected handleOnNameInput() {
    const nameElement = this.getElementByClass<HTMLInputElement>('name')
    this.enableSaveButton(nameElement.value !== '')
  }

  /**
   * Enables or Disables the 'Add' button
   * @param enabled Whether to enable or disable the add button
   */
  protected enableSaveButton(enabled: boolean) {
    if (!this.isInDocument()) {
      return
    }
    this.setButtonEnabled(ModalDefaultButtons.OK, enabled)
  }

  /**
   * @return Returns the dialog's HTML Content
   */
  protected static htmlContent(): string {
    return (
      '<div class="label">New character\'s name</div>' +
      '<input class="name"/><p/>' +
      '<div class="character-type-control">' +
      '<div class="label">Character type</div>' +
      '</div><p/>' +
      '<div class="statusControl">' +
      '<div class="label">Add the character after</div>' +
      '</div>'
    )
  }
}
