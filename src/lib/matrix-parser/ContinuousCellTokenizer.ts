import { Tokenizer } from './Tokenizer'
import { Token } from './Token'
import { TokenValue } from './TokenValue'

export class ContinuousCellTokenizer extends Tokenizer {
  public override getTokenValue(): TokenValue {
    const position = this.reader.getPosition()
    const value: string[] = []
    while (!this.reader.isAtEnd()) {
      const character = this.reader.getCharacter()
      if (Tokenizer.isWhiteSpace(character)) {
        break
      }
      value.push(character)
    }
    return TokenValue.of(position, Token.CELL, value.join(''))
  }
}
