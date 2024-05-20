import { FilePosition } from './FilePosition'
import type { Reader } from './Reader'
import type { TokenValue } from './TokenValue'

export abstract class Tokenizer {
  protected readonly reader: Reader

  constructor(reader: Reader) {
    this.reader = reader
  }

  public abstract getTokenValue(): TokenValue

  public reset(): void {
    return this.reader.resetPosition()
  }

  public setPosition(position: FilePosition): void {
    return this.reader.setPosition(position)
  }

  public isFinished(): boolean {
    return this.reader.isAtEnd()
  }

  protected static isWhiteSpace(s: string): boolean {
    return /^\s+$/g.test(s)
  }

  protected static isAlphaNumeric(s: string): boolean {
    const len = s.length
    for (let i = 0; i < len; ++i) {
      const code = s.charCodeAt(i)
      if (
        !(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)
      ) {
        // lower alpha (a-z)
        return false
      }
    }
    return true
  }

  protected static isNumeric(s: string): boolean {
    s = s.trim()
    return s.length > 0 && !isNaN(Number(s))
  }
}
