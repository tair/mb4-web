import { AbstractBaseTokenizer } from './AbstractTokenizer'
import { Token } from './Token'
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
    Token.EQUAL,
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

    // Fall back to parent tokenization for all other cases
    return super.getTokenValue()
  }
}
