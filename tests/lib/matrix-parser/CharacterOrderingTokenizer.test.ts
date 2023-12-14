import { StringReader } from '@/lib/matrix-parser/StringReader'
import { CharacterOrderingTokenizer } from '@/lib/matrix-parser/CharacterOrderingTokenizer'
import { Token } from '@/lib/matrix-parser/Token'
import { describe, expect, test } from '@jest/globals'

describe('CharacterOrderingTokenizerTest', () => {
  test('test codes', () => {
    const tokenizer = getTokenizerForContent('1-24,')

    expect(tokenizer.getTokenValue().getValue()).toBe('1')
    expect(tokenizer.getTokenValue().getValue()).toBe('-')
    expect(tokenizer.getTokenValue().getValue()).toBe('24')
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.COMMA)
  })

  test('test codes separated by spaces', () => {
    const tokenizer = getTokenizerForContent(' 1 - 24 ;')

    expect(tokenizer.getTokenValue().getValue()).toBe('1')
    expect(tokenizer.getTokenValue().getValue()).toBe('-')
    expect(tokenizer.getTokenValue().getValue()).toBe('24')
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.SEMICOLON)
  })

  test('test key word ALL', () => {
    const tokenizer = getTokenizerForContent('ALL;')

    expect(tokenizer.getTokenValue().getValue()).toBe(Token.ALL)
    expect(tokenizer.getTokenValue().getToken()).toBe(Token.SEMICOLON)
  })
})

function getTokenizerForContent(content: string): CharacterOrderingTokenizer {
  const reader = new StringReader(content)
  return new CharacterOrderingTokenizer(reader)
}
