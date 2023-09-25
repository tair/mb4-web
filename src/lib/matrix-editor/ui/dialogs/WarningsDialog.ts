import { DataGridTable, type DataRow } from '../DataGridTable'
import { Dialog } from '../Dialog'
import { EventType } from '../Component'
import { MatrixModel } from '../../MatrixModel'
import { ModalDefaultButtons } from '../Modal'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import * as PartitionChangedEvents from '../../events/PartitionChangedEvent'
import * as PartitionRefreshedEvents from '../../events/PartitionRefreshedEvent'
import * as GoToCellEvents from '../../events/GoToCellEvent'

/**
 * The warnings dialog used to display the warnings present in the Matrix editor.
 *
 * @param matrixModel the data associated with the matrix.
 */
export class WarningsDialog extends Dialog {
  protected gridTable: DataGridTable

  constructor(private matrixModel: MatrixModel) {
    super()
    this.gridTable = new DataGridTable()
    this.registerDisposable(this.gridTable)
    this.setTitle('Warnings')
    this.setHasBackdrop(false)
    this.addButton(ModalDefaultButtons.OK)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('warningDialog')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = WarningsDialog.htmlContent()
    this.gridTable.addColumn('Type')
    this.gridTable.addColumn('What')
    this.gridTable.addColumn('Warning')
    this.gridTable.addRows(this.getWarningRows())
    const warningsElement = this.getElementByClass('warningRules')
    this.gridTable.render(warningsElement)
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler.listen(
      this.matrixModel,
      [
        CharacterChangedEvents.TYPE,
        PartitionChangedEvents.TYPE,
        PartitionRefreshedEvents.TYPE,
      ],
      () => this.resetWarningRows()
    )
    handler.listen(this.gridTable, EventType.SELECT, (e: any) =>
      this.handleGridClick(e)
    )
  }

  /**
   * Resets the warnings in the datagrid
   */
  private resetWarningRows() {
    this.gridTable.clearRows()
    this.gridTable.addRows(this.getWarningRows())
    this.gridTable.redraw()
  }

  /**
   * @return the data grid rows of the warnings
   */
  private getWarningRows(): DataRow[] {
    const rows: DataRow[] = []
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const partitionCharacters = this.matrixModel.getPartitionCharacters()
    for (let x = 0; x < partitionCharacters.length; x++) {
      const character = partitionCharacters[x]
      if (character.getLastScoredOn() < character.getLastChangedOn()) {
        const row: DataRow = {
          labels: [
            'characters',
            '[' +
              (character.getNumber() - numberingMode) +
              '] ' +
              character.getName(),
            'This character has changed since you last scored it',
          ],
          data: {
            characterId: character.getId(),
          },
        }
        rows.push(row)
      }
    }
    return rows
  }

  /**
   * Handles events when character are clicked
   * @param e The event that triggerd this callback.
   */
  private handleGridClick(e: any) {
    const characterId = parseInt(e.detail['characterId'], 10)
    const column = characterId
      ? this.matrixModel.getCharacterIndexById(characterId)
      : -1
    window.dispatchEvent(GoToCellEvents.create(-1, column))
  }

  /**
   * @return The HTML content of the warnings dialog
   */
  private static htmlContent(): string {
    return '<div class="warningRules"></div>'
  }
}
