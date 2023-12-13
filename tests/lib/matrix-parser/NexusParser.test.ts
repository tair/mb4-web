import { StringReader } from '@/lib/matrix-parser/StringReader'
import { NexusParser } from '@/lib/matrix-parser/NexusParser'
import { describe, test } from '@jest/globals'
import fs from 'fs'

describe('NexusParserTest', () => {
  test('test file', () => {
    // TODO(kenzley): Add NEXUS test files.
  })
})

function getParserForFile(file: string): NexusParser {
  const content = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' })
  const reader = new StringReader(content)
  return new NexusParser(reader)
}
