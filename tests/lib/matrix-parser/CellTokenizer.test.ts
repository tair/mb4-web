import { StringReader } from '@/lib/matrix-parser/StringReader'
import { CellTokenizer } from '@/lib/matrix-parser/CellTokenizer'
import { Token } from '@/lib/matrix-parser/Token'
import { describe, expect, test } from '@jest/globals'

describe('CellTokenizerTest', () => {
  test('Test single scores', () => {
    const tokenizer = getTokenizerForContent('123')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.CELL)
    expect(token1.getValue()).toBe('1')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.CELL)
    expect(token2.getValue()).toBe('2')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.CELL)
    expect(token3.getValue()).toBe('3')
  })

  test('Test polymorphoic cells', () => {
    const tokenizer = getTokenizerForContent('1(23)4')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.CELL)
    expect(token1.getValue()).toBe('1')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.CELL_POLYMORPHIC)
    expect(token2.getValue()).toBe('23')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.CELL)
    expect(token3.getValue()).toBe('4')
  })

  test('Test polymorphoic cells with commas', () => {
    const tokenizer = getTokenizerForContent('1(2,3)4')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.CELL)
    expect(token1.getValue()).toBe('1')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.CELL_POLYMORPHIC)
    expect(token2.getValue()).toBe('23')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.CELL)
    expect(token3.getValue()).toBe('4')
  })

  test('Test polymorphoic cells with spaces', () => {
    const tokenizer = getTokenizerForContent('1(2 3)4')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.CELL)
    expect(token1.getValue()).toBe('1')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.CELL_POLYMORPHIC)
    expect(token2.getValue()).toBe('23')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.CELL)
    expect(token3.getValue()).toBe('4')
  })

  test('Test polymorphoic cells with comma and spaces', () => {
    const tokenizer = getTokenizerForContent('1(2 3)4')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.CELL)
    expect(token1.getValue()).toBe('1')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.CELL_POLYMORPHIC)
    expect(token2.getValue()).toBe('23')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.CELL)
    expect(token3.getValue()).toBe('4')
  })

  test('Test uncertain cells', () => {
    const tokenizer = getTokenizerForContent('1[23]4')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.CELL)
    expect(token1.getValue()).toBe('1')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.CELL_UNCERTAIN)
    expect(token2.getValue()).toBe('23')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.CELL)
    expect(token3.getValue()).toBe('4')
  })

  test('Test uncertain cells with commas', () => {
    const tokenizer = getTokenizerForContent('1[2,3]4')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.CELL)
    expect(token1.getValue()).toBe('1')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.CELL_UNCERTAIN)
    expect(token2.getValue()).toBe('23')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.CELL)
    expect(token3.getValue()).toBe('4')
  })

  test('Test uncertain cells with spaces', () => {
    const tokenizer = getTokenizerForContent('1[2 3]4')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.CELL)
    expect(token1.getValue()).toBe('1')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.CELL_UNCERTAIN)
    expect(token2.getValue()).toBe('23')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.CELL)
    expect(token3.getValue()).toBe('4')
  })

  test('Test uncertain cells with comma and spaces', () => {
    const tokenizer = getTokenizerForContent('1[2 3]4')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.CELL)
    expect(token1.getValue()).toBe('1')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.CELL_UNCERTAIN)
    expect(token2.getValue()).toBe('23')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.CELL)
    expect(token3.getValue()).toBe('4')
  })
})

function getTokenizerForContent(content: string): CellTokenizer {
  const reader = new StringReader(content)
  return new CellTokenizer(reader)
}
