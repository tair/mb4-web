import type { Dialog } from './Dialog'
import type { MatrixModel } from '../MatrixModel'

/**
 * Hanldes how certain operations are performed on the matrix grid.
 */
export abstract class MatrixGridHandler {
  /**
   * Creates a taxon dialog from the given data
   * @param matrixModel The matrix model
   * @param taxonId The id of the taxon
   * @abstract
   */
  abstract createTaxonDialog(matrixModel: MatrixModel, taxonId: number): Dialog

  /**
   * Creates a taxon dialog from the given data
   * @param matrixModel The matrix model
   * @param characterId The id of the character
   * @abstract
   */
  abstract createCharacterDialog(
    matrixModel: MatrixModel,
    characterId: number
  ): Dialog

  /**
   * Creates a taxon dialog from the given data
   * @param matrixModel The matrix model
   * @param taxonId The id of the taxon
   * @param characterId The id of the character
   * @abstract
   */
  abstract createCellDialog(
    matrixModel: MatrixModel,
    taxonId: number,
    characterId: number
  ): Dialog
}
