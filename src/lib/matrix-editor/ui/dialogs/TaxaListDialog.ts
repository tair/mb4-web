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
import { Popover } from 'bootstrap'

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
  private infoPopover: Popover | null = null

  /**
   * The tooltip HTML content for the info icon.
   */
  private static readonly infoTooltipHtml = `
    <div class="taxa-list-tooltip-content">
      <p><b>Missing a taxon?</b> Add it first under the "Taxa" tab for it to appear here.</p>
      <p><b>How to use:</b> Drag taxa between lists to add or remove them from the matrix.</p>
      <p><b>Selection tips:</b> Hold <b>Shift</b> for contiguous selection, <b>⌘</b> (Mac) or <b>Ctrl</b> (PC) for non-contiguous.</p>
      <p><b>Move to position:</b> Select taxa, enter a row number, and click Move to reorder without dragging.</p>
    </div>
  `

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

  override dispose() {
    if (this.infoPopover) {
      this.infoPopover.dispose()
      this.infoPopover = null
    }
    super.dispose()
  }

  protected override enterDocument() {
    super.enterDocument()

    const element = this.getElement()

    // Initialize the info popover
    const infoIcon = element.querySelector('#taxaListInfoIcon') as HTMLElement
    if (infoIcon) {
      this.infoPopover = new Popover(infoIcon, {
        html: true,
        placement: 'bottom',
        trigger: 'hover focus',
        customClass: 'taxa-list-tooltip',
        container: 'body',
        content: TaxaListDialog.infoTooltipHtml,
      })
    }

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

    // Listen for move to position button click
    const movePositionBtn = element.querySelector<HTMLButtonElement>('.movePositionBtn')
    if (movePositionBtn) {
      this.getHandler().listen(movePositionBtn, 'click', () =>
        this.handleMoveToPosition()
      )
    }

    // Allow Enter key to trigger move
    const movePositionInput = element.querySelector<HTMLInputElement>('.movePositionInput')
    if (movePositionInput) {
      this.getHandler().listen(movePositionInput, 'keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          this.handleMoveToPosition()
        }
      })
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
   * Handles the move to position button click.
   * Moves selected taxa to the specified position.
   */
  private handleMoveToPosition() {
    const element = this.getElement()
    const positionInput = element.querySelector<HTMLInputElement>('.movePositionInput')
    if (!positionInput) {
      return
    }

    const positionValue = positionInput.value.trim()
    if (!positionValue) {
      alert('Please enter a position number')
      return
    }

    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    
    // Parse the position (user enters 1-based or 0-based depending on numbering mode)
    const targetPosition = parseInt(positionValue, 10)
    if (isNaN(targetPosition)) {
      alert('Please enter a valid number')
      return
    }

    // Convert to 0-based index for the API
    // User enters 1 for first position when display is 1-indexed (numberingMode=0)
    const position = targetPosition - 1 + numberingMode

    const taxonIdsToMove = mb.convertToNumberArray(
      this.taxaInMatrixSelect.getSelectedValues()
    )

    if (taxonIdsToMove.length === 0) {
      alert('Please select taxa to move')
      return
    }

    const taxa = this.matrixModel.getTaxa()
    const maxPosition = taxa.size()

    if (position < 0 || position >= maxPosition) {
      alert(`Position must be between ${1 - numberingMode} and ${maxPosition - numberingMode}`)
      return
    }

    // If moving a single taxon to its current position, no need to reorder
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
        positionInput.value = ''
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
      })
  }

  /**
   * @return The HTML content of the dialog.
   */
  private static htmlContent(): string {
    return `
      <div class="taxa-list-help-row">
        <span class="taxa-list-info-wrapper" id="taxaListInfoIcon" tabindex="0">
          <i class="fa-solid fa-circle-info taxa-list-info-icon"></i>
        </span>
        <span class="taxa-list-help-hint">Hover for instructions</span>
      </div>
      <div class="taxaSelect nonSelectable">
        <span class="currentTaxaSelect">
          <div class="taxa-list-header">Taxa in this matrix</div>
        </span>
        <span class="availableTaxaSelect">
          <div class="taxa-list-header">Taxa in project but not in this matrix</div>
        </span>
      </div>
      <div class="movePositionRow">
        <label>Move selected to position:</label>
        <input type="number" class="form-control movePositionInput" min="1" placeholder="#">
        <button type="button" class="btn btn-outline-secondary movePositionBtn">Move</button>
      </div>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
        <button type="button" class="btn btn-outline-primary createCompositeBtn">
          <i class="fa-solid fa-layer-group"></i> Create Composite Taxon
        </button>
        <small class="text-muted ms-2">
          Combine multiple taxa rows into a single composite row with merged scores.
          <br />
          <em>Note: This is an experimental feature and we may change how it works based on feedback.</em>
        </small>
      </div>`
  }
}
