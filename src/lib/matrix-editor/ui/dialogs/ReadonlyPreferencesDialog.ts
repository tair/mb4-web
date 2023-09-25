import { MatrixModel } from '../../MatrixModel'
import { Dialog } from '../Dialog'
import { PreferencesDialog } from './PreferencesDialog'
import { ModalDefaultButtonKeys, ModalDefaultButtons } from '../Modal'
import { Dropdown } from '../Dropdown'
import { EventType } from '../Component'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import * as TaxaChangedEvents from '../../events/TaxaChangedEvent'
import * as mb from '../../mb'

/**
 * The preferences dialog used when the matrix is in read-only mode for users
 * who are not signed into MorphoBank. This will read and write to the same
 * local storage variables so that users who have accounts but are not signed
 * in may continue to keep the same settings.
 *
 * @param matrixModel the data associated with the matrix.
 */
export class ReadOnlyPreferencesDialog extends Dialog {
  protected readonly numberingModeDropdown: Dropdown
  protected readonly characterNameDisplayModeDropdown: Dropdown
  protected readonly localStorage: Storage

  constructor(protected readonly matrixModel: MatrixModel) {
    super()

    this.numberingModeDropdown = new Dropdown()
    this.registerDisposable(this.numberingModeDropdown)

    this.characterNameDisplayModeDropdown = new Dropdown()
    this.registerDisposable(this.characterNameDisplayModeDropdown)

    this.localStorage = mb.isLocalStorageAvailable()
      ? window.localStorage
      : window.sessionStorage

    this.setTitle('Preferences')
    this.setHasBackdrop(false)
    this.addButton(ModalDefaultButtons.SAVE)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('preferencesDialog')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = ReadOnlyPreferencesDialog.htmlContent()

    // Render the numbering mode select element
    for (const text in PreferencesDialog.NUMBERING_MODE) {
      const value = PreferencesDialog.NUMBERING_MODE[text]
      this.numberingModeDropdown.addItem({ text, value })
    }
    const numberingModeElement = this.getElementByClass('mb-numbering-mode')
    this.numberingModeDropdown.render(numberingModeElement)

    // Render the character name mode select element
    for (const text in PreferencesDialog.CHARACTER_NAME_DISPLAY_MODE) {
      const value = PreferencesDialog.CHARACTER_NAME_DISPLAY_MODE[text]
      this.characterNameDisplayModeDropdown.addItem({ text, value })
    }
    const characterNameModeElement = this.getElementByClass(
      'mb-characterNameMode'
    )
    this.characterNameDisplayModeDropdown.render(characterNameModeElement)

    // select the proper values
    this.reselectIndices()
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(this, EventType.SELECT, (e: CustomEvent<any>) =>
      this.onHandleSelect(e)
    )
  }

  /** Reset the indices for the dialogs */
  reselectIndices() {
    const userPreferences = this.matrixModel.getUserPreferences()
    this.numberingModeDropdown.setSelectedIndex(
      userPreferences.getDefaultNumberingMode()
    )
    this.characterNameDisplayModeDropdown.setSelectedIndex(
      userPreferences.getCharacterNameDisplayMode()
    )
  }

  /**
   * Sets whether the selects, checkboxes, and buttons are enabled
   * @param enabled true if dialog should be enabled or not
   */
  setEnabled(enabled: boolean) {
    // Enable or disable the controls.
    this.numberingModeDropdown.setEnabled(enabled)
    this.characterNameDisplayModeDropdown.setEnabled(enabled)
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   * @return whether to close the dialog
   */
  private onHandleSelect(e: CustomEvent): boolean {
    if (e.detail.key === ModalDefaultButtonKeys.SAVE) {
      const userPreferences = this.matrixModel.getUserPreferences()
      const newCharacterNameDisplayModeIndex =
        this.characterNameDisplayModeDropdown.getSelectedIndex()
      userPreferences.setCharacterNameDisplayMode(
        newCharacterNameDisplayModeIndex
      )
      const newDefaultNumberingModeIndex =
        this.numberingModeDropdown.getSelectedIndex()
      userPreferences.setDefaultNumberingMode(newDefaultNumberingModeIndex)
      this.localStorage.setItem(
        'matrix_user_preferences_' + this.matrixModel.getId(),
        JSON.stringify(userPreferences.serialize())
      )
      this.matrixModel.dispatchEvent(CharacterChangedEvents.create())
      this.matrixModel.dispatchEvent(TaxaChangedEvents.create())
      this.close()
    }
    return true
  }

  /**
   * @return The HTML content of the preferences dialog.
   */
  static htmlContent(): string {
    return `<section>
        <header>Character and taxon numbering mode:</header>
        <div class="mb-numbering-mode"></div>
      </section>
      <section>
        <header>Character name display mode:</header>
        <div class="mb-characterNameMode"></div>
      </section>`
  }
}
