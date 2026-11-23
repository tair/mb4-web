import { MatrixObject } from '@/lib/matrix-parser/MatrixObject'
import { NexusParser } from '@/lib/matrix-parser/NexusParser'
import { StringReader } from '@/lib/matrix-parser/StringReader'
import { describe, expect, test } from '@jest/globals'
import fs from 'fs'

// MB4-466. A matrix that declares characters but never names them is the input
// the AI character extractor exists for, and the declared count is the only
// thing the extracted names can be checked against.
describe('UnlabelledCharactersTest', () => {
  // Without this the extractor is not offered, or has no count to check.
  test('Test declared NCHAR survives absent character labels', () => {
    const matrix = parseMatrix('unlabelled_characters.nex')

    expect(matrix.getCharacterCount()).toBe(0)
    expect(matrix.getTaxonCount()).toBe(12)
    expect(matrix.getDimensions()['CHARS']).toBe(24)
  })

  // CreateView holds the matrix as a reactive Object.assign copy, so the count
  // must be reachable as a plain own property rather than through a getter.
  test('Test dimensions and cells survive an Object.assign copy', () => {
    const matrix = parseMatrix('unlabelled_characters.nex')

    const importedMatrix: Record<string, any> = {}
    Object.assign(importedMatrix, matrix)

    const dimensions = importedMatrix.dimensions || {}
    expect(dimensions['NCHAR'] ?? dimensions['CHARS']).toBe(24)

    expect(importedMatrix.cells.size).toBe(12)
    for (const cellRow of importedMatrix.cells.values()) {
      expect(cellRow.length).toBe(24)
    }
  })
})

function parseMatrix(fileName: string): MatrixObject {
  const path = `tests/lib/matrix-parser/files/${fileName}`
  const content = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' })
  return new NexusParser(new StringReader(content)).parse()
}
