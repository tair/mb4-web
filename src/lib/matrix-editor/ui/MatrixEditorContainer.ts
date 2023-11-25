import { MatrixModel } from '../MatrixModel'
import { MatrixAccessorContainer } from './MatrixAccessorContainer'
import { MatrixGridHandler } from './MatrixGridHandler'
import { BatchDialog } from './dialogs/BatchDialog'
import { CharacterListDialog } from './dialogs/CharacterListDialog'
import { OntologyDialog } from './dialogs/OntologyDialog'
import { PartitionsDialog } from './dialogs/PartitionsDialog'
import { PreferencesDialog } from './dialogs/PreferencesDialog'
import { RuleCheckerDialog } from './dialogs/RuleCheckerDialog'
import { TaxaListDialog } from './dialogs/TaxaListDialog'
import { WarningsDialog } from './dialogs/WarningsDialog'
import { CellDialog } from './dialogs/CellDialog'
import { CharacterDialog } from './dialogs/CharacterDialog'
import { TaxonDialog } from './dialogs/TaxonDialog'
import { EventType } from './Component'

/**
 * The UI of the matrix editor, which includes anything that is visible to the user.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 */
export class MatrixEditorContainer extends MatrixAccessorContainer {
  /**
   * Warnings button tooltip text
   */
  private static readonly WARNINGS_TOOLTIP: string =
    '(!) these characters or states have changed since you last scored a ' +
    'cell in this column. You should recheck your scorings. Note, once you open one cell in this column the ' +
    'Warning (!) sign will disappear.'

  /**
   * Rule checker button tooltip text
   */
  private static readonly RULES_CHECKER_TOOLTIP: string =
    'Checks current state of the matrix against character workflow ' +
    'rules and lists cells that do not conform.'

  /**
   * Partitions tooltip
   */
  private static readonly PARTITIONS_TOOLTIP: string =
    'Partitions are subsets of your matrix that you define. Click here ' +
    'to make those and to view only a partition if you wish.'

  constructor(matrixModel: MatrixModel) {
    super(matrixModel, new MatrixEditorGridHandler())
  }

  protected override decorateInternal(element: HTMLElement) {
    super.decorateInternal(element)

    const partitionsButtonElement =
      this.getElementByClass<HTMLElement>('mb-partitions-btn')
    partitionsButtonElement.title = MatrixEditorContainer.PARTITIONS_TOOLTIP
    const warningsButtonElement =
      this.getElementByClass<HTMLElement>('mb-warnings-btn')
    warningsButtonElement.title = MatrixEditorContainer.WARNINGS_TOOLTIP
    const ruleCheckerButtonElement = this.getElementByClass<HTMLElement>(
      'mb-rule-checker-btn'
    )
    ruleCheckerButtonElement.title = MatrixEditorContainer.RULES_CHECKER_TOOLTIP
  }

  protected override enterDocument() {
    super.enterDocument()

    const taxaButtonElement = this.getElementByClass('mb-taxa-btn')
    const batchButtonElement = this.getElementByClass('mb-batch-btn')
    const partitionsButtonElement = this.getElementByClass('mb-partitions-btn')
    const warningsButtonElement = this.getElementByClass('mb-warnings-btn')
    const ruleCheckerButtonElement = this.getElementByClass(
      'mb-rule-checker-btn'
    )
    this.getHandler()
      .listen(taxaButtonElement, EventType.CLICK, () => this.handleTaxaClick())
      .listen(partitionsButtonElement, EventType.CLICK, (e: Event) =>
        this.handlePartitionsClick(e)
      )
      .listen(batchButtonElement, EventType.CLICK, () =>
        this.handleBatchClick()
      )
      .listen(warningsButtonElement, EventType.CLICK, () =>
        this.handleWarningClick()
      )
      .listen(ruleCheckerButtonElement, EventType.CLICK, () =>
        this.handleRuleCheckerClick()
      )
  }

  /**
   * Handles when the partition button is clicked.
   *
   * @param e The event that triggered this callback.
   * @return whether the handler handled this event.
   */
  protected handlePartitionsClick(e: Event): boolean {
    const partitionsDialog = new PartitionsDialog(this.matrixModel)
    partitionsDialog.setVisible(true)
    return true
  }

  /**
   * Handles when the taxa button is clicked.
   *
   * @return whether the handler handled this event.
   */
  protected handleTaxaClick(): boolean {
    const taxaListDialog = new TaxaListDialog(this.matrixModel)
    taxaListDialog.setVisible(true)
    return true
  }

  protected override handleCharactersClick() {
    const characterListDialog = new CharacterListDialog(this.matrixModel, false)
    characterListDialog.setVisible(true)
    characterListDialog.setSelectedCharacterById(
      this.matrixGrid.getCurrentCharacterId()
    )
    return true
  }

  protected override handleOntologyClick() {
    const ontologyDialog = new OntologyDialog(this.matrixModel)
    ontologyDialog.setVisible(true)
    return true
  }

  /**
   * Handles when the batch button is clicked.
   *
   * @return whether the handler handled this event.
   */
  protected handleBatchClick(): boolean {
    const batchDialog = new BatchDialog(this.matrixModel)
    batchDialog.setVisible(true)
    batchDialog.setSelectedPositions(
      this.matrixGrid.getCurrentCharacterId(),
      this.matrixGrid.getCurrentTaxonId()
    )
    return true
  }

  /**
   * Handles when the warning button is clicked.
   *
   * @return whether the handler handled this event.
   */
  private handleWarningClick(): boolean {
    const warningDialog = new WarningsDialog(this.matrixModel)
    warningDialog.setVisible(true)
    return true
  }

  /**
   * Handles when the RuleChecker button is clicked.
   *
   * @return whether the handler handled this event.
   */
  private handleRuleCheckerClick(): boolean {
    const ruleCheckerDialog = new RuleCheckerDialog(this.matrixModel)
    ruleCheckerDialog.setVisible(true)
    return true
  }

  protected override handlePreferencesClick() {
    const preferencesDialog = new PreferencesDialog(this.matrixModel)
    preferencesDialog.setVisible(true)
    return true
  }

  protected override htmlContent() {
    return `
    <div class="mb-matrixeditor">
      <div class="topButtonBar">
        <div class="btn-group mb-dropdown-bar" role="group"></div>
        <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
          <button type="button" class="btn btn-primary mb-characters-btn">Characters</button>
          <button type="button" class="btn btn-primary mb-taxa-btn">Taxa</button>
          <button type="button" class="btn btn-primary mb-batch-btn">Batch</button>
          <button type="button" class="btn btn-primary mb-partitions-btn">Partitions</button>
          <button type="button" class="btn btn-primary mb-rules-btn">Ontology</button>
          <button type="button" class="btn btn-primary mb-goto-btn">
            <i class="fa-solid fa-circle-right"></i>
          </button>
          <button type="button" class="btn btn-primary mb-search-btn">
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
          <button type="button" class="btn btn-primary mb-warnings-btn icon">
            <i class="fa-solid fa-circle-exclamation"></i>
          </button>
          <button type="button" class="btn btn-primary mb-rule-checker-btn icon">
            <i class="fa-solid fa-square-root-variable"></i>
          </button>
          <button type="button" class="btn btn-primary mb-preferences-btn">
            <i class="fa-solid fa-gear"></i>
          </button>
          <button type="button" class="btn btn-primary mb-reload-btn icon reload">
            <i class="fa-solid fa-arrow-rotate-right"></i>
          </button>
        </div>
      </div>
      <div class="mb-matrix-grid"></div>
    </div>
  `
  }
}

/**
 * Hanldes how certain operations are performed on the matrix grid.
 */
class MatrixEditorGridHandler extends MatrixGridHandler {
  constructor() {
    super()
  }

  override createTaxonDialog(matrixModel: MatrixModel, taxonId: number) {
    return new TaxonDialog(matrixModel, taxonId)
  }

  override createCharacterDialog(
    matrixModel: MatrixModel,
    characterId: number
  ) {
    return new CharacterDialog(matrixModel, characterId)
  }

  override createCellDialog(
    matrixModel: MatrixModel,
    taxonId: number,
    characterId: number
  ) {
    return new CellDialog(matrixModel, taxonId, characterId)
  }
}
