import { Tokenizer } from './Tokenizer'
import { Token } from './Token'
import { TokenValue } from './TokenValue'

export class CharacterOrderingTokenizer extends Tokenizer {
  private static readonly separatorTokens: Set<string> = new Set([
    Token.COMMA,
    Token.DOT,
    Token.FORWARDSLASH,
    Token.MINUS,
    Token.SEMICOLON,
  ])

  public override getTokenValue(): TokenValue {
    let character
    let position
    do {
      position = this.reader.getPosition()
      character = this.reader.getCharacter()
    } while (Tokenizer.isWhiteSpace(character))

    if (CharacterOrderingTokenizer.separatorTokens.has(character)) {
      const token = CharacterOrderingTokenizer.determineToken(character)
      return TokenValue.of(position, token, character)
    }

    const values: string[] = [character]
    while (!this.reader.isAtEnd()) {
      character = this.reader.peekCharacter()
      if (
        Tokenizer.isWhiteSpace(character) ||
        CharacterOrderingTokenizer.separatorTokens.has(character)
      ) {
        break
      }
      values.push(this.reader.getCharacter())
    }

    const value = values.join('')
    const token = CharacterOrderingTokenizer.determineToken(value)
    return TokenValue.of(position, token, value)
  }

  private static determineToken(value: string): Token {
    if (Tokenizer.isNumeric(value)) {
      return Token.NUMBER
    }
    switch (value) {
      case Token.ALL:
        return Token.ALL
      case Token.COMMA:
        return Token.COMMA
      case Token.DOT:
        return Token.DOT
      case Token.FORWARDSLASH:
        return Token.FORWARDSLASH
      case Token.MINUS:
        return Token.MINUS
      case Token.SEMICOLON:
        return Token.SEMICOLON
      default:
        return Token.STRING
    }
  }
}
