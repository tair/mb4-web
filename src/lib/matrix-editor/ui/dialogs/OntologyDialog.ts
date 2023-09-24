import * as mb from '../../mb'
import { MatrixModel } from '../../MatrixModel'
import { AbstractItems } from '../../data/AbstractItems'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import * as CharacterRulesAddedEvents from '../../events/CharacterRulesAddedEvent'
import * as CharacterRulesRemovedEvents from '../../events/CharacterRulesRemovedEvent'
import { DataGridTable, DataRow } from '../DataGridTable'
import { Dialog } from '../Dialog'
import { TabNavigator } from '../TabNavigator'
import { AddRuleDialog } from './AddRuleDialog'
import { DagDialog } from './DagDialog'
import { ModalDefaultButtons } from '../Modal'
import { Component, EventType } from '../Component'

/**
 * Ontology dialog.
 *
 * @param matrixModel the data associated with the matrix.
 * @param opt_readonly Whether the ontology is readonly
 */
export class OntologyDialog extends Dialog {
  /**
   * Label for no ontologies in a readonly dialog
   */
  public static readonly NO_ONTOLOGY_MESSAGE: string =
    'The authors of this project did not define an ontology'

  /**
   * The keys used to label additional buttons in dialog.
   */
  private static readonly ButtonLabels = {
    ADD_CHARACTER: 'Add rule',
    VIEW_RULES_AS_GRAPH: 'View Rules As Graph',
    RECHECK: 'Recheck',
  }

  /**
   * The keys used to keys additional buttons in dialog.
   */
  private static readonly ButtonKeys = {
    ADD_CHARACTER: 'add_rule',
    VIEW_RULES_AS_GRAPH: 'view_rules',
    RECHECK: 'recheck',
  }

  /**
   * Buttons for this dialog.
   */
  private static readonly Buttons = {
    ADD_CHARACTER: {
      text: OntologyDialog.ButtonLabels.ADD_CHARACTER,
      key: OntologyDialog.ButtonKeys.ADD_CHARACTER,
      dismissable: false,
    },
    VIEW_RULES_AS_GRAPH: {
      text: OntologyDialog.ButtonLabels.VIEW_RULES_AS_GRAPH,
      key: OntologyDialog.ButtonKeys.VIEW_RULES_AS_GRAPH,
      dismissable: false,
    },
  }

  private readonly matrixModel: MatrixModel
  public readonly readonly: boolean

  private tabNavigator: TabNavigator
  private addRuleDialog: AddRuleDialog
  private dagDialog: DagDialog

  constructor(matrixModel: MatrixModel, readonly: boolean = false) {
    super()
    this.matrixModel = matrixModel
    this.readonly = !!readonly

    this.tabNavigator = new TabNavigator()
    this.registerDisposable(this.tabNavigator)
    this.addRuleDialog = new AddRuleDialog(this.matrixModel)
    this.registerDisposable(this.addRuleDialog)
    this.dagDialog = new DagDialog(this.matrixModel)
    this.registerDisposable(this.dagDialog)
    this.setTitle('Character ontology')
    this.addButton(ModalDefaultButtons.DONE)
    this.addButton(OntologyDialog.Buttons.VIEW_RULES_AS_GRAPH)
    if (!this.readonly) {
      this.addButton(OntologyDialog.Buttons.ADD_CHARACTER)
    }
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('ontologyDialog')
    const contentElement = this.getContentElement()
    this.tabNavigator.addTab(
      "'Set State' rules",
      new SetStateRulesPane(this.matrixModel, this)
    )
    this.tabNavigator.addTab(
      'Media rules',
      new MediaRulesPane(this.matrixModel, this)
    )
    this.tabNavigator.setHeight(350)
    this.tabNavigator.render(contentElement)
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler.listen(this, EventType.SELECT, (e: CustomEvent<any>) => this.onHandleSelect(e))
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: CustomEvent) {
    switch (e.detail.key) {
      case OntologyDialog.ButtonKeys.ADD_CHARACTER:
        this.addRuleDialog.setVisible(true)
        this.addRuleDialog.setSelectedTabIndex(
          this.tabNavigator.getSelectedTabIndex()
        )
        break
      case OntologyDialog.ButtonKeys.VIEW_RULES_AS_GRAPH:
        this.dagDialog.setVisible(true)
        this.dagDialog.refreshGraph()
        break
    }
  }

  /**
   * Handles events when character rules are removed.
   * @param e The event that triggerd this callback.
   */
  onCharacterRuleRemove(e: CustomEvent) {
    const actionId = parseInt(e.detail['actionId'], 10)
    const characterId = parseInt(e.detail['characterId'], 10)
    this.savingLabel.saving()
    return this.matrixModel
      .removeCharacterRuleAction(characterId, actionId)
      .then(() => this.savingLabel.saved())
      .catch(() => this.savingLabel.failed())
  }

  /**
   * An element which shows a text in the middle of the dialog
   * @param text The text to display.
   */
  showMessage(text: string) {
    const loadingElement = document.createElement('div')
    loadingElement.classList.add('message')
    const messageElement = document.createElement('div')
    messageElement.textContent = text
    loadingElement.appendChild(messageElement)
    const contentElement = this.getContentElement()
    contentElement.appendChild(loadingElement)
  }
}

/**
 * Pane for the Media Rules tab.
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog The owning dialog
 */
class MediaRulesPane extends Component {
  private readonly matrixModel: MatrixModel
  private readonly dialog: OntologyDialog
  private readonly gridTable: DataGridTable

  constructor(matrixModel: MatrixModel, dialog: OntologyDialog) {
    super()

    this.matrixModel = matrixModel
    this.dialog = dialog

    this.gridTable = new DataGridTable()
    this.registerDisposable(this.gridTable)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('stateRulesPane')
    this.gridTable.addColumn('Rule')
    this.gridTable.addColumn('Action')
    this.gridTable.addRows(this.getGridRows())
    this.gridTable.render(element)
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler.listen(
      this.matrixModel,
      [
        CharacterRulesAddedEvents.TYPE,
        CharacterRulesRemovedEvents.TYPE,
        CharacterChangedEvents.TYPE,
      ],
      () => this.onCharacterRuleModified()
    )
    if (!this.dialog.readonly) {
      handler.listen(this.gridTable, EventType.CUT, (e) =>
        this.dialog.onCharacterRuleRemove(e)
      )
    }
  }

  /**
   * Handles events when character rules are added.
   *
   */
  protected onCharacterRuleModified() {
    this.gridTable.clearRows()
    this.gridTable.addRows(this.getGridRows())
    this.gridTable.redraw()
  }

  /**
   * @return the HTML content of the set state grid as an array of arrays
   */
  getGridRows(): DataRow[] {
    const rows: DataRow[] = []
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const characterRules = this.matrixModel.getCharacterRules()
    const characterRulesMapping = characterRules.getCharacterMediaRulesMapping()
    const characters = this.matrixModel.getCharacters()
    const characterIds = Array.from(characterRulesMapping.keys())
    characters.sortIds(characterIds)
    if (this.dialog.readonly && characterIds.length == 0) {
      this.dialog.showMessage(OntologyDialog.NO_ONTOLOGY_MESSAGE)
    }
    for (let x = 0; x < characterIds.length; x++) {
      const characterId = characterIds[x]
      const character = characters.getById(characterId)
      if (character == null) {
        continue
      }

      const characterName =
        '[' +
        (character.getNumber() - numberingMode) +
        '] ' +
        mb.htmlEscape(character.getName())
      rows.push({ labels: [characterName, '&nbsp;'] })
      const rules = characterRulesMapping.get(characterId)
      if (rules == null) {
        continue
      }

      rules.sort(function (rule1, rule2) {
        const character1 = characters.getById(rule1.getActionCharacterId())
        if (character1 == null) {
          return -1
        }

        const character2 = characters.getById(rule2.getActionCharacterId())
        if (character2 == null) {
          return 1
        }
        return AbstractItems.sortNumberComparator(character1, character2)
      })
      for (let z = 0; z < rules.length; z++) {
        const rule = rules[z]
        const actionId = rule.getActionId()
        const actionCharacterId = rule.getActionCharacterId()
        const actionCharacter = characters.getById(actionCharacterId)
        if (actionCharacter == null) {
          continue
        }

        const actionCharacterName =
          '[' +
          (actionCharacter.getNumber() - numberingMode) +
          '] ' +
          mb.htmlEscape(actionCharacter.getName())
        rows.push({
          labels: [
            '\u2794&nbsp;&nbsp;' + actionCharacterName,
            'Replicate Media',
          ],
          className: 'characterRuleAction',
          removeable: !this.dialog.readonly,
          data: { actionId: actionId, characterId: characterId },
        })
      }
    }
    return rows
  }
}

/**
 * Pane for the Set States Rules tab.
 *
 * @param matrixModel the data associated with the matrix.
 * @param dialog The owning dialog
 */
class SetStateRulesPane extends Component {
  private readonly matrixModel: MatrixModel
  private readonly dialog: OntologyDialog
  private readonly gridTable: DataGridTable

  constructor(matrixModel: MatrixModel, dialog: OntologyDialog) {
    super()

    this.matrixModel = matrixModel
    this.dialog = dialog

    this.gridTable = new DataGridTable()
    this.registerDisposable(this.gridTable)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('stateRulesPane')
    this.gridTable.addColumn('Rule')
    this.gridTable.addColumn('Action')
    this.gridTable.addRows(this.getGridRows())
    this.gridTable.render(element)
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler.listen(
      this.matrixModel,
      [
        CharacterRulesAddedEvents.TYPE,
        CharacterRulesRemovedEvents.TYPE,
        CharacterChangedEvents.TYPE,
      ],
      () => this.onCharacterRuleModified()
    )
    if (!this.dialog.readonly) {
      handler.listen(this.gridTable, EventType.CUT, (e) =>
        this.dialog.onCharacterRuleRemove(e)
      )
    }
  }

  /**
   * Handles events when character rules are added.
   *
   */
  protected onCharacterRuleModified() {
    this.gridTable.clearRows()
    this.gridTable.addRows(this.getGridRows())
    this.gridTable.redraw()
  }

  /**
   * @return the HTML content of the set state grid as an array of arrays
   */
  getGridRows(): DataRow[] {
    const rows: DataRow[] = []
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const characterRules = this.matrixModel.getCharacterRules()
    const characterRulesMapping = characterRules.getCharacterStateRulesMapping()
    const characters = this.matrixModel.getCharacters()
    const characterIds = Array.from(characterRulesMapping.keys())
    characters.sortIds(characterIds)
    if (this.dialog.readonly && characterIds.length == 0) {
      this.dialog.showMessage(OntologyDialog.NO_ONTOLOGY_MESSAGE)
    }
    for (let x = 0; x < characterIds.length; x++) {
      const characterId = characterIds[x]
      const character = characters.getById(characterId)
      if (character == null) {
        continue
      }

      const characterName =
        '[' +
        (character.getNumber() - numberingMode) +
        '] ' +
        mb.htmlEscape(character.getName())
      const characterStatesMapping = characterRulesMapping.get(characterId)
      if (characterStatesMapping == null) {
        continue
      }

      const characterStatesIds = Array.from(characterStatesMapping.keys())
      for (let y = 0; y < characterStatesIds.length; y++) {
        const characterStatesId = characterStatesIds[y]
        let characterStateText = characterName + ' set to '
        if (characterStatesId === null) {
          characterStateText += '[-] Inapplicable'
        } else {
          const characterState =
            character.getCharacterStateById(characterStatesId)
          characterStateText +=
            '[' +
            characterState!.getNumber() +
            '] ' +
            mb.htmlEscape(characterState!.getName())
        }
        rows.push({ labels: [characterStateText, '&nbsp;'] })
        const rules = characterStatesMapping.get(characterStatesId)
        if (rules == null) {
          continue
        }

        rules.sort(function (rule1, rule2) {
          const character1 = characters.getById(rule1.getActionCharacterId())
          if (character1 == null) {
            return -1
          }

          const character2 = characters.getById(rule2.getActionCharacterId())
          if (character2 == null) {
            return -1
          }
          return AbstractItems.sortNumberComparator(character1, character2)
        })

        for (let z = 0; z < rules.length; z++) {
          const rule = rules[z]
          const actionId = rule.getActionId()
          const actionCharacterId = rule.getActionCharacterId()
          const actionCharacterStateId = rule.getActionStateId()
          const actionCharacter = characters.getById(actionCharacterId)
          if (actionCharacter == null) {
            continue
          }

          const actionCharacterName =
            '[' +
            (actionCharacter.getNumber() - numberingMode) +
            '] ' +
            mb.htmlEscape(actionCharacter.getName())
          let actionCharacterStateName
          if (actionCharacterStateId === null) {
            actionCharacterStateName = '[-] Inapplicable'
          } else {
            const actionCharacterState = actionCharacter.getCharacterStateById(
              actionCharacterStateId
            )
            actionCharacterStateName =
              '[' +
              actionCharacterState!.getNumber() +
              '] ' +
              mb.htmlEscape(actionCharacterState!.getName())
          }
          const row = {
            labels: [
              '\u2794&nbsp;&nbsp;' + actionCharacterName,
              'Set state to <b>' + actionCharacterStateName + '</b>',
            ],
            className: 'characterRuleAction',
            removeable: !this.dialog.readonly,
            data: { actionId: actionId, characterId: characterId },
          }
          rows.push(row)
        }
      }
    }
    return rows
  }
}
