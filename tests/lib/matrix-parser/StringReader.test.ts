import { FilePosition } from '@/lib/matrix-parser/FilePosition'
import { StringReader } from '@/lib/matrix-parser/StringReader'
import { describe, expect, test } from '@jest/globals'

describe('StringReaderTest', () => {
  test('getCharacter', () => {
    const reader = getReaderForContent('TEST')

    expect(reader.getCharacter()).toBe('T')
    expect(reader.getCharacter()).toBe('E')
    expect(reader.peekCharacter()).toBe('S')
    expect(reader.getCharacter()).toBe('S')
    expect(reader.getCharacter()).toBe('T')

    expect(reader.isAtEnd()).toBe(true)
  })

  test('New Line and Line Break Test', () => {
    const reader = getReaderForContent('TE\nS\r\nT')

    expect(reader.getPosition()).toStrictEqual(new FilePosition(0, 1, 1))
    expect(reader.getCharacter()).toBe('T')
    expect(reader.getPosition()).toStrictEqual(new FilePosition(1, 1, 2))
    expect(reader.getCharacter()).toBe('E')
    expect(reader.getPosition()).toStrictEqual(new FilePosition(2, 1, 3))
    expect(reader.getCharacter()).toBe('\n')
    expect(reader.getPosition()).toStrictEqual(new FilePosition(3, 2, 1))
    expect(reader.getCharacter()).toBe('S')
    expect(reader.getCharacter()).toBe('\n')
    expect(reader.getPosition()).toStrictEqual(new FilePosition(6, 3, 1))
    expect(reader.getCharacter()).toBe('T')
    expect(reader.getPosition()).toStrictEqual(new FilePosition(7, 3, 2))
    expect(reader.isAtEnd()).toBe(true)

    reader.resetPosition()
    expect(reader.getPosition()).toStrictEqual(new FilePosition(0, 1, 1))
    expect(reader.isAtEnd()).toBe(false)
  })
})

function getReaderForContent(content: string): StringReader {
  return new StringReader(content)
}
