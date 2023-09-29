import { MatrixIndexDb } from '../../MatrixIndexDb'
import { MatrixModel } from '../../MatrixModel'
import { CellInfo } from '../../data/Cells'
import * as LastViewStatePreferenceChangedEvent from '../../events/LastViewStatePreferenceChangedEvent'
import { Dialog } from '../Dialog'
import { Dropdown } from '../Dropdown'
import { Radio } from '../Radio'
import { ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'
import { EventType } from '../Component'

/**
 * The warnings dialog used to display the warnings present in the Matrix editor.
 *
 * @param matrixModel the data associated with the matrix.
 */
export class PreferencesDialog extends Dialog {
  /**
   * Options for numbering mode
   */
  static NUMBERING_MODE: { [key: string]: number } = {
    'Nexus (numbers start at 1)': 0,
    'TNT (numbers start as 0)': 1,
  }

  /**
   * Options for character name display
   */
  static CHARACTER_NAME_DISPLAY_MODE: { [key: string]: number } = {
    'Truncate long character names': 0,
    'Show complete character names': 1,
    'Show character numbers only': 2,
  }

  /**
   * Options for Yes or No
   */
  static YES_NO_OPTIONS: { [key: string]: number } = { No: 0, Yes: 1 }

  /**
   * Message for indexeddb not suported.
   */
  static INDEXEDDB_NOT_SUPPORTED_MESSAGE: string =
    'Your current browser does not support storing last viewed preferences'

  /**
   * Message for indexeddb not enabled..
   */
  static INDEXEDDB_NOT_ENABLED_MESSAGE: string =
    'You disabled storing preferences for your browser. Enable "Remember History" to enable this feature.'

  private readonly matrixModel: MatrixModel

  private numberingModeSelect: Dropdown
  private characterNameDisplayModeSelect: Dropdown
  private characterRulesApplySelect: Dropdown
  private characterRulesOverwriteScoresSelect: Dropdown
  private loadLastSavedViewStateSelect: Dropdown
  private multiStateTaxaDefaultSelect: Dropdown
  private enableMatrixStreamingRadio: Radio

  constructor(matrixModel: MatrixModel) {
    super()

    this.matrixModel = matrixModel

    this.numberingModeSelect = new Dropdown()
    this.registerDisposable(this.numberingModeSelect)

    this.characterNameDisplayModeSelect = new Dropdown()
    this.registerDisposable(this.characterNameDisplayModeSelect)

    this.characterRulesApplySelect = new Dropdown()
    this.registerDisposable(this.characterRulesApplySelect)

    this.characterRulesOverwriteScoresSelect = new Dropdown()
    this.registerDisposable(this.characterRulesOverwriteScoresSelect)

    this.loadLastSavedViewStateSelect = new Dropdown()
    this.registerDisposable(this.loadLastSavedViewStateSelect)

    this.multiStateTaxaDefaultSelect = new Dropdown()
    this.registerDisposable(this.multiStateTaxaDefaultSelect)

    this.enableMatrixStreamingRadio = new Radio('streaming-radio')
    this.registerDisposable(this.enableMatrixStreamingRadio)
  }

  protected override initialize() {
    this.setTitle('Preferences')
    this.setHasBackdrop(false)
    this.addButton(ModalDefaultButtons.SAVE)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  protected override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('preferencesDialog')

    const contentElement = this.getContentElement()
    contentElement.innerHTML = PreferencesDialog.htmlContent()

    // Render the numbering mode select element
    for (const text in PreferencesDialog.NUMBERING_MODE) {
      const value = PreferencesDialog.NUMBERING_MODE[text]
      this.numberingModeSelect.addItem({ text, value })
    }
    const numberingModeElement = this.getElementByClass('mb-numbering-mode')
    this.numberingModeSelect.render(numberingModeElement)

    // Render the character name mode select element
    for (const text in PreferencesDialog.CHARACTER_NAME_DISPLAY_MODE) {
      const value = PreferencesDialog.CHARACTER_NAME_DISPLAY_MODE[text]
      this.characterNameDisplayModeSelect.addItem({ text, value })
    }
    const characterNameModeElement = this.getElementByClass(
      'mb-characterNameMode'
    )
    this.characterNameDisplayModeSelect.render(characterNameModeElement)

    // Render the scoring with character rules option
    for (const text in PreferencesDialog.YES_NO_OPTIONS) {
      const value = PreferencesDialog.YES_NO_OPTIONS[text]
      this.characterRulesApplySelect.addItem({ text, value })
    }
    const scoreWithRulesMode = this.getElementByClass(
      'mb-score-with-rules-mode'
    )
    this.characterRulesApplySelect.render(scoreWithRulesMode)

    // Render the character rules overwriting cell scores option
    for (const text in PreferencesDialog.YES_NO_OPTIONS) {
      const value = PreferencesDialog.YES_NO_OPTIONS[text]
      this.characterRulesOverwriteScoresSelect.addItem({ text, value })
    }
    const overwriteModeElement = this.getElementByClass('mb-overwrite-mode')
    this.characterRulesOverwriteScoresSelect.render(overwriteModeElement)

    // Render the last saved view state option.
    for (const text in PreferencesDialog.YES_NO_OPTIONS) {
      const value = PreferencesDialog.YES_NO_OPTIONS[text]
      this.loadLastSavedViewStateSelect.addItem({ text, value })
    }
    const lastViewStateElement = this.getElementByClass(
      'mb-last-view-saved-mode'
    )
    this.loadLastSavedViewStateSelect.render(lastViewStateElement)

    // Render the multiple state taxa option
    for (const text in CellInfo.POLYMORPHIC_OPTIONS) {
      const value = CellInfo.POLYMORPHIC_OPTIONS[text]
      this.multiStateTaxaDefaultSelect.addItem({ text, value })
    }
    const multiStateTaxaElement = this.getElementByClass('mb-multistate-taxa')
    this.multiStateTaxaDefaultSelect.render(multiStateTaxaElement)
    this.enableMatrixStreamingRadio.addItem({
      text: 'Disable Streaming',
      value: 0,
    })
    this.enableMatrixStreamingRadio.addItem({
      text: 'Enable Streaming',
      value: 1,
    })
    const streamingElement = this.getElementByClass('streamingMode')
    this.enableMatrixStreamingRadio.render(streamingElement)

    // Select the proper values
    this.reselectIndices()
    this.resetEnabledInputs()
  }

  protected override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(this, EventType.SELECT, (e: CustomEvent<any>) =>
      this.onHandleSelect(e)
    )
  }

  /** Reset the indices for the dialogs */
  private reselectIndices() {
    const matrixOptions = this.matrixModel.getMatrixOptions()
    const userPreferences = this.matrixModel.getUserPreferences()
    this.numberingModeSelect.setSelectedIndex(
      userPreferences.getDefaultNumberingMode()
    )
    this.characterRulesApplySelect.setSelectedIndex(
      matrixOptions.getApplyCharacterRulesWhileScoring()
    )
    this.characterNameDisplayModeSelect.setSelectedIndex(
      userPreferences.getCharacterNameDisplayMode()
    )
    this.characterRulesOverwriteScoresSelect.setSelectedIndex(
      matrixOptions.getAllowOverwritingByRules()
    )
    this.loadLastSavedViewStateSelect.setSelectedIndex(
      userPreferences.getEnableLoadSavedViewState() &&
        MatrixIndexDb.isSupported()
        ? 1
        : 0
    )
    this.multiStateTaxaDefaultSelect.setSelectedIndex(
      matrixOptions.getDefaultMultiStateTaxaMode()
    )
    this.enableMatrixStreamingRadio.setSelectedIndex(
      userPreferences.getEnableStreaming() ? 1 : 0
    )
  }

  /**
   * Sets whether the selects, checkboxes, and buttons are enabled
   */
  private resetEnabledInputs() {
    const projectProperties = this.matrixModel.getProjectProperties()
    const enabled = projectProperties.isActionAllowed('setMatrixOptions')

    // enable/disable the controls
    this.numberingModeSelect.setEnabled(enabled)
    this.characterRulesApplySelect.setEnabled(enabled)
    this.characterNameDisplayModeSelect.setEnabled(enabled)
    this.characterRulesOverwriteScoresSelect.setEnabled(enabled)
    this.loadLastSavedViewStateSelect.setEnabled(
      enabled && MatrixIndexDb.isEnabled()
    )
    this.multiStateTaxaDefaultSelect.setEnabled(enabled)
    this.enableMatrixStreamingRadio.setEnabled(enabled)
    if (!MatrixIndexDb.isSupported()) {
      this.loadLastSavedViewStateSelect.setTooltip(
        PreferencesDialog.INDEXEDDB_NOT_SUPPORTED_MESSAGE
      )
    } else {
      if (!MatrixIndexDb.isEnabled()) {
        this.loadLastSavedViewStateSelect.setTooltip(
          PreferencesDialog.INDEXEDDB_NOT_ENABLED_MESSAGE
        )
      }
    }
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   * @return whether to close the dialog
   */
  private onHandleSelect(e: CustomEvent): boolean {
    debugger
    if (e.detail.key === ModalDefaultButtonKeys.SAVE) {
      const matrixOptions = this.matrixModel.getMatrixOptions()
      const userPreferences = this.matrixModel.getUserPreferences()

      const oldStreamingValue = userPreferences.getEnableStreaming()
      const newStreamingValue =
        !!this.enableMatrixStreamingRadio.getSelectedIndex()
      userPreferences.setEnableStreaming(newStreamingValue)

      const oldAllowOverwritingByRulesIndex =
        matrixOptions.getAllowOverwritingByRules()
      const newAllowOverwritingByRulesIndex =
        this.characterRulesOverwriteScoresSelect.getSelectedIndex()
      matrixOptions.setAllowOverwritingByRules(newAllowOverwritingByRulesIndex)

      const oldApplyCharacterRulesWhileScoringIndex =
        matrixOptions.getApplyCharacterRulesWhileScoring()
      const newApplyCharacterRulesWhileScoringIndex =
        this.characterRulesApplySelect.getSelectedIndex()
      matrixOptions.setApplyCharacterRulesWhileScoring(
        newApplyCharacterRulesWhileScoringIndex
      )

      const oldCharacterNameDisplayModeIndex =
        userPreferences.getCharacterNameDisplayMode()
      const newCharacterNameDisplayModeIndex =
        this.characterNameDisplayModeSelect.getSelectedIndex()
      userPreferences.setCharacterNameDisplayMode(
        newCharacterNameDisplayModeIndex
      )

      const oldMultistateTaxaIndex =
        matrixOptions.getDefaultMultiStateTaxaMode()
      const newMultistateTaxaIndex =
        this.multiStateTaxaDefaultSelect.getSelectedIndex()
      matrixOptions.setDefaultMultiStateTaxaMode(newMultistateTaxaIndex)

      const oldDefaultNumberingModeIndex =
        userPreferences.getDefaultNumberingMode()
      const newDefaultNumberingModeIndex =
        this.numberingModeSelect.getSelectedIndex()
      userPreferences.setDefaultNumberingMode(newDefaultNumberingModeIndex)

      const oldLoadSavedViewStateIndex =
        userPreferences.getEnableLoadSavedViewState()
      const newLoadSavedViewStateIndex =
        !!this.loadLastSavedViewStateSelect.getSelectedIndex()
      userPreferences.setEnableLoadSavedViewState(newLoadSavedViewStateIndex)

      this.savingLabel.saving()
      this.matrixModel
        .setUserPreference()
        .then(() => {
          this.savingLabel.saved()
          if (oldLoadSavedViewStateIndex !== newLoadSavedViewStateIndex) {
            window.dispatchEvent(LastViewStatePreferenceChangedEvent.create())
          }
          this.close()
        })
        .catch((e) => {
          alert(e)
          this.savingLabel.failed()

          // rollback action
          userPreferences.setEnableStreaming(oldStreamingValue)
          userPreferences.setCharacterNameDisplayMode(
            oldCharacterNameDisplayModeIndex
          )
          userPreferences.setDefaultNumberingMode(oldDefaultNumberingModeIndex)
          userPreferences.setEnableLoadSavedViewState(
            oldLoadSavedViewStateIndex
          )
          matrixOptions.setAllowOverwritingByRules(
            oldAllowOverwritingByRulesIndex
          )
          matrixOptions.setApplyCharacterRulesWhileScoring(
            oldApplyCharacterRulesWhileScoringIndex
          )
          matrixOptions.setDefaultMultiStateTaxaMode(oldMultistateTaxaIndex)
        })
        .finally(() => {
          this.resetEnabledInputs()
          this.reselectIndices()
        })
      return false
    }
    return true
  }

  /**
   * @return The HTML content of the preferences dialog.
   */
  private static htmlContent(): string {
    return `
    <section>
      <header>Character and taxon numbering mode:</header>
      <div class="mb-numbering-mode"></div>
    </section>
    <section>
      <header>Character name display mode:</header>
      <div class="mb-characterNameMode"></div>
    </section>
    <section>
      <header>Apply character rules while scoring:</header>
      <div class="mb-score-with-rules-mode"></div>
    </section>
    <section>
      <header>Allow character rules to overwrite existing scores:</header>
      <div class="mb-overwrite-mode"></div>
    </section>
    <section>
      <header title="Loads the matrix at your last viewed position">Load at your last viewed position:</header>
      <div class="mb-last-view-saved-mode"></div>
    </section>
    <section>
      <header>Default for multiple state taxa:</header>
      <div class="mb-multistate-taxa"></div>
    </section>
    <section>
      <header>Matrix Streaming options (require restart):</header>
      <div class="streamingMode"></div>
    </section>`
  }
}
