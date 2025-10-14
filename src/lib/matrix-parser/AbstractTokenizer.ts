import { Token } from './Token'
import { Tokenizer } from './Tokenizer'
import { TokenValue } from './TokenValue'

/**
 * An abstract base tokenzier used by other tokenizer.
 */
export abstract class AbstractBaseTokenizer extends Tokenizer {
  /** An array of allowed tokens for keywords. **/
  protected static readonly singleTokens: Set<Token> = new Set([
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

  protected static readonly stringTerminatingTokens: Set<Token> = new Set([
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
   * Returns a boolean indicating whether the given token is a terminating token
   * for strings.
   */
  protected isTerminatingToken(token: Token): boolean {
    return (this.constructor as typeof AbstractBaseTokenizer).stringTerminatingTokens.has(token)
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

    const cstring: string[] = []
    do {
      isNumber = isNumber && AbstractBaseTokenizer.isNumeric(character)

      if (
        character == Token.SINGLE_QUOTE ||
        character == Token.DOUBLE_QUOTE ||
        character == Token.TICK
      ) {
        isNumber = false

        // Ticks are treated uniquely because there is a bug in Mesquite that
        // inserts ticks in place of single and double quotes for one or both
        // of the quotes. We adjust our parser to convert ticks to their
        // equivalent quotes.
        if (character == Token.TICK) {
          if (Token.TICK == this.reader.peekCharacter()) {
            this.reader.getCharacter()
            character = Token.DOUBLE_QUOTE
          } else {
            character = Token.SINGLE_QUOTE
          }
        }

        const quoteChar = character

        // Read everything until we find the matching closing quote
        // IMPORTANT: Only the same quote type that opened the string can close it
        while (!this.reader.isAtEnd()) {
          character = this.reader.getCharacter()
          
          // Handle double consecutive quotes (escaped quotes)
          if (character == quoteChar) {
            const nextCharacter = this.reader.peekCharacter()
            if (nextCharacter == character) {
              // Escaped quote: add one quote character and continue
              this.reader.getCharacter() // consume the second quote
              cstring.push(character)
              continue
            } else {
              // This is the closing quote - we're done
              break
            }
          }
          
          // Handle escape sequences
          if (character == Token.CARROT) {
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

          // Add this character to the quoted content
          // NOTE: When inside single quotes, double quotes are treated as regular characters
          // When inside double quotes, single quotes are treated as regular characters  
          cstring.push(character)
          
          // Safety check to prevent infinite loops
          if (cstring.length > 200) {
            // throw new Error('Quoted string too long - missing closing quote')
          }
        }
        // After processing a complete quoted string, we should stop tokenizing
        // and return this token immediately, regardless of what follows
        break
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
