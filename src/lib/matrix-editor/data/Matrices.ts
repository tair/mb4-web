/**
 * Matrices class
 * @param matrix the json representation of the matrix.
 * @struct
 */
export class Matrix {
  private readonly matrix: { [key: string]: any }

  constructor(matrix: Object) {
    this.matrix = matrix
  }

  /**
   * The list of matrix objects.
   * @param matrices The array of json
   */
  static createMatrices(matrices: Object[]): Matrix[] {
    const matrix: Matrix[] = []
    for (let x = 0; x < matrices.length; x++) {
      matrix.push(new Matrix(matrices[x]))
    }
    return matrix
  }

  /**
   * Gets the matrix id
   */
  getId(): number {
    return this.matrix['id']
  }

  /**
   * Gets the title
   */
  getTitle(): string {
    return this.matrix['t']
  }

  /**
   * Gets the type
   */
  getType(): number {
    return this.matrix['ty']
  }
}
