import { Tokenizer } from './Tokenizer'
import { Token } from './Token'
import { TokenValue } from './TokenValue'

export class ContinuousCellTokenizer extends Tokenizer {
  public override getTokenValue(): TokenValue {
    const position = this.reader.getPosition()
    const value: string[] = []
    
    // Check if we're already at the end before trying to read
    if (this.reader.isAtEnd()) {
      return TokenValue.of(position, Token.EOF, '')
    }
    
    while (!this.reader.isAtEnd()) {
      const character = this.reader.getCharacter()
      // consume all white spaces before reading the first character
      if (Tokenizer.isWhiteSpace(character) && value.length === 0) {
        continue
      }
      // break if we encounter a white space and we already read some characters
      if (Tokenizer.isWhiteSpace(character) && value.length > 0) {
        break
      }
      value.push(character)
    }
    return TokenValue.of(position, Token.CELL, value.join(''))
  }
}
