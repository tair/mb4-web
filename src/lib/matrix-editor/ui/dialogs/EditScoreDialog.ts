import { DataGridTable, DataRow } from '../DataGridTable'
import { Checkbox } from '../Checkbox'
import { EventType, MobileFriendlyClickEventType } from '../Component'
import { Modal, ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'
import * as mb from '../../mb'

/**
 * Edit a score
 *
 * @param scores The scores for this dialog
 * @param shouldScore A boolean indicating whether we should score the characters.
 * @param selectCallback the callback when the user press save
 */
export class EditScoreDialog extends Modal {
  private scores: Score[]
  private shouldScore: boolean
  private selectCallback: (scores: (number | null)[]) => Promise<void>
  private checkboxes: Checkbox[]
  private selectedScores: (number | null)[]
  private statesGridTable: DataGridTable

  constructor(
    scores: Score[],
    shouldScore: boolean,
    selectCallback: (scores: (number | null)[]) => Promise<void>
  ) {
    super()

    this.scores = scores
    this.shouldScore = shouldScore
    this.selectCallback = selectCallback

    this.checkboxes = []
    this.selectedScores = []

    this.statesGridTable = new DataGridTable()
    this.registerDisposable(this.statesGridTable)

    this.setTitle('Edit Score')
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(ModalDefaultButtons.SAVE)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  override createDom() {
    super.createDom()
    const contentElement = this.getContentElement()
    contentElement.innerHTML = this.htmlContent()
    contentElement.classList.add('editScoreDialog')
    this.statesGridTable.addColumn('&nbsp;')
    this.statesGridTable.addColumn('#')
    this.statesGridTable.addColumn('State')
    const rows: DataRow[] = []
    for (let x = 0; x < this.scores.length; x++) {
      const score = this.scores[x]
      const checkbox = new Checkbox(score.id)
      checkbox.setEnabled(this.shouldScore)
      this.statesGridTable.registerDisposable(checkbox)
      this.checkboxes.push(checkbox)
      const row = {
        labels: [checkbox, String(score.num), score.name],
        disabled: !checkbox.isEnabled(),
      }
      rows.push(row)
    }

    // not defined score
    const notDefinedCheckbox = new Checkbox(NaN)
    this.statesGridTable.registerDisposable(notDefinedCheckbox)
    this.checkboxes.push(notDefinedCheckbox)
    rows.push({ labels: [notDefinedCheckbox, '?', '?'] })

    // not applicable score
    const notApplicableCheckbox = new Checkbox(0)
    notApplicableCheckbox.setEnabled(this.shouldScore)
    this.statesGridTable.registerDisposable(notApplicableCheckbox)
    this.checkboxes.push(notApplicableCheckbox)
    rows.push({
      labels: [notApplicableCheckbox, '-', '-'],
      disabled: !notApplicableCheckbox.isEnabled(),
    })

    // NPA score
    const NPACheckbox = new Checkbox(-1)
    NPACheckbox.setEnabled(this.shouldScore)
    this.statesGridTable.registerDisposable(NPACheckbox)
    this.checkboxes.push(NPACheckbox)
    rows.push({
      labels: [
        NPACheckbox,
        'NPA',
        'Not presently available (= ? in nexus file)',
      ],
      disabled: !notApplicableCheckbox.isEnabled(),
    })
    this.statesGridTable.addRows(rows)
    const statesPane = this.getElementByClass('scoringGrid')
    this.statesGridTable.render(statesPane)
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler
      .listen(this, EventType.SELECT, (e: CustomEvent<any>) => this.onHandleSelect(e))
      .listen(
        this.statesGridTable,
        MobileFriendlyClickEventType,
        (e: Event) => this.handleGridSelect(e)
      )
    for (let x = 0; x < this.checkboxes.length; x++) {
      const checkbox = this.checkboxes[x]
      handler.listen(checkbox, EventType.CHANGE, () =>
        this.handleCheckboxSelect(checkbox)
      )
    }
  }

  /**
   * Handles when the users clicks one of the dialog buttons.
   *
   * @param e The event that triggered this callback.
   * @return Whether the event was processed.
   */
  private onHandleSelect(e: CustomEvent): boolean {
    if (e.detail.key === ModalDefaultButtonKeys.SAVE) {
      this.selectCallback(this.selectedScores).then(() => this.close())
      return false
    }
    return true
  }

  /**
   * Handles when the grid has been double-clicked.
   *
   * @param e The event that triggered this callback.
   */
  handleGridSelect(e: Event) {
    const target = <HTMLElement>e.target
    const tr = mb.getElementParent(target, 'TR')
    if (tr == null) {
      return
    }

    const table = tr.parentElement
    const index = Array.prototype.indexOf.call(table!.children, tr)
    const targetCheckbox = this.checkboxes[index]
    const enableScore =
      !targetCheckbox.isChecked() && targetCheckbox.isEnabled()
    targetCheckbox.setChecked(enableScore)
    targetCheckbox.dispatchEvent(new Event(EventType.CHANGE))
  }

  /**
   * Updates the cell score based on whether the user enabled or disabled a given state.
   *
   * @param checkbox The checkbox that was changed.
   */
  private handleCheckboxSelect(checkbox: Checkbox) {
    const stateId = checkbox.getValue()
    const scoredEnabled = checkbox.isChecked()

    // Is the next or current state a "?", "-", or "NPA"
    const isNextSingleState =
      stateId === null || stateId === -1 || stateId === 0
    const isCurrentStateSingle =
      this.selectedScores.length === 1 &&
      (this.selectedScores[0] === null ||
        this.selectedScores[0] === -1 ||
        this.selectedScores[0] === 0)
    if (isNextSingleState || isCurrentStateSingle) {
      this.selectedScores = []
      this.unCheckedAll()
    }
    if (scoredEnabled) {
      this.selectedScores.push(stateId)
    } else {
      mb.remove(this.selectedScores, stateId)
    }

    // Update the checkbox UI right away
    checkbox.setChecked(scoredEnabled)
  }

  /**
   * Uncheck all checkboxes
   * @return The indices of the checkboxes which were previously checked.
   */
  unCheckedAll(): number[] {
    const checkedIndices: number[] = []
    for (let x = 0; x < this.checkboxes.length; x++) {
      const checkbox = this.checkboxes[x]
      if (checkbox.isChecked()) {
        checkedIndices.push(x)
      }
      checkbox.setChecked(false)
    }
    return checkedIndices
  }

  /**
   * @return The HTML content of the scoring pane
   */
  htmlContent(): string {
    return (
      '<div class="scoringGrid"></div>' +
      (this.shouldScore
        ? ''
        : '<p><i>Some scores are disabled because you selected continuous characters.<i></p>')
    )
  }
}

export interface Score {
  id: number
  num: number
  name: string
}
