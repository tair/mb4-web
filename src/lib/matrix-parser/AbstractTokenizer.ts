import { Token } from './Token'
import { Tokenizer } from './Tokenizer'
import { TokenValue } from './TokenValue'

/**
 * An abstract base tokenzier used by other tokenizer.
 */
export abstract class AbstractBaseTokenizer extends Tokenizer {
  /** An array of allowed tokens for keywords. **/
  private static readonly singleTokens: Set<Token> = new Set([
    Token.AMPERSAND,
    Token.ASTERISK,
    Token.AT,
    Token.BLACKSLASH,
    Token.CARROT,
    Token.CLOSE_BRACKET,
    Token.CLOSE_PARENTHESIS,
    Token.CLOSE_SBRACKET,
    Token.COLON,
    Token.COMMA,
    Token.DASH,
    Token.DOT,
    Token.DOUBLE_QUOTE,
    Token.EQUAL,
    Token.EXCLAMATION,
    Token.GREATER,
    Token.LESSER,
    Token.MINUS,
    Token.OPEN_BRACKET,
    Token.OPEN_PARENTHESIS,
    Token.OPEN_SBRACKET,
    Token.PERCENTAGE,
    Token.PLUS,
    Token.POUND,
    Token.SEMICOLON,
    Token.QUESTION,
    Token.TILDE,
    Token.UNDERSCORE,
  ])

  private static readonly stringTerminatingTokens: Set<Token> = new Set([
    Token.COLON,
    Token.COMMA,
    Token.EQUAL,
    Token.OPEN_SBRACKET,
    Token.SEMICOLON,
  ])

  /**
   * Determine whether a token is a keyword in the language.
   */
  protected abstract isKeyword(token: Token): boolean

  /**
   * Returns a boolean indicating whether the given token is a terminating token for strings.
   */
  protected isTerminatingToken(token: Token): boolean {
    return AbstractBaseTokenizer.stringTerminatingTokens.has(token)
  }

  /**
   * @return gets the next token in the file stream.
   */
  public override getTokenValue(): TokenValue {
    const position = this.reader.getPosition()
    let character: string

    do {
      if (this.reader.isAtEnd()) {
        return TokenValue.of(position, Token.EOF, Token.EOF)
      }

      character = this.reader.getCharacter()
    } while (AbstractBaseTokenizer.isWhiteSpace(character))

    // This logic parses indepedent comments.
    if (character == Token.OPEN_BRACKET) {
      const comment: string[] = []
      let openBracketCount = 1
      do {
        character = this.reader.getCharacter()
        if (character == Token.OPEN_BRACKET) {
          openBracketCount++
        } else if (
          character == Token.CLOSE_BRACKET &&
          --openBracketCount == 0
        ) {
          break
        }
        comment.push(character)
      } while (character != null && !this.reader.isAtEnd())
      return TokenValue.of(position, Token.COMMENT, comment.join(''))
    }

    let isNumber = AbstractBaseTokenizer.isNumeric(character)

    const cstring : string[] = []
    do {
      isNumber = isNumber && AbstractBaseTokenizer.isNumeric(character)

      if (
        character == Token.SINGLE_QUOTE ||
        character == Token.DOUBLE_QUOTE ||
        character == Token.TICK
      ) {
        isNumber = false
        if (character == Token.TICK) {
          if (Token.TICK == this.reader.peekCharacter()) {
            this.reader.getCharacter()
            character = Token.DOUBLE_QUOTE
          } else {
            character = Token.SINGLE_QUOTE
          }
        }
        const quoteChar = character

        while (!this.reader.isAtEnd()) {
          character = this.reader.getCharacter()
          if (character == Token.TICK || character == Token.SINGLE_QUOTE) {
            const nextCharacter = this.reader.peekCharacter()
            if (nextCharacter == character) {
              this.reader.getCharacter()
              character = Token.DOUBLE_QUOTE
            }
          }

          if (character == quoteChar) {
            break
          } else if (character == Token.CARROT) {
            character = this.reader.getCharacter()
            switch (character) {
              case 'n':
                character = '\n'
                break
              default:
                character = '^c'
                break
            }
          } else if (character == Token.FORWARDSLASH) {
            character = this.reader.getCharacter()
          } else if (character == Token.TICK) {
            character = Token.SINGLE_QUOTE
          }

          cstring.push(character)
        }
      } else {
        cstring.push(character == Token.UNDERSCORE ? ' ' : character)
      }

      const peekCharacter = this.reader.peekCharacter() as Token
      if (
        this.isTerminatingToken(character as Token) ||
        this.isTerminatingToken(peekCharacter) ||
        this.reader.isAtEnd()
      ) {
        break
      }

      character = this.reader.getCharacter()
    } while (!Tokenizer.isWhiteSpace(character))

    const value = cstring.join('').trim()
    if (AbstractBaseTokenizer.isNumeric(value)) {
      return TokenValue.of(position, Token.NUMBER, value)
    }

    const possibleKeywordToken = value.toUpperCase() as Token
    if (
      value.length == 1 &&
      AbstractBaseTokenizer.singleTokens.has(possibleKeywordToken)
    ) {
      return TokenValue.of(position, possibleKeywordToken, value)
    }

    if (this.isKeyword(possibleKeywordToken)) {
      return TokenValue.of(position, possibleKeywordToken, value)
    }

    return TokenValue.of(position, Token.STRING, value)
  }
}
