import { describe, expect, test } from '@jest/globals'

import { StringReader } from '@/lib/matrix-parser/StringReader'
import { CCodeTokenizer } from '@/lib/matrix-parser/CCodeTokenizer'

describe('CCodeTokenizerTests', () => {
  test('test codes', () => {
    const tokenizer = getTokenizerForContent('1-24;')

    expect(tokenizer.getTokenValue().getValue()).toBe('1')
    expect(tokenizer.getTokenValue().getValue()).toBe('-')
    expect(tokenizer.getTokenValue().getValue()).toBe('24')
    expect(tokenizer.getTokenValue().getValue()).toBe(';')
  })

  test('test codes separated by spaces', () => {
    const tokenizer = getTokenizerForContent(' 1 - 24 ;')

    expect(tokenizer.getTokenValue().getValue()).toBe('1')
    expect(tokenizer.getTokenValue().getValue()).toBe('-')
    expect(tokenizer.getTokenValue().getValue()).toBe('24')
    expect(tokenizer.getTokenValue().getValue()).toBe(';')
  })
})

function getTokenizerForContent(content: string): CCodeTokenizer {
  const reader = new StringReader(content)
  return new CCodeTokenizer(reader)
}
