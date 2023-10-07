import { Checkbox } from '../Checkbox'
import { EventHandler } from '../../EventHandler'
import { MatrixModel } from '../../MatrixModel'
import { DataGridTable, DataRow } from '../DataGridTable'
import { Dialog } from '../Dialog'
import { AlertDialog } from './Alert'
import { ConfirmDialog } from './ConfirmDialog'
import { ModalDefaultButtons } from '../Modal'
import { EventType } from '../Component'
import * as CellsChangedEvents from '../../events/CellsChangedEvent'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import * as CharacterRulesAddedEvents from '../../events/CharacterRulesAddedEvent'
import * as CharacterRulesRemovedEvents from '../../events/CharacterRulesRemovedEvent'
import * as GoToCellEvents from '../../events/GoToCellEvent'
import * as mb from '../../mb'

/**
 * The rule checker dialog used to display character rule violations in the
 * matrix.
 *
 * @param matrixModel the data associated with the matrix.
 */
export class RuleCheckerDialog extends Dialog {
  /**
   * The keys used to label additional buttons in dialog.
   */
  private static readonly ButtonLabels = {
    AUTO_FIX_ALL_VIOLATIONS: 'Auto-fix all violations',
    FIX_SELECTED_VIOLATIONS: 'Fix selected violations',
    RECHECK: 'Recheck',
  }

  /**
   * The keys used to keys additional buttons in dialog.
   */
  private static readonly ButtonKeys = {
    AUTO_FIX_ALL_VIOLATIONS: 'autofix',
    FIX_SELECTED_VIOLATIONS: 'fix',
    RECHECK: 'recheck',
  }

  /**
   * Buttons for this dialog.
   */
  private static readonly Buttons = {
    AUTO_FIX_ALL_VIOLATIONS: {
      text: RuleCheckerDialog.ButtonLabels.AUTO_FIX_ALL_VIOLATIONS,
      key: RuleCheckerDialog.ButtonKeys.AUTO_FIX_ALL_VIOLATIONS,
      dismissable: false,
    },
    FIX_SELECTED_VIOLATIONS: {
      text: RuleCheckerDialog.ButtonLabels.FIX_SELECTED_VIOLATIONS,
      key: RuleCheckerDialog.ButtonKeys.FIX_SELECTED_VIOLATIONS,
      dismissable: false,
    },
    RECHECK: {
      text: RuleCheckerDialog.ButtonLabels.RECHECK,
      key: RuleCheckerDialog.ButtonKeys.RECHECK,
      dismissable: false,
    },
  }
  /**
   * The confirmation text for when the user selects to fix violations
   */
  private static CONFIRM_TEXT: string =
    'Are you sure you want to continue? Remember, ' +
    'this CANNOT BE UNDONE! Hitting this button will change all the scores that are ' +
    'currently in violation of the rules - automatically and permanently. Do not hit this ' +
    'button unless you are sure you wish to overwrite data. Alternatively you can click on ' +
    'the cells that show violations, go to them and change them manually'

  protected readonly matrixModel: MatrixModel

  protected loadingElement: Element
  protected gridTable: DataGridTable
  protected checkboxHandler: EventHandler
  protected checkboxes: Checkbox[] = []
  protected hasCharacterRulesChanged: boolean = true

  constructor(matrixModel: MatrixModel) {
    super()

    this.matrixModel = matrixModel

    this.loadingElement = this.getLoadingElement()

    this.gridTable = new DataGridTable()
    this.registerDisposable(this.gridTable)

    this.checkboxHandler = new EventHandler()
    this.registerDisposable(this.checkboxHandler)
  }

  protected override initialize(): void {
    this.setTitle('Check matrix against character rules')
    this.setHasBackdrop(false)
    this.addButton(ModalDefaultButtons.DONE)
    this.addButton(RuleCheckerDialog.Buttons.AUTO_FIX_ALL_VIOLATIONS)
    this.addButton(RuleCheckerDialog.Buttons.FIX_SELECTED_VIOLATIONS)
    this.addButton(RuleCheckerDialog.Buttons.RECHECK)
  }

  protected override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('checkerDialog', 'modal-lg')

    const contentElement = this.getContentElement()
    contentElement.innerHTML = RuleCheckerDialog.htmlContent()

    this.gridTable.addColumn(' ')
    this.gridTable.addColumn('Character')
    this.gridTable.addColumn('Taxon')
    this.gridTable.addColumn('Polymorphic')
    this.gridTable.addColumn('Violation')

    const checkerElement = this.getElementByClass('violationsGrid')
    this.gridTable.render(checkerElement)

    this.setButtonEnabled(
      RuleCheckerDialog.Buttons.FIX_SELECTED_VIOLATIONS,
      false
    )
  }

  protected override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(this, EventType.SELECT, (e: CustomEvent<any>) =>
        this.onHandleSelect(e)
      )
      .listen(this.gridTable, EventType.SELECT, (e: CustomEvent<any>) =>
        this.handleGridClick(e)
      )
      .listen(
        this.matrixModel,
        [
          CharacterChangedEvents.TYPE,
          CharacterRulesAddedEvents.TYPE,
          CharacterRulesRemovedEvents.TYPE,
          CellsChangedEvents.TYPE,
        ],
        () => this.invalidateRules()
      )
  }

  override setVisible(b: boolean) {
    super.setVisible(b)
    if (this.hasCharacterRulesChanged) {
      this.hasCharacterRulesChanged = false
      this.loadCharacterRuleViolations()
    }
  }

  /**
   * Invalides the grid
   */
  private invalidateRules() {
    this.hasCharacterRulesChanged = true
  }

  /**
   * Handles when menu buttons are clicked
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: CustomEvent) {
    switch (e.detail.key) {
      case RuleCheckerDialog.ButtonKeys.AUTO_FIX_ALL_VIOLATIONS:
        this.confirmFixVioliations(() => this.fixAllViolations())
        return false
      case RuleCheckerDialog.ButtonKeys.FIX_SELECTED_VIOLATIONS:
        this.fixSelectedViolations()
        return false
      case RuleCheckerDialog.ButtonKeys.RECHECK:
        this.loadCharacterRuleViolations()
        return false
      default:
        return true
    }
  }

  /**
   * Load character rule violations and draw it on the data grid
   */
  private loadCharacterRuleViolations() {
    const contentElement = this.getContentElement()
    contentElement.appendChild(this.loadingElement)
    this.matrixModel
      .getCharacterRuleViolations()
      .then((rules) => {
        if (this.isInDocument()) {
          this.redrawRules(rules)
        }
      })
      .catch(() => AlertDialog.show('Failed to load character rules'))
      .finally(() => contentElement.removeChild(this.loadingElement))
  }

  /**
   * Redraws the character rule violations within the comment grid.
   * @param violations the violations that will be used to redraw the grid
   */
  private redrawRules(violations: Object[]) {
    const rows: DataRow[] = []
    const characters = this.matrixModel.getCharacters()
    const characterRules = this.matrixModel.getCharacterRules()
    const taxa = this.matrixModel.getTaxa()
    const cells = this.matrixModel.getCells()
    const projectPreferences = this.matrixModel.getProjectProperties()
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()

    // Get rid of previous checkbox handlers
    this.checkboxHandler.removeAll()
    while (this.checkboxes.length > 0) {
      const checkbox = this.checkboxes.pop()
      checkbox!.dispose()
    }
    const polymorphicList: boolean[] = []
    for (let x = 0; x < violations.length; x++) {
      const violation = violations[x] as { [key: string]: number }

      // Get objects properties
      const ruleCharacterId = violation['rcid']
      const actionCharacterId = violation['acid']
      const taxonId = violation['tid']
      const actionId = violation['aid']
      const stateId = violation['sid']
      const taxon = taxa.getById(taxonId)
      if (taxon == null) {
        continue
      }
      const taxonName =
        '[' +
        (taxon.getNumber() - numberingMode) +
        '] ' +
        taxon.getDisplayName()
      const character = characters.getById(actionCharacterId)
      if (character == null) {
        continue
      }
      const characterName =
        '  [' +
        (character.getNumber() - numberingMode) +
        '] ' +
        mb.htmlEscape(character.getName())
      const state = character.getCharacterStateById(stateId)
      const stateName = state
        ? '[' + state.getNumber() + '] ' + state.getName()
        : '-'
      const isPolymorphic = cells.getCell(taxonId, ruleCharacterId).length > 1
      const isPolymorphicText = isPolymorphic
        ? 'Mother character is polymorphic'
        : '-'
      const characterRule = characterRules.getRulesForActionId(actionId)
      if (characterRule == null) {
        continue
      }
      const isMediaRule = characterRule.isAction('ADD_MEDIA')
      const violationText = isMediaRule
        ? 'Media must be replicated'
        : isPolymorphic
        ? 'User must decide state'
        : 'State should be set to ' + stateName
      const isDisabled = !taxon.hasAccess(projectPreferences)
      const checkbox = new Checkbox(actionId)
      checkbox.setEnabled(!isDisabled)
      checkbox.setModel({
        actionId: actionId,
        taxonId: taxonId,
      } as CheckboxModel)
      this.checkboxes.push(checkbox)
      polymorphicList.push(isPolymorphic)
      const row = {
        labels: [
          checkbox,
          characterName,
          taxonName,
          isPolymorphicText,
          violationText,
        ],
        data: {
          id: actionId,
          characterId: actionCharacterId,
          taxonId: taxonId,
        },
        className: isDisabled ? 'disabled' : '',
        tooltip: isDisabled
          ? 'You do not have access to the taxon to fix violation'
          : '',
      } as DataRow
      rows.push(row)
    }

    // sets the number violations
    const numOfViolations = this.getElementByClass('mb-violations-length')
    numOfViolations.textContent = String(violations.length)
    this.gridTable.clearRows()
    this.gridTable.addRows(rows)
    this.gridTable.redraw()

    // Attach listeners after the checkbox was rendered.
    for (let x = 0; x < this.checkboxes.length; x++) {
      const checkbox = this.checkboxes[x]
      const isPolymorphic = polymorphicList[x]
      this.checkboxHandler.listen(checkbox, EventType.CHANGE, (e) =>
        this.onActionSelectionChanged(isPolymorphic, checkbox, e)
      )
    }
  }

  /**
   * Handles events when check box is clicked
   * @param isPolymorphic Whether the violation is based of a polymorphic score
   * @param targetCheckbox The checkbox that was checked.
   * @param e The event that triggerd this callback.
   */
  private onActionSelectionChanged(
    isPolymorphic: boolean,
    targetCheckbox: Checkbox,
    e: Event
  ) {
    // prevent the grid of handling the event
    e.stopPropagation()
    e.preventDefault()
    if (isPolymorphic) {
      AlertDialog.show(
        "You must manually fix this state because it's score is polymorphic"
      )
      targetCheckbox.setChecked(false)
      return true
    }
    let atLeastOneBoxChecked = false
    for (let x = 0; x < this.checkboxes.length; x++) {
      const checkbox = this.checkboxes[x]
      if (checkbox.isChecked()) {
        atLeastOneBoxChecked = true
        break
      }
    }
    this.setButtonEnabled(
      RuleCheckerDialog.Buttons.FIX_SELECTED_VIOLATIONS,
      atLeastOneBoxChecked
    )
    return true
  }

  /**
   * Handles events when grid row is clicked
   * @param e The event that triggerd this callback.
   */
  private handleGridClick(e: CustomEvent<any>) {
    const taxonId = parseInt(e.detail.taxonId, 10)
    const characterId = parseInt(e.detail.characterId, 10)
    const row = taxonId ? this.matrixModel.getTaxonIndexById(taxonId) : -1
    const column = characterId
      ? this.matrixModel.getCharacterIndexById(characterId)
      : -1
    window.dispatchEvent(GoToCellEvents.create(row, column))
  }

  /**
   * Determines which violations where selected and display a warning to the user to confirm their
   * choice.
   */
  private fixSelectedViolations() {
    const violations: Object[] = []
    for (let x = 0; x < this.checkboxes.length; x++) {
      const checkbox = this.checkboxes[x]
      if (!checkbox.isChecked()) {
        continue
      }
      const model = checkbox.getModel<CheckboxModel>()
      violations.push({ aid: model.actionId, tid: model.taxonId })
    }
    if (violations.length === 0) {
      AlertDialog.show(
        'You must first select violations and then fix the violations.'
      )
      return
    }
    this.confirmFixVioliations(() =>
      this.fixSelectedViolationsInternal(violations)
    )
  }

  /**
   * Fixes the selected violations
   * @param violations The violations to fix
   */
  private fixSelectedViolationsInternal(violations: Object[]) {
    this.savingLabel.saving()
    this.matrixModel
      .fixSelectedCharacterRuleViolations(violations)
      .then(() => {
        // Remove the rows in the grid but there must be better ways to do this.
        this.loadCharacterRuleViolations()
        this.savingLabel.saved()
      })
      .catch((e) => {
        AlertDialog.show(String(e))
        this.savingLabel.failed()
      })
  }

  /**
   * Fixes the all the violations
   */
  private fixAllViolations() {
    this.savingLabel.saving()
    this.matrixModel
      .fixAllCharacterRuleViolations()
      .then(() => {
        // Remove the rows in the grid but there must be better ways to do this.
        this.loadCharacterRuleViolations()
        this.savingLabel.saved()
      })
      .catch((e) => {
        AlertDialog.show(String(e))
        this.savingLabel.failed()
      })
  }

  /**
   * @return an element which shows a loading indicator.
   */
  private getLoadingElement(): Element {
    const loadingElement = document.createElement('div')
    loadingElement.classList.add('loadingMessage')
    const messageElement = document.createElement('div')
    messageElement.textContent = 'Loading rule violations...'
    loadingElement.appendChild(messageElement)
    return loadingElement
  }

  /**
   * Display a confirmation dialog to fix violations
   * @param func The function to run when when the user confirms
   */
  private confirmFixVioliations(func: () => void) {
    const confirmDialog = new ConfirmDialog(
      'Confirm',
      RuleCheckerDialog.CONFIRM_TEXT,
      func
    )
    confirmDialog.setVisible(true)
  }

  /**
   * @return The HTML content for the rule checker dialog
   */
  private static htmlContent(): string {
    return (
      '<header>Number of violations found:&nbsp;&nbsp;' +
      '<span class="mb-violations-length"></span>' +
      '</header>' +
      '<div class="violationsGrid" style="margin-bottom: 10px"></div>'
    )
  }
}

interface CheckboxModel {
  actionId: number
  taxonId: number
}
