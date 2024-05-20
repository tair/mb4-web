import { Tokenizer } from './Tokenizer'
import { Token } from './Token'
import { TokenValue } from './TokenValue'

export class CCodeTokenizer extends Tokenizer {
  private static readonly allowedSingleTokens: Set<Token> = new Set([
    Token.ASTERISK,
    Token.BLACKSLASH,
    Token.CLOSE_BRACKET,
    Token.CLOSE_PARENTHESIS,
    Token.DOT,
    Token.EQUAL,
    Token.MINUS,
    Token.OPEN_BRACKET,
    Token.OPEN_PARENTHESIS,
    Token.PLUS,
    Token.SEMICOLON,
  ])

  public override getTokenValue(): TokenValue {
    let character: string | null = null

    while (!this.reader.isAtEnd()) {
      const position = this.reader.getPosition()
      character = this.reader.getCharacter()
      if (Tokenizer.isWhiteSpace(character)) {
        continue
      }

      if (Tokenizer.isNumeric(character)) {
        const tokens = [character]
        while (!this.reader.isAtEnd()) {
          character = this.reader.peekCharacter()
          if (!Tokenizer.isNumeric(character)) {
            break
          }
          tokens.push(this.reader.getCharacter())
        }
        return TokenValue.of(position, Token.NUMBER, tokens.join(''))
      }

      if (CCodeTokenizer.allowedSingleTokens.has(character as Token)) {
        return TokenValue.of(position, character as Token, character)
      }
    }

    throw new Error(`Invalid character ${character}`)
  }
}
