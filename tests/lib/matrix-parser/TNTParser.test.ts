import fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import { CharacterType, MatrixObject } from '@/lib/matrix-parser/MatrixObject'
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

  test('Test Simple Mixed Characters', async () => {
    const matrix = parseMatrix('simple_mixed.tnt')

    expect(matrix.getFormat()).toBe('TNT')
    expect(matrix.getTaxonCount()).toBe(2)
    expect(matrix.getCharacterCount()).toBe(5)

    // Check character types
    expect(matrix.getCharacterType(0)).toBe(CharacterType.CONTINUOUS)
    expect(matrix.getCharacterType(1)).toBe(CharacterType.CONTINUOUS)
    expect(matrix.getCharacterType(2)).toBe(CharacterType.DISCRETE)
    expect(matrix.getCharacterType(3)).toBe(CharacterType.DISCRETE)
    expect(matrix.getCharacterType(4)).toBe(CharacterType.DISCRETE)

    // Check taxa names
    const taxaNames = matrix.getTaxaNames()
    expect(taxaNames).toContain('Taxon_A')
    expect(taxaNames).toContain('Taxon_B')

    // Check some cell values
    const taxonACells = matrix.getCells('Taxon_A')
    expect(taxonACells[0].score).toBe('0.348') // continuous
    expect(taxonACells[1].score).toBe('0.375') // continuous
    expect(taxonACells[2].score).toBe('0') // discrete
    expect(taxonACells[3].score).toBe('0') // discrete
    expect(taxonACells[4].score).toBe('1') // discrete
  })

  test('Test Mixed Continuous and Discrete Characters', async () => {
    const matrix = parseMatrix('mixed_continuous_discrete.tnt')

    expect(matrix.getFormat()).toBe('TNT')
    expect(matrix.getTaxonCount()).toBe(3)
    expect(matrix.getCharacterCount()).toBe(10)

    // Check character types
    const characters = matrix.getCharacters()
    
    // First 3 characters should be continuous
    expect(matrix.getCharacterType(0)).toBe(CharacterType.CONTINUOUS)
    expect(matrix.getCharacterType(1)).toBe(CharacterType.CONTINUOUS)
    expect(matrix.getCharacterType(2)).toBe(CharacterType.CONTINUOUS)
    
    // Remaining 7 characters should be discrete
    for (let i = 3; i < 10; i++) {
      expect(matrix.getCharacterType(i)).toBe(CharacterType.DISCRETE)
    }

    // Check character names
    expect(characters[0].name).toBe('Continuous char 1')
    expect(characters[1].name).toBe('Continuous char 2')
    expect(characters[2].name).toBe('Continuous char 3')
    expect(characters[3].name).toBe('Discrete char 1')
    expect(characters[9].name).toBe('Discrete char 7')

    // Check taxa names
    const taxaNames = matrix.getTaxaNames()
    expect(taxaNames).toContain('Taxon_A')
    expect(taxaNames).toContain('Taxon_B')
    expect(taxaNames).toContain('Taxon_C')

    // Check some cell values
    const taxonACells = matrix.getCells('Taxon_A')
    expect(taxonACells[0].score).toBe('0.348') // continuous
    expect(taxonACells[1].score).toBe('0.375') // continuous
    expect(taxonACells[2].score).toBe('0.354') // continuous
    expect(taxonACells[3].score).toBe('0') // discrete
    expect(taxonACells[4].score).toBe('0') // discrete
    expect(taxonACells[5].score).toBe('1') // discrete

    const taxonBCells = matrix.getCells('Taxon_B')
    expect(taxonBCells[0].score).toBe('0.49') // continuous
    expect(taxonBCells[1].score).toBe('?') // missing continuous
    expect(taxonBCells[2].score).toBe('0.08') // continuous
    expect(taxonBCells[3].score).toBe('1') // discrete
    expect(taxonBCells[4].score).toBe('1') // discrete
    expect(taxonBCells[5].score).toBe('0') // discrete
  })
})

function parseMatrix(file: string): MatrixObject {
  const path = `tests/lib/matrix-parser/files/${file}`
  const content = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' })
  const reader = new StringReader(content)
  const parser = new TNTParser(reader)
  return parser.parse()
}
