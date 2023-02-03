import type { FilePosition } from './FilePosition'
import type { Token } from './Token'

/**
 * This class represents a token, its value, and the position it is in the file.
 * This is used throughout the parser to indicate keywords and content in a
 * matrix file.
 */
export class TokenValue {
  private readonly position: FilePosition
  private readonly token: Token
  private readonly value: string

  static of(position: FilePosition, token: Token, value: string): TokenValue {
    return new TokenValue(position, token, value)
  }

  constructor(position: FilePosition, token: Token, value: string) {
    this.position = position
    this.token = token
    this.value = value
  }

  getFilePosition(): FilePosition {
    return this.position
  }

  getToken(): Token {
    return this.token
  }

  getValue(): string {
    return this.value
  }
}
