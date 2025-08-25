import { StringReader } from '@/lib/matrix-parser/StringReader'
import { NexusTokenizer } from '@/lib/matrix-parser/NexusTokenizer'
import { Token } from '@/lib/matrix-parser/Token'
import { describe, expect, test } from '@jest/globals'

describe('NexusTokenizerTest', () => {
  test('Quoted Names format', () => {
    const tokenizer = getTokenizerForContent("  '''Human'' boy'  ")

    const token = tokenizer.getTokenValue()
    expect(token.getToken()).toBe(Token.STRING)
    expect(token.getValue()).toBe('"Human" boy')
  })

  test('Independent comment handling', () => {
    const tokenizer = getTokenizerForContent('BEGIN [this is a comment] CHARACTERS')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.BEGIN)
    expect(token1.getValue()).toBe('BEGIN')

    // Comment should be tokenized but can be ignored by parser
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.COMMENT)
    expect(token2.getValue()).toBe('this is a comment')

    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.CHARACTERS)
    expect(token3.getValue()).toBe('CHARACTERS')
  })

  test('Inline comment handling', () => {
    const tokenizer = getTokenizerForContent('CHARACTER[comment attached] DIMENSIONS')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.CHARACTER)
    expect(token1.getValue()).toBe('CHARACTER')

    // The comment should be handled as a separate comment token
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.COMMENT)
    expect(token2.getValue()).toBe('comment attached')

    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.DIMENSIONS)
    expect(token3.getValue()).toBe('DIMENSIONS')
  })

  test('Multiple inline comments', () => {
    const tokenizer = getTokenizerForContent('BEGIN[first] CHARACTERS[second] DIMENSIONS')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.BEGIN)
    expect(token1.getValue()).toBe('BEGIN')

    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.COMMENT)
    expect(token2.getValue()).toBe('first')

    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.CHARACTERS)
    expect(token3.getValue()).toBe('CHARACTERS')

    const token4 = tokenizer.getTokenValue()
    expect(token4.getToken()).toBe(Token.COMMENT)
    expect(token4.getValue()).toBe('second')

    const token5 = tokenizer.getTokenValue()
    expect(token5.getToken()).toBe(Token.DIMENSIONS)
    expect(token5.getValue()).toBe('DIMENSIONS')
  })

  test('Nested comments', () => {
    const tokenizer = getTokenizerForContent('BEGIN[outer [nested] comment] END')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.BEGIN)
    expect(token1.getValue()).toBe('BEGIN')

    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.COMMENT)
    expect(token2.getValue()).toBe('outer [nested] comment')

    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.END)
    expect(token3.getValue()).toBe('END')
  })

  test('CHARACTERS[!] should split like any other comment', () => {
    const tokenizer = getTokenizerForContent('BEGIN CHARACTERS[!];')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.BEGIN)
    expect(token1.getValue()).toBe('BEGIN')

    // CHARACTERS[!] should now be split into CHARACTERS + [!] comment
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.CHARACTERS)
    expect(token2.getValue()).toBe('CHARACTERS')

    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.COMMENT)
    expect(token3.getValue()).toBe('!')

    const token4 = tokenizer.getTokenValue()
    expect(token4.getToken()).toBe(Token.SEMICOLON)
    expect(token4.getValue()).toBe(';')
  })

  test('Regular CHARACTERS with other comments should split', () => {
    const tokenizer = getTokenizerForContent('BEGIN CHARACTERS[regular comment];')

    const token1 = tokenizer.getTokenValue()
    expect(token1.getToken()).toBe(Token.BEGIN)
    expect(token1.getValue()).toBe('BEGIN')

    // CHARACTERS should be separate from regular comments
    const token2 = tokenizer.getTokenValue()
    expect(token2.getToken()).toBe(Token.CHARACTERS)
    expect(token2.getValue()).toBe('CHARACTERS')

    const token3 = tokenizer.getTokenValue()
    expect(token3.getToken()).toBe(Token.COMMENT)
    expect(token3.getValue()).toBe('regular comment')

    const token4 = tokenizer.getTokenValue()
    expect(token4.getToken()).toBe(Token.SEMICOLON)
    expect(token4.getValue()).toBe(';')
  })
})

function getTokenizerForContent(content: string): NexusTokenizer {
  const reader = new StringReader(content, 0, content.length)
  return new NexusTokenizer(reader)
}
