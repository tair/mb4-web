import type { FilePosition } from './FilePosition'
import type { Reader } from './Reader'

export class SubstringReader implements Reader {
  private readonly reader: Reader
  private readonly startPosition: FilePosition
  private readonly terminatingCharacters: string[]
  private terminated: boolean

  constructor(reader: Reader, terminatingCharacters: string[]) {
    this.reader = reader
    this.startPosition = this.reader.getPosition()
    this.terminatingCharacters = terminatingCharacters
    this.terminated = false
  }

  getCharacter(): string {
    if (this.isAtEnd()) {
      throw new Error('Cannot read pass end of string')
    }

    const character = this.reader.getCharacter()
    this.terminated = this.terminatingCharacters.includes(character)
    return character
  }

  peekCharacter(): string {
    return this.reader.peekCharacter()
  }

  resetPosition(): void {
    this.setPosition(this.startPosition)
  }

  getPosition(): FilePosition {
    return this.reader.getPosition()
  }

  setPosition(position: FilePosition): void {
    const startPosition = this.startPosition.getPosition()
    const newPosition = position.getPosition()
    if (newPosition < startPosition) {
      throw new Error('Cannot set position before the start position')
    }

    const endPosition = this.getEndPosition()
    if (endPosition < newPosition) {
      throw new Error('Cannot set position after the end position')
    }
    this.reader.setPosition(position)
    this.terminated = endPosition == newPosition
  }

  isAtEnd(): boolean {
    return this.terminated
  }

  getReader(): Reader {
    return this
  }

  getContent(): string {
    const content = this.reader.getContent()
    const startPosition = this.startPosition.getPosition()
    const endPosition = this.getEndPosition()
    return content.substring(startPosition, endPosition)
  }

  private getEndPosition(): number {
    const content = this.reader.getContent()
    const startPosition = this.startPosition.getPosition()
    let minMaxPosition = content.length
    for (const terminatingCharacter of this.terminatingCharacters) {
      const position = content.indexOf(terminatingCharacter, startPosition)
      if (position > 0 && position < minMaxPosition) {
        minMaxPosition = position + 1
      }
    }
    return minMaxPosition
  }
}
