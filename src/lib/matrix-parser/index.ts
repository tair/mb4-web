import { ParserFactory } from './ParserFactory'
import type { MatrixObject } from './MatrixObject'

function parseMatrixFile(file: string): MatrixObject | null {
  const parserFactory = new ParserFactory()
  const parser = parserFactory.getParserForFile(file)
  if (parser == null) {
    return null
  }
  const matrixObject = parser.parse()
  return matrixObject
}

export { parseMatrixFile }
