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
})

function getTokenizerForContent(content: string): NexusTokenizer {
  const reader = new StringReader(content, 0, content.length)
  return new NexusTokenizer(reader)
}
