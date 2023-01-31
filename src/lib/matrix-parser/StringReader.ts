import { FilePosition } from './FilePosition'
import type { Reader } from './Reader'

export class StringReader implements Reader {
  private content: string
  private currentPosition: number
  private maxPosition: number
  private lineNumber: number
  private columnNumber: number

  constructor(
    content: string,
    currentPosition = 0,
    maxPosition = content.length
  ) {
    this.content = content
    this.currentPosition = currentPosition
    this.maxPosition = maxPosition
    this.lineNumber = 1
    this.columnNumber = 1
  }

  getCharacter(): string {
    if (this.isAtEnd()) {
      throw new Error('Cannot read pass end of string')
    }

    let character = this.content[this.currentPosition++]

    // Let's consume both the carriage return and new line so that the parsers don't need to worry
    // about platform differences.
    if (character === '\r' && this.content[this.currentPosition] === '\n') {
      character = this.content[this.currentPosition++]
    }

    if (character == '\n') {
      this.columnNumber = 1
      ++this.lineNumber
    } else {
      ++this.columnNumber
    }
    return character
  }

  peekCharacter(): string {
    let character = this.content[this.currentPosition]
    if (character === '\r') {
      return '\n'
    }
    return character
  }

  resetPosition(): void {
    this.currentPosition = 0
    this.lineNumber = 1
    this.columnNumber = 1
  }

  getPosition(): FilePosition {
    return new FilePosition(
      this.currentPosition,
      this.lineNumber,
      this.columnNumber
    )
  }

  setPosition(position: FilePosition): void {
    if (this.maxPosition < position.getPosition()) {
      throw new Error('Cannot set position outside of maximum position')
    }
    this.currentPosition = position.getPosition()
    this.lineNumber = position.getLineNumber()
    this.columnNumber = position.getColumnNumber()
  }

  isAtEnd(): boolean {
    return this.currentPosition >= this.maxPosition
  }

  getReader(): Reader {
    return this
  }

  getContent(): string {
    return this.content
  }
}
