import { AbstractBaseTokenizer } from './AbstractTokenizer'
import { Token } from './Token'
import { Tokenizer } from './Tokenizer'
import { TokenValue } from './TokenValue'

/** The tokenizer class for the TNT syntax. */
export class TNTTokenizer extends AbstractBaseTokenizer {
  /** The set of keywords used in the TNT format. */
  private static readonly keywordsTokens: Set<Token> = new Set([
    Token.AMPERSAND_CONT,
    Token.AMPERSAND_NUM,
    Token.CCODE,
    Token.CNAMES,
    Token.COMMENTS,
    Token.CONT,
    Token.CONTINUOUS,
    Token.DATA,
    Token.DATATYPE,
    Token.DIMENSIONS,
    Token.MXRAM,
    Token.NCHAR,
    Token.NSTATES,
    Token.NTAX,
    Token.NUM,
    Token.NUMERIC,
    Token.ORD,
    Token.PROC,
    Token.TEXT,
    Token.XREAD,
  ])

  protected static readonly stringTerminatingTokens: Set<Token> = new Set([
    Token.COLON,
    // Token.EQUAL,
    Token.OPEN_SBRACKET,
    Token.SEMICOLON,
  ])

  protected override isKeyword(token: Token): boolean {
    return TNTTokenizer.keywordsTokens.has(token)
  }

  public override getTokenValue(): TokenValue {
    // Handle special TNT compound tokens &[cont] and &[num]
    const position = this.reader.getPosition()
    
    // First check if we have an ampersand followed by a bracket
    if (this.reader.peekCharacter() === '&') {
      const startPosition = this.reader.getPosition()
      
      // Look ahead to see if this is a compound token
      this.reader.getCharacter() // consume '&'
      if (this.reader.peekCharacter() === '[') {
        this.reader.getCharacter() // consume '['
        
        // Read the content inside brackets
        const content: string[] = []
        while (!this.reader.isAtEnd()) {
          const nextChar = this.reader.peekCharacter()
          if (nextChar === ']') {
            this.reader.getCharacter() // consume ']'
            break
          }
          content.push(this.reader.getCharacter())
        }
        
        const contentStr = content.join('').toLowerCase()
        if (contentStr === 'cont') {
          return TokenValue.of(position, Token.AMPERSAND_CONT, '&[cont]')
        } else if (contentStr === 'num') {
          return TokenValue.of(position, Token.AMPERSAND_NUM, '&[num]')
        }
      }
      
      // If not a recognized compound token, reset position and fall back
      this.reader.setPosition(startPosition)
    }

    // TNT-specific tokenization that treats quotes as regular characters
    return this.getTNTTokenValue()
  }

  /**
   * Get token value with TNT-specific rules:
   * - Quotes at the START of a token are treated as string delimiters (strip quotes)
   * - Quotes in the MIDDLE of a token are kept as regular characters
   * - Underscores are converted to spaces
   * - Tokens are delimited by whitespace and terminating tokens (colon, semicolon, etc.)
   */
  private getTNTTokenValue(): TokenValue {
    const position = this.reader.getPosition()
    let character: string

    // Skip whitespace
    do {
      if (this.reader.isAtEnd()) {
        return TokenValue.of(position, Token.EOF, Token.EOF)
      }
      character = this.reader.getCharacter()
    } while (AbstractBaseTokenizer.isWhiteSpace(character))

    // Handle comments (brackets)
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

    // Check if the token STARTS with a quote
    // If so, treat it as a quoted string (traditional behavior)
    if (
      character == Token.SINGLE_QUOTE ||
      character == Token.DOUBLE_QUOTE ||
      character == Token.TICK
    ) {
      // Handle tick conversion (Mesquite bug workaround)
      if (character == Token.TICK) {
        if (Token.TICK == this.reader.peekCharacter()) {
          this.reader.getCharacter()
          character = Token.DOUBLE_QUOTE
        } else {
          character = Token.SINGLE_QUOTE
        }
      }

      const quoteChar = character
      const cstring: string[] = []

      // Read everything until we find the matching closing quote
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

        cstring.push(character == Token.UNDERSCORE ? ' ' : character)
      }
      
      return TokenValue.of(position, Token.STRING, cstring.join('').trim())
    }

    // Token does NOT start with a quote, so quotes in the middle are treated as regular characters
    let isNumber = AbstractBaseTokenizer.isNumeric(character)
    const cstring: string[] = []

    // Read characters until we hit a terminating condition
    // Quotes in the middle of the token are kept as-is
    do {
      isNumber = isNumber && AbstractBaseTokenizer.isNumeric(character)
      cstring.push(character == Token.UNDERSCORE ? ' ' : character)

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
