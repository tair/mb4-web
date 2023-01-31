import { NexusParser } from './NexusParser'
import type { Parser } from './Parser'
import { StringReader } from './StringReader'
import { TNTParser } from './TNTParser'

/** The factory for parsing files. */
export class ParserFactory {
  /**
   * Gets the Parser needed to parse the file.
   *
   * @param file The content of the file to be parsed.
   * @returns The parser needed for parse the file.
   */
  getParserForFile(file: string): Parser | null {
    const reader = new StringReader(file)

    const nexusParser = new NexusParser(reader)
    if (nexusParser.isNexus()) {
      return nexusParser
    }

    reader.resetPosition()
    const tntParser = new TNTParser(reader)
    if (tntParser.isTNT()) {
      return tntParser
    }

    return null
  }
}
