import { FilePosition } from '@/lib/matrix-parser/FilePosition'
import { type Reader } from '@/lib/matrix-parser/Reader'
import { StringReader } from '@/lib/matrix-parser/StringReader'
import { SubstringReader } from '@/lib/matrix-parser/SubstringReader'
import { describe, expect, test } from '@jest/globals'

describe('SubstringReaderTest', () => {
  test('getCharacter', () => {
    const reader = getReaderForContent('TEST\nMoreContent', ['\n'])

    expect(reader.getCharacter()).toBe('T')
    expect(reader.getCharacter()).toBe('E')
    expect(reader.peekCharacter()).toBe('S')
    expect(reader.getCharacter()).toBe('S')
    expect(reader.getCharacter()).toBe('T')
    expect(reader.getCharacter()).toBe('\n')

    expect(reader.isAtEnd()).toBe(true)
  })

  test('New Line and Line Break Test', () => {
    const reader = getReaderForContent('TE\nS\r\nT;', [';'])

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
    expect(reader.getCharacter()).toBe(';')
    expect(reader.isAtEnd()).toBe(true)

    reader.resetPosition()
    expect(reader.getPosition()).toStrictEqual(new FilePosition(0, 1, 1))
    expect(reader.isAtEnd()).toBe(false)
  })

  test('setPosition Test', () => {
    const content = 'T=123;TEST'

    const baseReader = new StringReader(content)
    expect(baseReader.getCharacter()).toBe('T')
    expect(baseReader.getCharacter()).toBe('=')
    const reader = new SubstringReader(baseReader, [';'])

    expect(reader.getCharacter()).toBe('1')
    expect(reader.getCharacter()).toBe('2')
    expect(reader.getCharacter()).toBe('3')
    expect(reader.getCharacter()).toBe(';')
    expect(reader.isAtEnd()).toBe(true)

    reader.resetPosition()
    expect(reader.isAtEnd()).toBe(false)
    expect(reader.getCharacter()).toBe('1')
    expect(reader.getCharacter()).toBe('2')
    expect(reader.getCharacter()).toBe('3')
    expect(reader.getCharacter()).toBe(';')
    expect(reader.isAtEnd()).toBe(true)

    expect(() => reader.setPosition(new FilePosition(0, 1, 1))).toThrow(
      'Cannot set position before the start position'
    )

    expect(() => reader.setPosition(new FilePosition(25, 1, 25))).toThrow(
      'Cannot set position after the end position'
    )
  })

  test('getContent Test', () => {
    const content = 'T=123;TEST'

    const baseReader = new StringReader(content)
    expect(baseReader.getCharacter()).toBe('T')
    expect(baseReader.getCharacter()).toBe('=')
    const reader = new SubstringReader(baseReader, [',', ';'])

    expect(reader.getContent()).toBe('123;')
  })
})

function getReaderForContent(
  content: string,
  terminatingCharacters: string[]
): Reader {
  const baseReader = new StringReader(content)
  return new SubstringReader(baseReader, terminatingCharacters)
}
