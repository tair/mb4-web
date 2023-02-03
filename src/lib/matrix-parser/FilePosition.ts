/**
 * This class indicates a position within a file. This is used to mark the line
 * and column number of a file.
 */
export class FilePosition {
  private readonly position: number
  private readonly lineNumber: number
  private readonly columnNumber: number

  constructor(position: number, lineNumber: number, columnNumber: number) {
    this.position = position
    this.lineNumber = lineNumber
    this.columnNumber = columnNumber
  }

  getPosition(): number {
    return this.position
  }

  getLineNumber(): number {
    return this.lineNumber
  }

  getColumnNumber(): number {
    return this.columnNumber
  }

  equals(position: FilePosition): boolean {
    return (
      this.position == position.position &&
      this.lineNumber == position.lineNumber &&
      this.columnNumber == position.columnNumber
    )
  }
}
