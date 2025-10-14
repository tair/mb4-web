import { AbstractBaseTokenizer } from './AbstractTokenizer'
import { FilePosition } from './FilePosition'
import { Token } from './Token'
import { Tokenizer } from './Tokenizer'
import { TokenValue } from './TokenValue'

/**
 * This class corresponds to a tokenizer for the NEXUS file format.
 */
export class NexusTokenizer extends AbstractBaseTokenizer {
  private static readonly keywordsTokens: Set<Token> = new Set([
    Token.ALL,
    Token.ASSUMPTIONS,
    Token.BEGIN,
    Token.BEGINBLOCK,
    Token.CCODE,
    Token.CHARACTER,
    Token.CHARACTERS,
    Token.CHARLABELS,
    Token.CHARSTATELABELS,
    Token.CNAMES,
    Token.COMMENTS,
    Token.CONT,
    Token.CONTINUOUS,
    Token.DATA,
    Token.DATATYPE,
    Token.DIMENSIONS,
    Token.DNA,
    Token.END,
    Token.ENDBLOCK,
    Token.GAP,
    Token.FORMAT,
    Token.LINK,
    Token.LOG,
    Token.MATRIX,
    Token.MISSING,
    Token.NCHAR,
    Token.NEXUS,
    Token.NOTES,
    Token.NTAX,
    Token.NUM,
    Token.NUMERIC,
    Token.OPTIONS,
    Token.ORD,
    Token.PROC,
    Token.STANDARD,
    Token.STATE,
    Token.STATELABELS,
    Token.SYMBOLS,
    Token.TAXA,
    Token.TAXLABELS,
    Token.TAXON,
    Token.TEXT,
    Token.TITLE,
    Token.TYPESET,
    Token.UNORD,
    Token.UNTITLED,
    Token.USERTYPE,
  ])

  protected override isKeyword(token: Token): boolean {
    return NexusTokenizer.keywordsTokens.has(token)
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

      // Handle inline comments [xxx] that can be attached to tokens
      if (character == Token.OPEN_BRACKET) {
        // If we've already built part of a token, return it first
        if (cstring.length > 0) {
          // Reset position to point back to the '[' character so it gets handled in the next call
          const currentPos = this.reader.getPosition()
          const newPos = new FilePosition(
            currentPos.getPosition() - 1,
            currentPos.getLineNumber(),
            currentPos.getColumnNumber() - 1
          )
          this.reader.setPosition(newPos)
          break
        }
        
        // Otherwise, skip the comment and continue to next token
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
        } while (character != null && !this.reader.isAtEnd())
        
        // After skipping comment, get next non-whitespace character to continue
        do {
          if (this.reader.isAtEnd()) {
            return TokenValue.of(position, Token.EOF, Token.EOF)
          }
          character = this.reader.getCharacter()
        } while (AbstractBaseTokenizer.isWhiteSpace(character))
        
        // Reset number detection for the new character
        isNumber = AbstractBaseTokenizer.isNumeric(character)
      }

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
        }
        
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
