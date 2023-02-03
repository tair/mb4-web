import { ParserFactory } from './ParserFactory'
import type { MatrixObject } from './MatrixObject'
import { MatrixValidator } from './MatrixValidator'

function parseMatrixFile(file: string): MatrixObject | null {
  const parserFactory = new ParserFactory()
  const parser = parserFactory.getParserForFile(file)
  if (parser == null) {
    return null
  }

  const matrixObject = parser.parse()
  const validator = new MatrixValidator()
  validator.validate(matrixObject)

  return matrixObject
}

export { parseMatrixFile }
