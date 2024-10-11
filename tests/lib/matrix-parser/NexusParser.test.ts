import {
  MatrixObject,
  CharacterOrdering,
} from '@/lib/matrix-parser/MatrixObject'
import { NexusParser } from '@/lib/matrix-parser/NexusParser'
import { StringReader } from '@/lib/matrix-parser/StringReader'
import { describe, expect, test } from '@jest/globals'
import fs from 'fs'

describe('NexusParserTest', () => {
  test('Test CHARSTATELABELS with quotes', () => {
    const matrix = parseMatrix('characters_states.nex')

    expect(matrix.getFormat()).toBe('NEXUS')
    expect(matrix.getTaxonCount()).toBe(1)
    expect(matrix.getCharacterCount()).toBe(3)

    const characters = matrix.getCharacters()
    expect(characters.length).toBe(3)
    // Test single quoted string with consecutive single quotes:
    expect(characters[0].states[0].name).toBe(
      "elongated ridges ('zones of intensive growth')"
    )
    // Test string with underscores:
    expect(characters[0].states[1].name).toBe(
      'prepineal growth zone established on anterior parietal and postorbital'
    )
    // Test fixes to a bug in Mesquite which has a consecutive single quote to
    // mark the end of a double quote.
    expect(characters[1].states[0].name).toBe(
      "deeply incised and 'U-shaped' in outline"
    )
    // Tests fixes to q bug in Mesquite which Ticks are used in place of single
    // quotes at beginning of a string.
    expect(characters[1].states[1].name).toBe(
      'shallowly \'incised\' with "broad" coverage of os basale'
    )
    // Test double quoted string with single quotes:
    expect(characters[1].states[2].name).toBe(
      "deeply incised and 'U-shaped', but with midline extension"
    )
    // Test single quoted string with consecutive single quotes at end:
    expect(characters[2].states[1].name).toBe(
      "broad, oval with 'microsaur-type' 'ornament'"
    )
  })

  // This ensures that the ASSUMPTION blocks will be positioned correctly with
  // the proper indecies.
  test('Test ASSUMPTIONS ordering', () => {
    const matrix = parseMatrix('assumptions.nex')

    expect(matrix.getFormat()).toBe('NEXUS')
    expect(matrix.getTaxonCount()).toBe(1)
    expect(matrix.getCharacterCount()).toBe(20)

    const characters = matrix.getCharacters()
    expect(characters.length).toBe(20)
    const expectedUnorderedIndex = [
      0,
      1,
      2,
      3,
      4, // 1-5
      8,
      11, // 9-12\3
      13, // 14
      17, // 18
    ]
    for (const index of expectedUnorderedIndex) {
      expect(characters[index].ordering).toBe(CharacterOrdering.UNORDERING)
    }
    const expectedOrderedIndex = [5, 7, 16]
    for (const index of expectedOrderedIndex) {
      expect(characters[index].ordering).toBe(CharacterOrdering.ORDERING)
    }
    const expectedUndefinedIndex = [6, 9, 10, 12, 14, 15, 18, 19]
    for (const index of expectedUndefinedIndex) {
      expect(characters[index].ordering).toBeUndefined()
    }
  })
})

function getParserForFile(file: string): NexusParser {
  const content = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' })
  const reader = new StringReader(content)
  return new NexusParser(reader)
}

function parseMatrix(fileName: string): MatrixObject {
  const path = `tests/lib/matrix-parser/files/${fileName}`
  const parser = getParserForFile(path)
  return parser.parse()
}
