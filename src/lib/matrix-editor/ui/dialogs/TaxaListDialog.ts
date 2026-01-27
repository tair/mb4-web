import { MatrixModel } from '../../MatrixModel'
import * as TaxaChangedEvents from '../../events/TaxaChangedEvent'
import * as TaxaAddedEvents from '../../events/TaxaAddedEvent'
import { Dialog } from '../Dialog'
import {
  DraggableSelect,
  DraggableSelectDroppedEvent,
} from '../DraggableSelect'
import { ConfirmDialog } from './ConfirmDialog'
import { CreateCompositeTaxonDialog } from './CreateCompositeTaxonDialog'
import * as mb from '../../mb'
import { ModalDefaultButtons } from '../Modal'
import { AlertDialog } from './Alert'

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
  private createCompositeButton: HTMLButtonElement | null = null

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
    contentElement.innerHTML = TaxaListDialog.htmlContent()

    const currentTaxaSelect = this.getElementByClass('currentTaxaSelect')
    this.taxaInMatrixSelect.render(currentTaxaSelect)
    this.setTaxaInMatrixSelect()

    const availableTaxaSelect = this.getElementByClass('availableTaxaSelect')
    this.taxaNotInMatrixSelect.setEnabled(false)
    this.taxaNotInMatrixSelect.render(availableTaxaSelect)
    this.setAvailableTaxaInMatrixSelect()

    // Get reference to create composite button
    this.createCompositeButton = this.getElementByClass<HTMLButtonElement>('createCompositeBtn')
    
    // Hide button if project is published
    if (this.matrixModel.isPublished() && this.createCompositeButton) {
      this.createCompositeButton.style.display = 'none'
    }
  }

  protected override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(this.matrixModel, TaxaChangedEvents.TYPE, () =>
        this.handleTaxaChange()
      )
      .listen(this.matrixModel, TaxaAddedEvents.TYPE, () =>
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

    // Listen for create composite button click
    if (this.createCompositeButton) {
      this.getHandler().listen(this.createCompositeButton, 'click', () =>
        this.handleCreateCompositeClick()
      )
    }

    // Listen for search input changes
    const searchInMatrixInput =
      this.getElementByClass<HTMLInputElement>('searchInMatrix')
    if (searchInMatrixInput) {
      this.getHandler().listen(searchInMatrixInput, 'input', (e: Event) =>
        this.handleSearchInMatrix(e)
      )
    }

    const searchNotInMatrixInput =
      this.getElementByClass<HTMLInputElement>('searchNotInMatrix')
    if (searchNotInMatrixInput) {
      this.getHandler().listen(searchNotInMatrixInput, 'input', (e: Event) =>
        this.handleSearchNotInMatrix(e)
      )
    }
  }

  protected override finalizeDom(): void {
    super.finalizeDom()

    this.taxaInMatrixSelect.allowFrom(this.taxaInMatrixSelect)
    this.taxaInMatrixSelect.allowFrom(this.taxaNotInMatrixSelect)
    this.taxaNotInMatrixSelect.allowFrom(this.taxaInMatrixSelect)
  }

  /**
   * Sets the taxa to the Taxa in Matrix select component.
   */
  private setTaxaInMatrixSelect() {
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
  private setAvailableTaxaInMatrixSelect() {
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
  private handleTaxaChange() {
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

    if (taxaIdsToRemove.length == 0) {
      alert('Please select taxa to remove from matrix')
      return
    }

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
  private removeTaxaFromMatrix(
    taxaIdsToRemove: number[],
    consentToDelete: boolean
  ) {
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
   * Handles the create composite button click.
   * Opens the CreateCompositeTaxonDialog.
   */
  private handleCreateCompositeClick() {
    const dialog = new CreateCompositeTaxonDialog(this.matrixModel)
    dialog.setVisible(true)
  }

  /**
   * Filters the taxa list based on search query.
   * @param select The DraggableSelect component to filter.
   * @param query The search query.
   */
  private filterTaxaList(select: DraggableSelect, query: string) {
    const element = select.getElement()
    const items = element.querySelectorAll('li')
    const lowerQuery = query.toLowerCase().trim()

    items.forEach((item) => {
      if (item.classList.contains('dead')) {
        return
      }
      const text = item.textContent?.toLowerCase() || ''
      if (lowerQuery === '' || text.includes(lowerQuery)) {
        item.classList.remove('filtered-out')
      } else {
        item.classList.add('filtered-out')
      }
    })
  }

  /**
   * Handles the search input for taxa in matrix.
   */
  private handleSearchInMatrix(e: Event) {
    const input = e.target as HTMLInputElement
    this.filterTaxaList(this.taxaInMatrixSelect, input.value)
  }

  /**
   * Handles the search input for taxa not in matrix.
   */
  private handleSearchNotInMatrix(e: Event) {
    const input = e.target as HTMLInputElement
    this.filterTaxaList(this.taxaNotInMatrixSelect, input.value)
  }

  /**
   * @return The HTML content of the dialog.
   */
  private static htmlContent(): string {
    return `
      <div style="margin-bottom: 10px">
        <i>
          Don't see the taxon you want to add? Please add it first under the
          "Taxa" tab for it to show up here.
        </i>
      </div>
      <div class="taxaSelect nonSelectable">
        <span class="currentTaxaSelect">
          <div class="taxa-list-header">Taxa in this matrix</div>
          <input type="text" class="form-control form-control-sm searchInMatrix" placeholder="Search taxa..." />
        </span>
        <span class="availableTaxaSelect">
          <div class="taxa-list-header">Taxa in project but not in this matrix</div>
          <input type="text" class="form-control form-control-sm searchNotInMatrix" placeholder="Search taxa..." />
        </span>
      </div>
      <div style="margin-top: 10px">
        <i>
          Drag taxa from one list to the other to add and remove them from the
          matrix. To select contiguous taxa, press the hold the SHIFT key; for
          non-contiguous taxa, use the COMMAND key (Mac) or CTRL key (PC).
        </i>
      </div>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
        <button type="button" class="btn btn-outline-primary createCompositeBtn">
          <i class="fa-solid fa-layer-group"></i> Create Composite Taxon
        </button>
        <small class="text-muted ms-2">
          Combine multiple taxa rows into a single composite row with merged scores.
        </small>
      </div>`
  }
}
