import { StringReader } from '@/lib/matrix-parser/StringReader'
import { CharacterOrderingTokenizer } from '@/lib/matrix-parser/CharacterOrderingTokenizer'
import { Token } from '@/lib/matrix-parser/Token'
import { describe, expect, test } from '@jest/globals'

describe('CharacterOrderingTokenizerTest', () => {
  test('test codes', () => {
    const tokenizer = getTokenizerForContent('1-24,')

    expect(tokenizer.getTokenValue().getValue()).toBe('1')
    expect(tokenizer.getTokenValue().getValue()).toBe(Token.MINUS)
    expect(tokenizer.getTokenValue().getValue()).toBe('24')
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.COMMA)
  })

  test('test codes separated by spaces', () => {
    const tokenizer = getTokenizerForContent(' 1 - 24 ;')

    expect(tokenizer.getTokenValue().getValue()).toBe('1')
    expect(tokenizer.getTokenValue().getValue()).toBe(Token.MINUS)
    expect(tokenizer.getTokenValue().getValue()).toBe('24')
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.SEMICOLON)
  })

  test('test period for all', () => {
    const tokenizer = getTokenizerForContent(' 1-.;')

    expect(tokenizer.getTokenValue().getValue()).toBe('1')
    expect(tokenizer.getTokenValue().getValue()).toBe(Token.MINUS)
    expect(tokenizer.getTokenValue().getValue()).toBe(Token.DOT)
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.SEMICOLON)
  })

  test('test key word ALL', () => {
    const tokenizer = getTokenizerForContent('ALL;')

    expect(tokenizer.getTokenValue().getValue()).toBe(Token.ALL)
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.SEMICOLON)
  })

  test('test strides', () => {
    const tokenizer = getTokenizerForContent('1-8\\4 12-24\\3 25 26-40\\2;')

    const expectedTokens = [
      '1',
      '-',
      '8',
      '\\',
      '4',
      '12',
      '-',
      '24',
      '\\',
      '3',
      '25',
      '26',
      '-',
      '40',
      '\\',
      '2',
      ';',
    ]
    for (const expectedToken of expectedTokens) {
      expect(tokenizer.getTokenValue().getValue()).toBe(expectedToken)
    }
  })
})

function getTokenizerForContent(content: string): CharacterOrderingTokenizer {
  const reader = new StringReader(content)
  return new CharacterOrderingTokenizer(reader)
}
