import type { FilePosition } from './FilePosition'

/**
 * Interface for reading through a source file.
 */
export interface Reader {
  /**
   * @return next character in the stream.
   */
  getCharacter(): string

  /**
   * @return peeks the next character in the stream but does not consume it.
   */
  peekCharacter(): string

  /**
   * Sets the position of the pointer in the stream.
   * @return boolean whether the seek method completed successfully.
   */
  resetPosition(): void

  /**
   * Sets the current position in the stream.
   * @param position The position to set in the stream.
   */
  setPosition(position: FilePosition): void

  /**
   * Returns the current position in the stream.
   * @return int the position.
   */
  getPosition(): FilePosition

  /**
   * @return boolean whether the tokenizer has finished reading the stream.
   */
  isAtEnd(): boolean

  /**
   * Gets the current reader.
   */
  getReader(): Reader

  /**
   * gets the content of the reader.
   */
  getContent(): string
}
