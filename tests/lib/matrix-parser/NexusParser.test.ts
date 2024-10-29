import {
  MatrixObject,
  CharacterOrdering,
  CharacterStateIncompleteType,
} from '@/lib/matrix-parser/MatrixObject'
import { validate } from '@/lib/matrix-parser/MatrixValidator'
import { NexusParser } from '@/lib/matrix-parser/NexusParser'
import { StringReader } from '@/lib/matrix-parser/StringReader'
import { describe, expect, test } from '@jest/globals'
import fs from 'fs'

describe('NexusParserTest', () => {
  // Test that character numbers are associated correctly in the CHARSTATELABELS
  // block.
  test('Test CHARSTATELABELS with quotes', () => {
    const matrix = parseMatrix('characters_states.nex')

    expect(matrix.getFormat()).toBe('NEXUS')

    const characters = matrix.getCharacters()
    expect(characters.length).toBe(3)
    for (let x = 0; x < characters.length; x++) {
      expect(characters[x].characterNumber).toBe(x)
    }
  })

  // Test that the quotes are handled correctly with the CHARSTATELABELS block
  test('Test CHARSTATELABELS with quotes', () => {
    const matrix = parseMatrix('characters_states.nex')

    expect(matrix.getFormat()).toBe('NEXUS')
    expect(matrix.getTaxonCount()).toBe(1)
    expect(matrix.getCharacterCount()).toBe(3)

    const characters = matrix.getCharacters()
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

  // Test the ASSUMPTION blocks will be positioned correctly with the proper
  // indicies.
  test('Test ASSUMPTIONS ordering', () => {
    const matrix = parseMatrix('assumptions.nex')

    expect(matrix.getFormat()).toBe('NEXUS')
    expect(matrix.getTaxonCount()).toBe(1)
    expect(matrix.getCharacterCount()).toBe(20)

    const characters = matrix.getCharacters()
    expect(characters.length).toBe(20)
    const expectedUnorderedIndex = [
      0, // 1-5
      1,
      2,
      3,
      4,
      8, // 9-12\3
      11,
      13, // 14
      17, // 18-.
      18,
      19,
    ]
    for (const index of expectedUnorderedIndex) {
      expect(characters[index].ordering).toBe(CharacterOrdering.UNORDERING)
    }
    const expectedOrderedIndex = [5, 7, 16]
    for (const index of expectedOrderedIndex) {
      expect(characters[index].ordering).toBe(CharacterOrdering.ORDERING)
    }
    const expectedUndefinedIndex = [6, 9, 10, 12, 14, 15]
    for (const index of expectedUndefinedIndex) {
      expect(characters[index].ordering).toBeUndefined()
    }
  })

  // This ensures that the ASSUMPTION blocks will be positioned correctly with
  // the proper indecies.
  test('Test incompete states', () => {
    const matrix = parseMatrix('incomplete_states.nex')
    validate(matrix)
    expect(matrix.getFormat()).toBe('NEXUS')
    expect(matrix.getCharacterCount()).toBe(4)

    const characters = matrix.getCharacters()
    expect(characters[0].states[0].incompleteType).toBe(
      CharacterStateIncompleteType.DUPLICATE_SATE
    )
    expect(characters[0].states[1].incompleteType).toBe(
      CharacterStateIncompleteType.DUPLICATE_SATE
    )
    expect(characters[1].states[1].incompleteType).toBe(
      CharacterStateIncompleteType.CREATED_STATE
    )
    expect(characters[2].states[1].incompleteType).toBe(
      CharacterStateIncompleteType.EMPTY_NAME
    )
    expect(characters[3].states[0].incompleteType).toBe(
      CharacterStateIncompleteType.INCORRECT_NUMBER_OF_SCORES
    )
  })

  // Test that the erroneous character states are labeled correctly.
  test('Test incompete states', () => {
    const matrix = parseMatrix('incomplete_states.nex')
    validate(matrix)
    expect(matrix.getFormat()).toBe('NEXUS')
    expect(matrix.getCharacterCount()).toBe(4)

    const characters = matrix.getCharacters()
    expect(characters[0].states[0].incompleteType).toBe(
      CharacterStateIncompleteType.DUPLICATE_SATE
    )
    expect(characters[0].states[1].incompleteType).toBe(
      CharacterStateIncompleteType.DUPLICATE_SATE
    )
    expect(characters[1].states[1].incompleteType).toBe(
      CharacterStateIncompleteType.CREATED_STATE
    )
    expect(characters[2].states[1].incompleteType).toBe(
      CharacterStateIncompleteType.EMPTY_NAME
    )
    expect(characters[3].states[0].incompleteType).toBe(
      CharacterStateIncompleteType.INCORRECT_NUMBER_OF_SCORES
    )
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
