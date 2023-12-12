import fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import { MatrixObject } from '@/lib/matrix-parser/MatrixObject'
import { StringReader } from '@/lib/matrix-parser/StringReader'
import { TNTParser } from '@/lib/matrix-parser/TNTParser'

describe('TNTParserTest', () => {
  test('Test Duplicate Characters', async () => {
    const matrix = parseMatrix('duplicate_characters.tnt')

    expect(matrix.getFormat()).toBe('TNT')
    expect(matrix.getTaxonCount()).toBe(3)
    expect(matrix.getCharacterCount()).toBe(3)

    const characters = matrix.getCharacters()
    expect(characters[0].name).toBe('bipedal')
    expect(characters[1].name).toBe('bipedal - 1')
    expect(characters[2].name).toBe('bipedal - 2')
    expect(characters[0].states.length).toBe(2)
    expect(characters[1].states.length).toBe(3)
    expect(characters[2].states.length).toBe(4)
  })
})

function parseMatrix(file: string): MatrixObject {
  const path = `tests/lib/matrix-parser/files/${file}`
  const content = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' })
  const reader = new StringReader(content)
  const parser = new TNTParser(reader)
  return parser.parse()
}
