import { Token } from './Token'
import { Tokenizer } from './Tokenizer'
import { TokenValue } from './TokenValue'

export class CommentsTokenizer extends Tokenizer {
  private static readonly eofTokens = new Set([
    Token.EOF,
    Token.NEW_LINE,
    Token.LINE_BREAK,
  ])

  public override getTokenValue(): TokenValue {
    const position = this.reader.getPosition()
    const value: Array<string> = []

    do {
      const character = this.reader.getCharacter()
      const peekCharacter = this.reader.peekCharacter() as Token
      if (
        character == Token.SEMICOLON &&
        CommentsTokenizer.eofTokens.has(peekCharacter)
      ) {
        break
      }
      value.push(character)
    } while (!this.reader.isAtEnd())

    return TokenValue.of(position, Token.STRING, value.join('').trim())
  }
}
