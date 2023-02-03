import { StringReader } from 'lib/matrix-parser/StringReader'
import { TNTTokenizer } from 'lib/matrix-parser/TNTTokenizer'
import { Token } from 'lib/matrix-parser/Token'
import { describe, expect, test } from '@jest/globals'

describe('TNTTokenizerTest', () => {
  test('Match TNT Tokens', () => {
    const tokenizer = getTokenizerForContent('XREAD NSTATES MXRAM')

    expect(tokenizer.getTokenValue().getToken()).toBe(Token.XREAD)
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.NSTATES)
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.MXRAM)
  })

  test('Match Number Tokens', () => {
    const tokenizer = getTokenizerForContent('123 45689 1.00')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.NUMBER)
    expect(token1.getValue()).toBe('123')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.NUMBER)
    expect(token2.getValue()).toBe('45689')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.NUMBER)
    expect(token3.getValue()).toBe('1.00')
  })

  test('Normal strings', () => {
    const tokenizer = getTokenizerForContent('cat dog rat')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.STRING)
    expect(token1.getValue()).toBe('cat')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.STRING)
    expect(token2.getValue()).toBe('dog')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.STRING)
    expect(token3.getValue()).toBe('rat')
  })

  test('Single-quoted strings', () => {
    const tokenizer = getTokenizerForContent("cat 'dog' rat")

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.STRING)
    expect(token1.getValue()).toBe('cat')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.STRING)
    expect(token2.getValue()).toBe('dog')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.STRING)
    expect(token3.getValue()).toBe('rat')
  })

  test('Double-quoted strings', () => {
    const tokenizer = getTokenizerForContent('cat "dog" rat')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.STRING)
    expect(token1.getValue()).toBe('cat')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.STRING)
    expect(token2.getValue()).toBe('dog')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.STRING)
    expect(token3.getValue()).toBe('rat')
  })

  test('All quoted strings', () => {
    const tokenizer = getTokenizerForContent("'cat' \"dog\" 'rat'")

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.STRING)
    expect(token1.getValue()).toBe('cat')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.STRING)
    expect(token2.getValue()).toBe('dog')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.STRING)
    expect(token3.getValue()).toBe('rat')
  })

  test('Middle quoted strings', () => {
    const tokenizer = getTokenizerForContent("cat_'dog'_rat")

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.STRING)
    expect(token1.getValue()).toBe('cat dog rat')
  })

  test('Numbers', () => {
    const tokenizer = getTokenizerForContent('1 23 345 6')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.NUMBER)
    expect(token1.getValue()).toBe('1')
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.NUMBER)
    expect(token2.getValue()).toBe('23')
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.NUMBER)
    expect(token3.getValue()).toBe('345')
    const token4 = tokenizer.getTokenValue()
    expect(token4.getToken()).toBe(Token.NUMBER)
    expect(token4.getValue()).toBe('6')
  })

  test('Symbols', () => {
    const tokenizer = getTokenizerForContent('/ + * -')

    expect(tokenizer.getTokenValue().getToken()).toBe(Token.BLACKSLASH)
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.PLUS)
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.ASTERISK)
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.MINUS)
  })

  test('CName format', () => {
    const tokenizer = getTokenizerForContent('{ 117 John_Smith;')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.OPEN_SBRACKET)
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.NUMBER)
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.STRING)
    expect(token3.getValue()).toBe('John Smith')
    const token4 = tokenizer.getTokenValue()
    expect(token4.getToken()).toBe(Token.SEMICOLON)
  })

  test('Comments format', () => {
    const tokenizer = getTokenizerForContent('{0 12 John_Smith;')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.OPEN_SBRACKET)
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.NUMBER)
    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.NUMBER)
    const token4 = tokenizer.getTokenValue()
    expect(token4.getToken()).toBe(Token.STRING)
    expect(token4.getValue()).toBe('John Smith')
    const token5 = tokenizer.getTokenValue()
    expect(token5.getToken()).toBe(Token.SEMICOLON)
  })
})

function getTokenizerForContent(content: string): TNTTokenizer {
  const reader = new StringReader(content, 0, content.length)
  return new TNTTokenizer(reader)
}
