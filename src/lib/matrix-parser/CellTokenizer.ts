import { Token } from './Token'
import { Tokenizer } from './Tokenizer'
import { TokenValue } from './TokenValue'

export class CellTokenizer extends Tokenizer {
  private static readonly matchCellGroupTokens: Map<string, string> = new Map([
    [Token.OPEN_BRACKET, Token.CLOSE_BRACKET],
    [Token.OPEN_PARENTHESIS, Token.CLOSE_PARENTHESIS],
    [Token.OPEN_SBRACKET, Token.CLOSE_SBRACKET],
  ])

  private static readonly cellSeparatorTokens: Set<string> = new Set(
    Token.COMMA
  )

  public override getTokenValue(): TokenValue {
    while (!this.reader.isAtEnd()) {
      const position = this.reader.getPosition()
      let character = this.reader.getCharacter()
      if (Tokenizer.isWhiteSpace(character)) {
        continue
      }

      if (CellTokenizer.matchCellGroupTokens.has(character)) {
        const endCharacter = CellTokenizer.matchCellGroupTokens.get(character)
        const uncertain = character == Token.OPEN_BRACKET
        const value: string[] = []
        while (!this.reader.isAtEnd()) {
          character = this.reader.getCharacter()
          if (CellTokenizer.isCellSeparator(character)) {
            continue
          }
          if (character == endCharacter) {
            break
          }
          value.push(character)
        }
        return TokenValue.of(
          position,
          uncertain ? Token.CELL_UNCERTAIN : Token.CELL_POLYMORPHIC,
          value.join('')
        )
      }

      return TokenValue.of(position, Token.CELL, character)
    }
    return TokenValue.of(this.reader.getPosition(), Token.EOF, '')
  }

  /** The characters that are used to separate cells in a grouping (e.g. [1 2], [1,3,4]). */
  private static isCellSeparator(character: string): boolean {
    return (
      Tokenizer.isWhiteSpace(character) ||
      CellTokenizer.cellSeparatorTokens.has(character)
    )
  }
}
