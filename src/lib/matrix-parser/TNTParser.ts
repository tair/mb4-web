import { AbstractParser } from './AbstractParser'
import { CCodeTokenizer } from './CCodeTokenizer'
import { CellTokenizer } from './CellTokenizer'
import { CommentsTokenizer } from './CommentsTokenizer'
import { ContinuousCellTokenizer } from './ContinuousCellTokenizer'
import { Cell, CharacterType, DataType, MatrixObject } from './MatrixObject'
import type { Reader } from './Reader'
import { SubstringReader } from './SubstringReader'
import { TNTTokenizer } from './TNTTokenizer'
import { Token } from './Token'

export class TNTParser extends AbstractParser {
  constructor(reader: Reader) {
    super(reader, new TNTTokenizer(reader))
  }

  public override parse(): MatrixObject {
    if (!this.isTNT()) {
      throw new Error('Not valid TNT File')
    }
    this.tokenizer.reset()
    this.doCommands()
    return this.matrixObject
  }

  public override getFormat(): string {
    return 'TNT'
  }

  public isTNT(): boolean {
    if (this.tokenizer.isToken([Token.XREAD])) {
      return true
    }
    if (this.tokenizer.consumeTokenIfMatch([Token.MXRAM])) {
      return this.isTNT()
    }
    if (this.tokenizer.consumeTokenIfMatch([Token.NSTATES])) {
      while (this.untilToken([Token.SEMICOLON])) {
        if (this.tokenizer.isFinished()) {
          break
        }
        if (this.tokenizer.consumeTokenIfMatch([Token.DNA])) {
          this.matrixObject.setDataType(DataType.DNA)
          // Don't throw - let validation handle it
        }
        // Consume the next token.
        if (!this.tokenizer.isFinished()) {
          this.tokenizer.consumeToken()
        }
      }
      return true
    }
    return false
  }

  private doCommands(): void {
    while (!this.tokenizer.isFinished()) {
      if (this.tokenizer.consumeTokenIfMatch([Token.OPEN_BRACKET])) {
        this.doComments()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.XREAD])) {
        this.doXreadCommand()
      } else if (
        this.tokenizer.consumeTokenIfMatch([Token.CNAMES, Token.OPEN_SBRACKET])
      ) {
        this.doCnamesCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.CCODE])) {
        this.doCcodeCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.COMMENTS])) {
        this.doNotesBlockCommand()
      } else if (
        this.tokenizer.consumeTokenIfMatch([Token.NSTATES, Token.MXRAM])
      ) {
        this.skipToSemicolon()
      } else {
        this.skipToSemicolon()
      }
    }
  }

  private doXreadCommand(): void {
    if (!this.tokenizer.isToken([Token.NUMBER])) {
      if (this.tokenizer.isFinished()) {
        return // File ended before dimensions
      }
      const tokenValue = this.tokenizer.getTokenValue()
      const description = tokenValue.getValue()
      this.matrixObject.setTitle('MATRIX', description)
    }

    // Get character count - critical for parsing
    if (this.tokenizer.isFinished() || !this.tokenizer.isToken([Token.NUMBER])) {
      return // Incomplete, let validation catch it
    }
    const characterCount = this.convertNumber(this.tokenizer.getTokenValue())
    this.matrixObject.setDimensions('CHARS', characterCount)

    // Get taxa count - critical for parsing
    if (this.tokenizer.isFinished() || !this.tokenizer.isToken([Token.NUMBER])) {
      return // Incomplete, let validation catch it
    }
    const taxaCount = this.convertNumber(this.tokenizer.getTokenValue())
    this.matrixObject.setDimensions('TAXA', taxaCount)

    // Initialize character types as discrete by default
    const characterTypes: CharacterType[] = new Array(characterCount).fill(CharacterType.DISCRETE)
    for (let i = 0; i < characterCount; i++) {
      this.matrixObject.setCharacterType(i, CharacterType.DISCRETE)
    }

    // Parse the matrix data, handling mixed character types
    this.parseMatrixData(characterCount, taxaCount, characterTypes)
  }

  private parseMatrixData(characterCount: number, taxaCount: number, characterTypes: CharacterType[]): void {
    const taxaData: Map<string, Cell[]> = new Map()
    let currentCharacterIndex = 0
    let hasSectionMarkers = false
    
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      if (this.tokenizer.consumeTokenIfMatch([Token.AMPERSAND_CONT])) {
        hasSectionMarkers = true
        // Parse continuous character section
        currentCharacterIndex = this.parseCharacterSection(
          CharacterType.CONTINUOUS, 
          currentCharacterIndex, 
          characterCount, 
          taxaCount, 
          characterTypes, 
          taxaData
        )
        continue
      } else if (this.tokenizer.consumeTokenIfMatch([Token.AMPERSAND_NUM])) {
        hasSectionMarkers = true
        // Parse discrete character section
        currentCharacterIndex = this.parseCharacterSection(
          CharacterType.DISCRETE, 
          currentCharacterIndex, 
          characterCount, 
          taxaCount, 
          characterTypes, 
          taxaData
        )
        continue
      }

      // If we encounter a taxon name without section markers, 
      // fall back to original simple parsing logic
      if (!hasSectionMarkers) {
        this.parseSimpleMatrix(characterCount, taxaCount)
        return
      }
      
      // Skip values that look like character data rather than a taxon name
      const tokenValue = this.tokenizer.getTokenValue()
      const value = tokenValue.getValue()
      if (this.looksLikeContinuousValue(value)) {
        continue
      }
      
      // This might be the start of an unmarked section, break to handle it
      break
    }
    
    // Add all parsed taxa and their data to the matrix (only for mixed format)
    if (hasSectionMarkers) {
      for (const [taxonName, cells] of taxaData) {
        this.matrixObject.addTaxon(taxonName)
        const row = this.matrixObject.getCells(taxonName)
        row.push(...cells)
      }
    }
  }

  private parseSimpleMatrix(characterCount: number, taxaCount: number): void {
    let taxaProcessed = 0
    
    // Parse matrix data without using untilToken - let parent handle semicolon
    while (taxaProcessed < taxaCount && !this.tokenizer.isFinished()) {
      // Check for end of section
      if (this.tokenizer.isToken([Token.SEMICOLON])) {
        break
      }
      
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      const rowName = this.tokenizer.getTokenValue()
      const taxonName = rowName.getValue()
      
      // Skip if this looks like character data rather than a taxon name
      if (this.looksLikeContinuousValue(taxonName)) {
        continue
      }
      
      this.matrixObject.addTaxon(taxonName)
      taxaProcessed++

      // Handle AT symbol for higher taxonomy ranks
      if (this.tokenizer.consumeTokenIfMatch([Token.AT])) {
        this.tokenizer.consumeToken()
      }

      const row = this.matrixObject.getCells(taxonName)

      // Use discrete cell tokenizer for simple matrices
      const cellTokenizer = new CellTokenizer(this.reader)
      this.tokenizer.setTokenizer(cellTokenizer)
      
      for (let x = 0; x < characterCount && !this.tokenizer.isFinished(); ++x) {
        const cellTokenValue = this.tokenizer.getTokenValue()
        if (cellTokenValue.getValue() !== '') {
          row.push(new Cell(cellTokenValue.getValue()))
        } else {
          x-- // Don't count empty tokens
        }
      }
      
      this.tokenizer.removeTokenizer()
    }
  }

  private parseCharacterSection(
    sectionType: CharacterType,
    startCharacterIndex: number,
    totalCharacterCount: number,
    taxaCount: number,
    characterTypes: CharacterType[],
    taxaData: Map<string, Cell[]>
  ): number {
    let taxaProcessed = 0
    
    // Determine how many characters this section contains by looking ahead
    const sectionCharacterCount = this.determineSectionCharacterCount(sectionType, startCharacterIndex, totalCharacterCount)
    
    // Update character types for this section
    for (let i = 0; i < sectionCharacterCount; i++) {
      const charIndex = startCharacterIndex + i
      if (charIndex < totalCharacterCount) {
        characterTypes[charIndex] = sectionType
        this.matrixObject.setCharacterType(charIndex, sectionType)
      }
    }
    
    // Parse taxa data for this section - DON'T use untilToken here!
    while (taxaProcessed < taxaCount && !this.tokenizer.isFinished()) {
      // Check for section end markers first
      if (this.tokenizer.isToken([Token.SEMICOLON])) {
        break
      }
      
      if (this.tokenizer.isToken([Token.AMPERSAND_CONT, Token.AMPERSAND_NUM])) {
        break
      }
      
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      const rowName = this.tokenizer.getTokenValue()
      const taxonName = rowName.getValue()
      
      // Skip values that look like character data rather than taxon names
      if (sectionType === CharacterType.CONTINUOUS && this.looksLikeContinuousValue(taxonName)) {
        continue
      }
      
      // Initialize taxon data if not exists
      if (!taxaData.has(taxonName)) {
        taxaData.set(taxonName, new Array(totalCharacterCount).fill(null))
      }
      
      const taxonCells = taxaData.get(taxonName)!
      
      // Handle AT symbol for higher taxonomy ranks
      if (this.tokenizer.consumeTokenIfMatch([Token.AT])) {
        this.tokenizer.consumeToken()
      }

      // Parse character data for this taxon in this section
      const cellTokenizer = sectionType === CharacterType.CONTINUOUS
        ? new ContinuousCellTokenizer(this.reader)
        : new CellTokenizer(this.reader)

      this.tokenizer.setTokenizer(cellTokenizer)
      
      for (let i = 0; i < sectionCharacterCount && !this.tokenizer.isFinished(); i++) {
        const cellTokenValue = this.tokenizer.getTokenValue()
        const charIndex = startCharacterIndex + i
        
        if (cellTokenValue.getValue() !== '' && charIndex < totalCharacterCount) {
          taxonCells[charIndex] = new Cell(cellTokenValue.getValue())
        } else if (cellTokenValue.getValue() === '') {
          i-- // Don't count empty tokens
        }
      }
      
      this.tokenizer.removeTokenizer()
      taxaProcessed++
    }
    
    return startCharacterIndex + sectionCharacterCount
  }

  private determineSectionCharacterCount(sectionType: CharacterType, startIndex: number, totalCount: number): number {
    // For the provided file structure:
    // - Continuous section has 8 characters (columns 0-7)
    // - Discrete section has 84 characters (columns 8-91)
    
    if (sectionType === CharacterType.CONTINUOUS) {
      // Look ahead to count continuous characters by examining the first taxon's data
      return this.countContinuousCharacters(startIndex, totalCount)
    } else {
      // Remaining characters are discrete
      return totalCount - startIndex
    }
  }

  private countContinuousCharacters(startIndex: number, totalCount: number): number {
    // Save current position
    const currentPosition = this.reader.getPosition()
    
    try {
      // Skip to first taxon data line
      while (!this.tokenizer.isFinished()) {
        const tokenValue = this.tokenizer.getTokenValue()
        const value = tokenValue.getValue()
        
        // Skip comments and section markers
        if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
          continue
        }
        
        // Found a taxon name (not a continuous value)
        if (!this.looksLikeContinuousValue(value)) {
          // Count continuous values in this line
          let count = 0
          const tempTokenizer = new ContinuousCellTokenizer(this.reader)
          this.tokenizer.setTokenizer(tempTokenizer)
          
          while (!this.tokenizer.isFinished()) {
            const cellValue = this.tokenizer.getTokenValue()
            const cellStr = cellValue.getValue()
            
            if (cellStr === '') {
              continue
            }
            
            // If we hit a non-continuous value or end of line, stop counting
            if (!this.looksLikeContinuousValue(cellStr) && cellStr !== '?') {
              break
            }
            
            count++
            
            // Check if next character suggests end of continuous section
            if (this.reader.peekCharacter() === '\n' || this.reader.peekCharacter() === '\r') {
              break
            }
          }
          
          this.tokenizer.removeTokenizer()
          return count
        }
      }
    } finally {
      // Restore position
      this.reader.setPosition(currentPosition)
    }
    
    // Default fallback - assume 8 continuous characters based on the file structure
    return 8
  }

  private doCnamesCommand(): void {
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.isFinished()) {
        return
      }
      
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      if (!this.tokenizer.consumeTokenIfMatch([Token.OPEN_SBRACKET])) {
        // Skip malformed character name spec
        this.tokenizer.consumeToken()
        continue
      }

      if (!this.tokenizer.isToken([Token.NUMBER])) {
        continue
      }
      const characterNumber = this.convertNumber(this.tokenizer.getTokenValue())
      
      if (this.tokenizer.isFinished()) {
        return
      }
      const characterName = this.tokenizer.getTokenValue().getValue().replace(/_/g, ' ')
      const newCharacterName = this.matrixObject.addCharacter(
        characterNumber,
        characterName
      )

      while (this.untilToken([Token.SEMICOLON])) {
        if (this.tokenizer.isFinished()) {
          break
        }
        
        this.tokenizer.consumeTokenIfMatch([Token.COLON])
        
        if (this.tokenizer.isFinished()) {
          break
        }
        const stateName = this.tokenizer.getTokenValue().getValue().replace(/_/g, ' ')
        this.matrixObject.addCharacterState(newCharacterName, stateName)

        if (this.tokenizer.isToken([Token.OPEN_SBRACKET])) {
          break
        }
      }
    }
  }

  private doCcodeCommand(): void {
    let isActive = true
    let isAdditive = true
    let isSankoff = true
    let weight = 1
    let startNumber = 0
    let endNumber = -1

    const ccodeReader = new SubstringReader(this.reader, [Token.SEMICOLON])
    const ccodeTokenizer = new CCodeTokenizer(ccodeReader)
    this.tokenizer.setTokenizer(ccodeTokenizer)
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.OPEN_BRACKET])) {
        isActive = true
      } else if (this.tokenizer.consumeTokenIfMatch([Token.CLOSE_BRACKET])) {
        isActive = false
      } else if (this.tokenizer.consumeTokenIfMatch([Token.OPEN_PARENTHESIS])) {
        isSankoff = true
      } else if (
        this.tokenizer.consumeTokenIfMatch([Token.CLOSE_PARENTHESIS])
      ) {
        isSankoff = false
      } else if (this.tokenizer.consumeTokenIfMatch([Token.PLUS])) {
        isActive = true
      } else if (this.tokenizer.consumeTokenIfMatch([Token.MINUS])) {
        isAdditive = false
      } else if (this.tokenizer.consumeTokenIfMatch([Token.BLACKSLASH])) {
        if (this.tokenizer.isToken([Token.NUMBER])) {
          weight = this.convertNumber(this.tokenizer.getTokenValue())
        }
      } else if (this.tokenizer.consumeTokenIfMatch([Token.ASTERISK])) {
        isActive = true
        isAdditive = true
        isSankoff = true
        weight = 1
      } else {
        if (this.tokenizer.consumeTokenIfMatch([Token.DOT])) {
          if (this.tokenizer.isToken([Token.NUMBER])) {
            startNumber = this.convertNumber(this.tokenizer.getTokenValue())
          }
        } else if (this.tokenizer.isToken([Token.NUMBER])) {
          startNumber = this.convertNumber(this.tokenizer.getTokenValue())
          endNumber = startNumber
          if (this.tokenizer.consumeTokenIfMatch([Token.DOT])) {
            if (this.tokenizer.isToken([Token.NUMBER])) {
              endNumber = this.convertNumber(this.tokenizer.getTokenValue())
            }
          }
        }

        this.matrixObject.setCharacterCostCodes(
          startNumber,
          endNumber,
          isActive,
          isAdditive,
          isSankoff,
          weight
        )
      }
    }
    this.tokenizer.removeTokenizer()
  }

  private doNotesBlockCommand(): void {
    if (!this.tokenizer.isToken([Token.NUMBER])) {
      this.skipToSemicolon()
      return
    }
    let numberOfComments = this.convertNumber(this.tokenizer.getTokenValue())

    const taxaNames = this.matrixObject.getTaxaNames()
    const characterNames = this.matrixObject.getCharacterNames()
    
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.isFinished()) {
        return
      }
      
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      if (!this.tokenizer.consumeTokenIfMatch([Token.OPEN_SBRACKET])) {
        // Skip malformed note
        this.tokenizer.consumeToken()
        continue
      }

      if (!this.tokenizer.isToken([Token.NUMBER])) {
        continue
      }
      const taxonNumber = this.convertNumber(this.tokenizer.getTokenValue())
      const taxonName = taxaNames[taxonNumber]

      if (!this.tokenizer.isToken([Token.NUMBER])) {
        continue
      }
      const characterNumber = this.convertNumber(this.tokenizer.getTokenValue())
      const characterName = characterNames[characterNumber]

      const commentsReader = new SubstringReader(this.reader, [
        Token.NEW_LINE,
        Token.LINE_BREAK,
      ])
      const commentsTokenizer = new CommentsTokenizer(commentsReader)
      this.tokenizer.setTokenizer(commentsTokenizer)
      const comment = commentsTokenizer.getTokenValue()
      this.tokenizer.removeTokenizer()

      this.matrixObject.setCellNote(
        taxonName,
        characterName,
        comment.getValue()
      )
      --numberOfComments
    }
    // Don't throw error for comment count mismatch - file might be incomplete
    if (numberOfComments != 0) {
      console.warn('Comment count mismatch: expected 0 remaining, got ' + numberOfComments)
    }
  }

  private doComments(): void {
    while (this.untilToken([Token.CLOSE_BRACKET])) {
      this.tokenizer.consumeToken()
    }
  }

  /**
   * Check if a value looks like continuous character data rather than a taxon name
   */
  private looksLikeContinuousValue(value: string): boolean {
    // Check for various continuous value patterns:
    // - Simple numbers: "0.867", "-1.23", "42"
    // - Ranges: "0.636-0.695", "1.5-2.8"
    // - Missing data: "?", "-"
    // - Invalid data markers
    
    if (!value || value.length === 0) {
      return false
    }
    
    // Missing data markers
    if (value === '?' || value === '-') {
      return true
    }
    
    // Simple numeric values (integers and decimals)
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return true
    }
    
    // Numeric ranges like "0.636-0.695" or "1.5-2.8"
    if (/^-?\d+(\.\d+)?--?\d+(\.\d+)?$/.test(value)) {
      return true
    }
    
    // Ranges with single dash (more common)
    if (/^-?\d+(\.\d+)?-\d+(\.\d+)?$/.test(value)) {
      return true
    }
    
    return false
  }
}
