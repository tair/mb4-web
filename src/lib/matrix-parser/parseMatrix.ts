import { ParserFactory } from './ParserFactory'
import type { MatrixObject } from './MatrixObject'
import { MatrixValidationError } from './MatrixObject'
import { validate } from './MatrixValidator'

export interface ParseMatrixResult {
  matrixObject: MatrixObject | null
  error: MatrixValidationError | null
}

/**
 * Parse a matrix file and validate it.
 * @param file The file content as a string
 * @returns An object containing the matrixObject (if successful) and any validation error
 */
export function parseMatrix(file: string): MatrixObject | null {
  const parserFactory = new ParserFactory()
  const parser = parserFactory.getParserForFile(file)
  if (parser == null) {
    return null
  }

  const matrixObject = parser.parse()
  
  // Validate the matrix - this will throw MatrixValidationError if validation fails
  validate(matrixObject)

  return matrixObject
}

/**
 * Parse a matrix file with detailed error handling.
 * @param file The file content as a string
 * @returns An object containing the matrixObject (if successful) and any validation error
 */
export function parseMatrixWithErrors(file: string): ParseMatrixResult {
  try {
    const matrixObject = parseMatrix(file)
    return { matrixObject, error: null }
  } catch (error) {
    if (error instanceof MatrixValidationError) {
      return { matrixObject: null, error }
    }
    
    // Handle parsing errors with user-friendly messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing matrix'
    let userMessage = errorMessage
    
    // Detect common parsing errors and provide helpful messages
    if (errorMessage.includes("Expected ';'") || errorMessage.includes('but got')) {
      userMessage = 'Your matrix file appears to be incomplete or improperly formatted. Please ensure all blocks are properly closed with "END;" statements and all commands end with semicolons. If you copied this file from a document, please check that all content was copied completely.'
    } else if (errorMessage.includes('Invalid Token')) {
      userMessage = 'Your matrix file contains unexpected content or formatting. Please ensure it follows the NEXUS or TNT format specifications.'
    } else if (errorMessage.includes('Possible infinite loop')) {
      userMessage = 'Your matrix file has formatting issues that prevent proper parsing. Please check that all character definitions, taxa names, and matrix data are properly formatted.'
    }
    
    // For other errors, wrap them in a generic validation error
    return {
      matrixObject: null,
      error: new MatrixValidationError(
        null as any,
        userMessage
      ),
    }
  }
}
