import type { MatrixObject } from './MatrixObject'

/**
 * This interface specifies the objects that can parse Matrix files into a
 * Matrix Object.
 */
export interface Parser {
  /**
   * This method parses the flie into a Matrix Object.
   * @throws an exception if the input file is invalid.
   */
  parse(): MatrixObject
}
