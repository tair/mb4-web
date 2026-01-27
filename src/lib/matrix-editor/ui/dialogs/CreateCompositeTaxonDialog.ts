import { MatrixModel } from '../../MatrixModel'
import { Dialog } from '../Dialog'
import { DraggableSelect } from '../DraggableSelect'
import * as mb from '../../mb'
import { ModalDefaultButtons } from '../Modal'
import { Taxon } from '../../data/Taxa'

/**
 * Dialog for creating a composite taxon from multiple source taxa.
 * Allows users to select multiple specimen-level taxa and combine them
 * into a single composite species-level taxon row.
 */
export class CreateCompositeTaxonDialog extends Dialog {
  private readonly matrixModel: MatrixModel
  private readonly sourceTaxaSelect: DraggableSelect
  private genusInput: HTMLInputElement | null = null
  private speciesInput: HTMLInputElement | null = null
  private subspeciesInput: HTMLInputElement | null = null
  private createButton: HTMLButtonElement | null = null

  /**
   * @param matrixModel The data associated with the matrix.
   */
  constructor(matrixModel: MatrixModel) {
    super()

    this.matrixModel = matrixModel
    this.sourceTaxaSelect = new DraggableSelect()
    this.registerDisposable(this.sourceTaxaSelect)
  }

  protected override initialize(): void {
    super.initialize()
    this.setTitle('Create Composite Taxon')
    this.setDisposeOnHide(true)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  protected override createDom() {
    super.createDom()
    const element = this.getElement()

    element.classList.add('createCompositeTaxonDialog')
    
    // Add modal-lg to the modal-dialog element for proper sizing
    const modalDialog = element.querySelector('.modal-dialog')
    if (modalDialog) {
      modalDialog.classList.add('modal-lg')
    }
    
    const contentElement = this.getContentElement()
    contentElement.innerHTML = CreateCompositeTaxonDialog.htmlContent()

    // Set up the taxa select
    const taxaSelectContainer = this.getElementByClass('sourceTaxaSelect')
    this.sourceTaxaSelect.render(taxaSelectContainer)
    this.populateTaxaSelect()

    // Get references to input elements
    this.genusInput = this.getElementByClass<HTMLInputElement>('genusInput')
    this.speciesInput = this.getElementByClass<HTMLInputElement>('speciesInput')
    this.subspeciesInput = this.getElementByClass<HTMLInputElement>('subspeciesInput')
    this.createButton = this.getElementByClass<HTMLButtonElement>('createCompositeBtn')
  }

  protected override enterDocument() {
    super.enterDocument()
    this.getHandler()
      // DraggableSelect doesn't fire 'change' events, so we listen to mouseup
      // to detect when selection changes (after click/ctrl+click/shift+click)
      .listen(this.sourceTaxaSelect.getElement(), 'mouseup', () =>
        this.updateCreateButtonState()
      )
      .listen(this.genusInput!, 'input', () => this.updateCreateButtonState())
      .listen(this.speciesInput!, 'input', () => this.updateCreateButtonState())
      .listen(this.subspeciesInput!, 'input', () => this.updateCreateButtonState())
      .listen(this.createButton!, 'click', () => this.handleCreateClick())
  }

  /**
   * Populate the taxa select with non-composite taxa from the matrix
   */
  private populateTaxaSelect() {
    const taxa = this.matrixModel.getTaxa()
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()

    this.sourceTaxaSelect.clearItems()
    const numOfTaxa = taxa.size()

    for (let x = 0; x < numOfTaxa; x++) {
      const taxon = taxa.getAt(x)
      
      // Skip composite taxa - they cannot be sources for other composites
      if (taxon.isComposite()) {
        continue
      }

      const taxonNumber = taxon.getNumber() - numberingMode
      this.sourceTaxaSelect.addItem(
        '[' + taxonNumber + '] ' + taxon.getDisplayName(),
        taxon.getId()
      )
    }
    this.sourceTaxaSelect.redraw()
  }

  /**
   * Update the create button state based on selection and name input
   */
  private updateCreateButtonState() {
    const selectedValues = this.sourceTaxaSelect.getSelectedValues()
    const genus = this.genusInput?.value.trim() || ''
    // Genus is required, species and subspecies are optional
    const isValid = selectedValues.length >= 2 && genus.length > 0

    if (this.createButton) {
      this.createButton.disabled = !isValid
    }

    // Update the selection count display
    const countDisplay = this.getElementByClass('selectionCount')
    if (countDisplay) {
      countDisplay.textContent = `${selectedValues.length} taxa selected`
      countDisplay.classList.toggle('text-danger', selectedValues.length < 2)
      countDisplay.classList.toggle('text-success', selectedValues.length >= 2)
    }
  }

  /**
   * Handle the create button click
   */
  private handleCreateClick() {
    const selectedValues = this.sourceTaxaSelect.getSelectedValues()
    const sourceTaxaIds = mb.convertToNumberArray(selectedValues)
    const genus = this.genusInput?.value.trim() || ''
    const specificEpithet = this.speciesInput?.value.trim() || ''
    const subspecificEpithet = this.subspeciesInput?.value.trim() || ''

    if (sourceTaxaIds.length < 2) {
      alert('Please select at least 2 taxa to combine')
      return
    }

    if (!genus) {
      alert('Please enter a genus name for the composite taxon')
      return
    }

    this.savingLabel.saving('Creating composite taxon...')
    this.createButton!.disabled = true

    this.matrixModel
      .createCompositeTaxon(sourceTaxaIds, genus, specificEpithet, subspecificEpithet)
      .then(() => {
        this.savingLabel.saved()
        this.setVisible(false)
      })
      .catch((e) => {
        this.savingLabel.failed()
        this.createButton!.disabled = false
        alert(e)
      })
  }

  /**
   * @return The HTML content of the dialog.
   */
  private static htmlContent(): string {
    return `
      <div class="composite-taxon-form">
        <div class="row mb-3">
          <div class="col-md-4">
            <label class="form-label">
              <strong>Genus</strong> <span class="text-danger">*</span>
            </label>
            <input 
              type="text" 
              class="form-control genusInput" 
              placeholder="e.g., Prolacerta"
            />
          </div>
          <div class="col-md-4">
            <label class="form-label">
              <strong>Species</strong>
            </label>
            <input 
              type="text" 
              class="form-control speciesInput" 
              placeholder="e.g., broomi"
            />
          </div>
          <div class="col-md-4">
            <label class="form-label">
              <strong>Subspecies</strong>
            </label>
            <input 
              type="text" 
              class="form-control subspeciesInput" 
              placeholder="(optional)"
            />
          </div>
        </div>
        <small class="form-text text-muted mb-3 d-block">
          Enter the taxonomic name for the composite taxon. Genus is required.
        </small>
        
        <div class="form-group mb-3">
          <label class="form-label">
            <strong>Select Source Taxa</strong>
            <span class="selectionCount text-danger ms-2">0 taxa selected</span>
          </label>
          <div class="sourceTaxaSelect"></div>
          <small class="form-text text-muted">
            Hold CTRL (PC) or CMD (Mac) to select multiple taxa. 
            At least 2 taxa are required.
          </small>
        </div>

        <div class="alert alert-info">
          <strong>How it works:</strong>
          <ul class="mb-0 mt-2">
            <li>Scores from selected taxa will be combined using union logic</li>
            <li>If multiple taxa have different scores for a character, all unique scores will be included (polymorphic)</li>
            <li>The composite row will automatically update when source taxa scores change</li>
            <li>Original source taxa rows will be preserved</li>
          </ul>
        </div>

        <div class="d-flex justify-content-end">
          <button type="button" class="btn btn-primary createCompositeBtn" disabled>
            Create Composite Taxon
          </button>
        </div>
      </div>
    `
  }
}
