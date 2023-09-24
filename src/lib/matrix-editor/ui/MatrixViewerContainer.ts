import { MatrixModel } from '../MatrixModel'
import { MatrixAccessorContainer } from './MatrixAccessorContainer'
import { MatrixGrid } from './MatrixGrid'
import { MatrixGridHandler } from './MatrixGridHandler'
import { CharacterListDialog } from './dialogs/CharacterListDialog'
import { ReadonlyCellDialog } from './dialogs/ReadonlyCellDialog'
import { ReadonlyCharacterDialog } from './dialogs/ReadonlyCharacterDialog'
import { ReadOnlyPreferencesDialog } from './dialogs/ReadonlyPreferencesDialog'
import { ReadonlyTaxonDialog } from './dialogs/ReadonlyTaxonDialog'
import { OntologyDialog } from './dialogs/OntologyDialog'

/**
 * The UI of the matrix editor, which includes anything that is visible to the user.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 */
export class MatrixViewerContainer extends MatrixAccessorContainer {
  constructor(matrixModel: MatrixModel) {
    super(matrixModel, new MatrixViewerGridHandler())
  }

  override decorateInternal(element: HTMLElement) {
    super.decorateInternal.call(element)
  }

  override handleCharactersClick() {
    const characterListDialog = new CharacterListDialog(this.matrixModel, true)
    characterListDialog.setVisible(true)
    characterListDialog.setSelectedCharacterById(
      this.matrixGrid.getCurrentCharacterId()
    )
    return true
  }

  override handlePreferencesClick() {
    const preferencesDialog = new ReadOnlyPreferencesDialog(this.matrixModel)
    preferencesDialog.setVisible(true)
    return true
  }

  override handleOntologyClick() {
    const ontologyDialog = new OntologyDialog(this.matrixModel, true)

    /* readonly */
    ontologyDialog.setVisible(true)
    return true
  }

  override htmlContent() {
    return `
    <div class="mb-matrixeditor">
      <div class="topButtonBar">
        <div class="btn-group mb-dropdown-bar" role="group"></div>
        <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
          <button type="button" class="btn btn-primary mb-characters-btn">Characters</button>
          <button type="button" class="btn btn-primary mb-rules-btn">Ontology</button>
          <button type="button" class="btn btn-primary mb-search-btn">Search</button>
          <button type="button" class="btn btn-primary mb-goto-btn">Go To</button>
          <button type="button" class="btn btn-primary mb-preferences-btn">Preferences</button>
          <button type="button" class="btn btn-primary mb-reload-btn">&#10227;</button>
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
class MatrixViewerGridHandler extends MatrixGridHandler {
  constructor() {
    super()
  }

  override createCellDialog(
    matrixModel: MatrixModel,
    taxonId: number,
    characterId: number
  ) {
    return new ReadonlyCellDialog(matrixModel, taxonId, characterId)
  }

  override createCharacterDialog(
    matrixModel: MatrixModel,
    characterId: number
  ) {
    return new ReadonlyCharacterDialog(matrixModel, characterId)
  }

  override createTaxonDialog(matrixModel: MatrixModel, taxonId: number) {
    return new ReadonlyTaxonDialog(matrixModel, taxonId)
  }
}
