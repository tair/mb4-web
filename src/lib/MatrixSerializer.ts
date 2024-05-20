import { Cell, MatrixObject } from './matrix-parser/MatrixObject'

export function serializeMatrix(matrixObject: MatrixObject): string {
  return JSON.stringify(matrixObject, replacer)
}

function replacer(key: string, value: any): any {
  if (value instanceof Map) {
    return Array.from(value.values())
  }
  if (value instanceof Cell) {
    return value.toJson()
  }
  return value
}
