import { StringReader } from '@/lib/matrix-parser/StringReader'
import { ContinuousCellTokenizer } from '@/lib/matrix-parser/ContinuousCellTokenizer'
import { describe, expect, test } from '@jest/globals'

describe('ContinuousCellTokenizerTest', () => {
  test('test integers', () => {
    const tokenizer = getTokenizerForContent('1 24 100')

    expect(tokenizer.getTokenValue().getValue()).toBe('1')
    expect(tokenizer.getTokenValue().getValue()).toBe('24')
    expect(tokenizer.getTokenValue().getValue()).toBe('100')
  })

  test('test floats', () => {
    const tokenizer = getTokenizerForContent('1.34 2.68')

    expect(tokenizer.getTokenValue().getValue()).toBe('1.34')
    expect(tokenizer.getTokenValue().getValue()).toBe('2.68')
  })

  test('test ranges', () => {
    const tokenizer = getTokenizerForContent('1-2 1.34-2.68')

    expect(tokenizer.getTokenValue().getValue()).toBe('1-2')
    expect(tokenizer.getTokenValue().getValue()).toBe('1.34-2.68')
  })
})

function getTokenizerForContent(content: string): ContinuousCellTokenizer {
  const reader = new StringReader(content)
  return new ContinuousCellTokenizer(reader)
}
