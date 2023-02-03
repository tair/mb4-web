import { FilePosition } from './FilePosition'
import { Lexer } from './Lexer'
import { MatrixObject } from './MatrixObject'
import type { Parser } from './Parser'
import type { Reader } from './Reader'
import { Token } from './Token'
import type { Tokenizer } from './Tokenizer'
import type { TokenValue } from './TokenValue'

export abstract class AbstractParser implements Parser {
  protected readonly reader: Reader
  protected readonly tokenizer: Lexer
  protected readonly matrixObject: MatrixObject
  protected lastLoopPosition: FilePosition
  protected loopIteration: number

  constructor(reader: Reader, tokenizer: Tokenizer) {
    this.reader = reader
    this.tokenizer = new Lexer(tokenizer)
    this.matrixObject = new MatrixObject(this.getFormat())
    this.lastLoopPosition = new FilePosition(0, 0, 0)
    this.loopIteration = 0
  }

  /**
   * Parses the input into a MatrixObject.
   * @returns The matrix object representation of the input.
   */
  public abstract parse(): MatrixObject

  /**
   * Gets the format of the parser.
   * @returns A string indicate the format.
   */
  public abstract getFormat(): string;

  /**
   * This will skip all the tokens until a semicolon is encountered. This is
   * useful when the parser does not need to include the next block or command
   * into the matrix.
   */
  protected skipToSemicolon(): void {
    this.skipUntilToken(Token.SEMICOLON)
  }

  protected convertNumber(tokenValue: TokenValue): number {
    if (tokenValue.getToken() != Token.NUMBER) {
      throw Error('Token is not a number')
    }
    return Number(tokenValue.getValue())
  }

  protected untilToken(tokens: Token[]): boolean {
    // This detects when there is an infinite loop when reading the input file.
    if (++this.loopIteration % 1000 == 0) {
      if (this.lastLoopPosition.equals(this.reader.getPosition())) {
        throw new Error('Possible infinite loop at ' + this.lastLoopPosition)
      }
      this.lastLoopPosition = this.reader.getPosition()
    }

    return (
      !this.tokenizer.isFinished() &&
      !this.tokenizer.consumeTokenIfMatch(tokens)
    )
  }

  /**
   * Skips all tokens until the matched token is encountered.
   * @param token The token to match.
   */
  private skipUntilToken(token: Token): void {
    while (!this.tokenizer.consumeTokenIfMatch([token])) {
      this.tokenizer.consumeToken()
      if (this.tokenizer.isFinished()) {
        break
      }
    }
  }
}
