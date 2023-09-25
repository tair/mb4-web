import { MatrixModel } from '../../MatrixModel'
import * as TaxaChangedEvents from '../../events/TaxaChangedEvent'
import { Dialog } from '../Dialog'
import {
  DraggableSelect,
  DraggableSelectDroppedEvent,
} from '../DraggableSelect'
import { ConfirmDialog } from './ConfirmDialog'
import * as mb from '../../mb'
import { ModalDefaultButtons } from '../Modal'

/**
 * The Taxon list dialog which adds and removes taxa within this matrix.
 */
export class TaxaListDialog extends Dialog {
  /**
   * The confirmation text to remove a taxa from the matrix.
   */
  private static readonly removeTaxaConfirmText =
    'You have just attempted to remove a taxon that has already been scored ' +
    'in this matrix. Carrying this action forward will permanently erase ' +
    "that taxon's scores and any associated comments and media from the " +
    'cells in this matrix (it will not erase the taxon or media from the ' +
    'database). If you do not wish to remove this row and its data ' +
    'permanently we suggest you investigate the Partitions tool.'

  private readonly matrixModel: MatrixModel
  private readonly taxaInMatrixSelect: DraggableSelect
  private readonly taxaNotInMatrixSelect: DraggableSelect

  /**
   * @param matrixModel The data associated with the matrix.
   */
  constructor(matrixModel: MatrixModel) {
    super()

    this.matrixModel = matrixModel

    this.taxaInMatrixSelect = new DraggableSelect()
    this.registerDisposable(this.taxaInMatrixSelect)

    this.taxaNotInMatrixSelect = new DraggableSelect()
    this.registerDisposable(this.taxaNotInMatrixSelect)
  }

  protected override initialize(): void {
    super.initialize()
    this.setTitle('Matrix Taxa List Editor')
    this.addButton(ModalDefaultButtons.DONE)
  }

  protected override createDom() {
    super.createDom()
    const element = this.getElement()

    element.classList.add('taxaListDialog', 'modal-lg')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = this.htmlContent()

    const currentTaxaSelect = this.getElementByClass('currentTaxaSelect')
    this.taxaInMatrixSelect.render(currentTaxaSelect)
    this.setTaxaInMatrixSelect()

    const availableTaxaSelect = this.getElementByClass('availableTaxaSelect')
    this.taxaNotInMatrixSelect.setEnabled(false)
    this.taxaNotInMatrixSelect.render(availableTaxaSelect)
    this.setAvailableTaxaInMatrixSelect()
  }

  protected override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(this.matrixModel, TaxaChangedEvents.TYPE, () =>
        this.handleTaxaChange()
      )
      .listen(
        this.taxaInMatrixSelect,
        DraggableSelect.DroppedEventType,
        (e: CustomEvent<DraggableSelectDroppedEvent>) =>
          this.handleDropInMatrix(e)
      )
      .listen(
        this.taxaNotInMatrixSelect,
        DraggableSelect.DroppedEventType,
        () => this.handleDropOutMatrix()
      )
  }

  protected override finalizeDom(): void {
    super.finalizeDom()

    this.taxaInMatrixSelect.addTarget(this.taxaInMatrixSelect)
    this.taxaInMatrixSelect.addTarget(this.taxaNotInMatrixSelect)
    this.taxaNotInMatrixSelect.addTarget(this.taxaInMatrixSelect)
    this.taxaNotInMatrixSelect.addTarget(this.taxaNotInMatrixSelect)
  }

  /**
   * Sets the taxa to the Taxa in Matrix select component.
   */
  protected setTaxaInMatrixSelect() {
    const taxa = this.matrixModel.getTaxa()
    this.taxaInMatrixSelect.clearItems()
    const numOfTaxa = taxa.size()
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    for (let x = 0; x < numOfTaxa; x++) {
      const taxon = taxa.getAt(x)
      const taxonNumber = taxon.getNumber() - numberingMode
      this.taxaInMatrixSelect.addItem(
        '[' + taxonNumber + '] ' + taxon.getDisplayName(),
        taxon.getId()
      )
    }
    this.taxaInMatrixSelect.redraw()
  }

  /**
   * Sets the taxa to the Taxa in Matrix select component.
   */
  protected setAvailableTaxaInMatrixSelect() {
    this.savingLabel.saving('Loading...')
    return this.matrixModel
      .getAvailableTaxa()
      .then((availableTaxa) => {
        this.taxaNotInMatrixSelect.clearItems()
        const numOfAvailableTaxa = availableTaxa.size()
        for (let x = 0; x < numOfAvailableTaxa; x++) {
          const taxon = availableTaxa.getAt(x)
          this.taxaNotInMatrixSelect.addItem(
            taxon.getDisplayName(),
            taxon.getId()
          )
        }
        this.taxaNotInMatrixSelect.redraw()
        this.taxaNotInMatrixSelect.setEnabled(true)
        this.savingLabel.saved()
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
      })
  }

  /**
   * Handles when taxa within this matrix has been changed.
   */
  protected handleTaxaChange() {
    this.setAvailableTaxaInMatrixSelect()
    this.setTaxaInMatrixSelect()
  }

  /**
   * Handles the drop event on the taxa in matrix select component.
   *
   * @param e The event that triggered this callback.
   */
  private handleDropInMatrix(e: CustomEvent<DraggableSelectDroppedEvent>) {
    if (e.detail.isTargetSelf) {
      const position = this.taxaInMatrixSelect.getDroppedIndex()
      const taxonIdsToMove = mb.convertToNumberArray(
        this.taxaInMatrixSelect.getSelectedValues()
      )

      // If the user is moving one taxa to the same position, we don't need to reorder the list.
      if (
        taxonIdsToMove.length === 1 &&
        this.matrixModel.getTaxonIndexById(taxonIdsToMove[0]) === position
      ) {
        return
      }
      this.savingLabel.saving()
      this.matrixModel
        .reorderTaxa(taxonIdsToMove, position)
        .then(() => {
          this.setTaxaInMatrixSelect()
          this.taxaInMatrixSelect.redraw()
          this.savingLabel.saved()
        })
        .catch((e) => {
          this.savingLabel.failed()
          alert(e)
        })
    } else {
      const taxaIdsToAdd = mb.convertToNumberArray(
        this.taxaNotInMatrixSelect.getSelectedValues()
      )
      const position = this.taxaInMatrixSelect.getDroppedIndex()
      this.savingLabel.saving()
      this.matrixModel
        .addTaxaToMatrix(taxaIdsToAdd, position)
        .then(() => {
          this.setTaxaInMatrixSelect()
          return this.setAvailableTaxaInMatrixSelect()
        })
        .then(() => {
          this.taxaInMatrixSelect.redraw()
          this.taxaNotInMatrixSelect.redraw()
          this.savingLabel.saved()
        })
        .catch((e) => {
          this.savingLabel.failed()
          alert(e)
        })
    }
  }

  /**
   * Handles the drop event on the taxa in matrix select component.
   */
  private handleDropOutMatrix() {
    // Only administrators should be able to remove taxa from this matrix.
    const projectPreferences = this.matrixModel.getProjectProperties()
    if (!projectPreferences.getIsAdmin()) {
      alert('You must be an administrator to remove a taxon from this matrix')
      return
    }
    const cells = this.matrixModel.getCells()
    const taxaIdsToRemove = mb.convertToNumberArray(
      this.taxaInMatrixSelect.getSelectedValues()
    )
    if (cells.isTaxaScored(taxaIdsToRemove)) {
      const confirmDialog = new ConfirmDialog(
        'Warning(!)',
        TaxaListDialog.removeTaxaConfirmText,
        () => this.removeTaxaFromMatrix(taxaIdsToRemove, true)
      )
      confirmDialog.setVisible(true)
    } else {
      this.removeTaxaFromMatrix(taxaIdsToRemove, false)
    }
  }

  /**
   * Removes taxa from the matrix and updates the dialog.
   * @param taxaIdsToRemove the taxa to remove from the matrix.
   * @param consentToDelete True if the user was given a dialog and consented to deleting the taxa.
   */
  removeTaxaFromMatrix(taxaIdsToRemove: number[], consentToDelete: boolean) {
    this.savingLabel.saving()
    this.matrixModel
      .removeTaxaFromMatrix(taxaIdsToRemove, consentToDelete)
      .then(() => {
        this.setTaxaInMatrixSelect()
        return this.setAvailableTaxaInMatrixSelect()
      })
      .then(() => {
        this.taxaInMatrixSelect.redraw()
        this.taxaNotInMatrixSelect.redraw()
        this.savingLabel.saved()
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
      })
  }

  /**
   * @return The HTML content of the dialog.
   */
  htmlContent(): string {
    return `
      <div style="margin-bottom: 10px">
        <i>
          Don't see the taxon you want to add? Please add it first under the
          "Taxa" tab for it to show up here.
        </i>
      </div>
      <div class="taxaSelect nonSelectable">
        <span class="currentTaxaSelect">
          Taxa in this matrix
        </span>
        <span class="availableTaxaSelect">
          Taxa in project but not in this matrix
        </span>
      </div>
      <div style="margin-top: 10px">
        <i>
          Drag taxa from one list to the other to add and remove them from the
          matrix. To select contiguous taxa, press the hold the SHIFT key; for
          non-contiguous taxa, use the COMMAND key (Mac) or CTRL key (PC).'
        </i>
      </div>`
  }
}
