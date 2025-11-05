import { AbstractParser } from './AbstractParser'
import { CellTokenizer } from './CellTokenizer'
import { CharacterOrderingTokenizer } from './CharacterOrderingTokenizer'
import { ContinuousCellTokenizer } from './ContinuousCellTokenizer'
import { Cell, CharacterOrdering, CharacterType, type MatrixObject } from './MatrixObject'
import { NexusTokenizer } from './NexusTokenizer'
import { type Reader } from './Reader'
import { SubstringReader } from './SubstringReader'
import { Token } from './Token'

export class NexusParser extends AbstractParser {
  constructor(reader: Reader) {
    super(reader, new NexusTokenizer(reader))
  }

  override parse(): MatrixObject {
    while (this.tokenizer.consumeTokenIfMatch([Token.COMMENT]));
    this.tokenizer.consumeTokenIfMatch([Token.NEXUS])

    this.doBlock()
    return this.matrixObject
  }

  public override getFormat(): string {
    return 'NEXUS'
  }

  public isNexus() {
    while (this.tokenizer.consumeTokenIfMatch([Token.COMMENT]));
    return this.tokenizer.isToken([Token.NEXUS])
  }

  /**
   * Check if the matrix has continuous characters by checking the character parameter
   */
  private hasContinuousCharacters(): boolean {
    // Check if DATATYPE parameter is set to CONTINUOUS
    const dataType = this.matrixObject.getParameter('DATATYPE')
    return dataType && dataType.toUpperCase() === 'CONTINUOUS'
  }

  private doBlock(): void {
    while (!this.tokenizer.isFinished()) {
      if (this.tokenizer.consumeTokenIfMatch([Token.BEGIN, Token.BEGINBLOCK])) {
        this.doBeginBlock()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      } else {
        this.doImpliedBlock()
      }
    }
  }

  private doBeginBlock(): void {
    if (this.tokenizer.consumeTokenIfMatch([Token.TAXA])) {
      this.doTaxaBlock()
    } else if (this.tokenizer.consumeTokenIfMatch([Token.CHARACTERS])) {
      this.doCharactersBlock()
    } else if (this.tokenizer.consumeTokenIfMatch([Token.DATA])) {
      this.doDataBlock()
    } else if (this.tokenizer.consumeTokenIfMatch([Token.ASSUMPTIONS])) {
      this.doAssumptionsBlock()
    } else if (this.tokenizer.consumeTokenIfMatch([Token.NOTES])) {
      this.doNotesBlock()
    } else {
      this.doUnknownBlock()
    }
  }

  private doTaxaBlock(): void {
    // Consume any comments before expecting the semicolon
    while (this.tokenizer.consumeTokenIfMatch([Token.COMMENT]));
    // Make semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }

    while (this.untilToken([Token.END, Token.ENDBLOCK])) {
      // Allow file to end mid-block
      if (this.tokenizer.isFinished()) {
        return
      }
      
      if (this.tokenizer.consumeTokenIfMatch([Token.TITLE])) {
        this.doTitleCommand('TAXA')
      } else if (this.tokenizer.consumeTokenIfMatch([Token.DIMENSIONS])) {
        this.doDimensionCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.TAXLABELS])) {
        this.doTaxaLabelsCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      } else {
        // Skip unknown commands to allow validation to catch structural issues
        this.skipToSemicolon()
      }
    }

    // Make closing semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }
  }

  private doCharactersBlock(): void {
    // Consume any comments before expecting the semicolon
    while (this.tokenizer.consumeTokenIfMatch([Token.COMMENT]));
    // Make semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }

    while (this.untilToken([Token.END, Token.ENDBLOCK])) {
      // Allow file to end mid-block
      if (this.tokenizer.isFinished()) {
        return
      }
      
      if (this.tokenizer.consumeTokenIfMatch([Token.TITLE])) {
        this.doTitleCommand('CHARS')
      } else if (this.tokenizer.consumeTokenIfMatch([Token.DIMENSIONS])) {
        this.doDimensionCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.FORMAT])) {
        this.doFormatCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.CHARSTATELABELS])) {
        this.doCharacterStateLabelsCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.CHARLABELS])) {
        this.doCharLabelsCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.STATELABELS])) {
        this.doStateLabelsCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.MATRIX])) {
        this.doMatrixCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.OPTIONS])) {
        this.skipToSemicolon()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      } else if (this.tokenizer.consumeTokenIfMatch([Token.LINK])) {
        this.skipToSemicolon()
      } else {
        // Skip unknown commands to allow validation to catch structural issues
        this.skipToSemicolon()
      }
    }

    // Make closing semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }
    
    // Post-processing: Ensure all characters are set as continuous if DATATYPE=CONTINUOUS
    const dataType = this.matrixObject.getParameter('DATATYPE')
    if (dataType && dataType.toUpperCase() === 'CONTINUOUS') {
      const characters = this.matrixObject.getCharacters()
      for (let i = 0; i < characters.length; i++) {
        this.matrixObject.setCharacterType(i, CharacterType.CONTINUOUS)
      }
    }
  }

  private doDataBlock(): void {
    // Consume any comments before expecting the semicolon
    while (this.tokenizer.consumeTokenIfMatch([Token.COMMENT]));
    // Make semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }

    while (this.untilToken([Token.END, Token.ENDBLOCK])) {
      // Allow file to end mid-block
      if (this.tokenizer.isFinished()) {
        return
      }
      
      if (this.tokenizer.consumeTokenIfMatch([Token.DIMENSIONS])) {
        this.doDimensionCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.FORMAT])) {
        this.doFormatCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.CHARSTATELABELS])) {
        this.doCharacterStateLabelsCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.CHARLABELS])) {
        this.doCharLabelsCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.STATELABELS])) {
        this.doStateLabelsCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.MATRIX])) {
        this.doMatrixCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.OPTIONS])) {
        this.skipToSemicolon()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      } else if (this.tokenizer.consumeTokenIfMatch([Token.LINK])) {
        this.skipToSemicolon()
      } else {
        // Skip unknown commands to allow validation to catch structural issues
        this.skipToSemicolon()
      }
    }

    // Make closing semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }
  }

  private doAssumptionsBlock(): void {
    // Consume any comments before expecting the semicolon
    while (this.tokenizer.consumeTokenIfMatch([Token.COMMENT]));
    // Make semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }
    
    while (this.untilToken([Token.END, Token.ENDBLOCK])) {
      // Allow file to end mid-block
      if (this.tokenizer.isFinished()) {
        return
      }
      
      if (this.tokenizer.consumeTokenIfMatch([Token.OPTIONS])) {
        this.skipToSemicolon()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.TYPESET])) {
        this.doCharacterOrderingCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.USERTYPE])) {
        this.skipToSemicolon()
      } else {
        this.skipToSemicolon()
      }
    }
    
    // Make closing semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }
  }

  private doNotesBlock(): void {
    // Consume any comments before expecting the semicolon
    while (this.tokenizer.consumeTokenIfMatch([Token.COMMENT]));
    // Make semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }
    
    const taxaNames = this.matrixObject.getTaxaNames()
    const characterNames = this.matrixObject.getCharacterNames()
    
    while (this.untilToken([Token.END, Token.ENDBLOCK])) {
      // Allow file to end mid-block
      if (this.tokenizer.isFinished()) {
        return
      }
      
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      if (this.tokenizer.consumeTokenIfMatch([Token.TEXT])) {
        let taxaNumber: number | undefined = undefined
        let characterNumber: number | undefined = undefined
        let stateNumber: number | undefined = undefined
        let text: string | undefined = undefined
        while (this.untilToken([Token.SEMICOLON])) {
          // Allow file to end mid-command
          if (this.tokenizer.isFinished()) {
            break
          }
          
          if (this.tokenizer.consumeTokenIfMatch([Token.TAXON])) {
            if (this.tokenizer.consumeTokenIfMatch([Token.EQUAL]) && this.tokenizer.isToken([Token.NUMBER])) {
              taxaNumber = this.convertNumber(this.tokenizer.getTokenValue())
            }
          } else if (this.tokenizer.consumeTokenIfMatch([Token.CHARACTER])) {
            if (this.tokenizer.consumeTokenIfMatch([Token.EQUAL]) && this.tokenizer.isToken([Token.NUMBER])) {
              characterNumber = this.convertNumber(this.tokenizer.getTokenValue())
            }
          } else if (this.tokenizer.consumeTokenIfMatch([Token.STATE])) {
            if (this.tokenizer.consumeTokenIfMatch([Token.EQUAL]) && this.tokenizer.isToken([Token.NUMBER])) {
              stateNumber = this.convertNumber(this.tokenizer.getTokenValue())
            }
          } else if (this.tokenizer.consumeTokenIfMatch([Token.TEXT])) {
            if (this.tokenizer.consumeTokenIfMatch([Token.EQUAL])) {
              text = this.tokenizer.getTokenValue().getValue()
            }
          } else if (this.tokenizer.consumeTokenIfMatch([Token.TAXA])) {
            if (this.tokenizer.consumeTokenIfMatch([Token.EQUAL])) {
              // This refers to the title of the TAXA that the notes should be
              // applied to for now, let's ignore this since there is only one
              // taxa list per Nexus file. TAXA = title
              this.tokenizer.getTokenValue()
            }
          }
        }

        // Skip incomplete text notes
        if (!text) {
          continue
        }

        if (taxaNumber != undefined && characterNumber != undefined) {
          this.matrixObject.setCellNote(
            taxaNames[taxaNumber],
            characterNames[characterNumber],
            text
          )
        } else if (stateNumber != undefined && characterNumber != undefined) {
          this.matrixObject.setCharacterStateNote(
            characterNames[characterNumber],
            stateNumber,
            text
          )
        } else if (characterNumber != undefined) {
          this.matrixObject.setCharacterNote(
            characterNames[characterNumber],
            text
          )
        } else if (taxaNumber != undefined) {
          this.matrixObject.setTaxonNote(taxaNames[taxaNumber], text)
        } else {
          // Skip notes without proper context
          continue
        }
      } else {
        this.skipToSemicolon()
      }
    }
    
    // Make closing semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }
  }

  private doUnknownBlock(): void {
    const blockName = this.tokenizer.getTokenValue().getValue()
    // Consume any comments before expecting the semicolon
    while (this.tokenizer.consumeTokenIfMatch([Token.COMMENT]));
    // Make semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }

    const startPosition = this.reader.getPosition()
    let endPosition = startPosition
    while (!this.tokenizer.isFinished()) {
      endPosition = this.reader.getPosition()
      if (this.tokenizer.consumeTokenIfMatch([Token.END, Token.ENDBLOCK])) {
        break
      }
      this.tokenizer.consumeToken()
    }

    const content = this.reader
      .getContent()
      .substring(startPosition.getPosition(), endPosition.getPosition())
    this.matrixObject.addBlock(blockName, content)
    
    // Make closing semicolon optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
    }
  }

  private doTaxaLabelsCommand(): void {
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }
      const taxonName = this.tokenizer.getTokenValue().getValue() // getTokenValue() already consumes!
      this.matrixObject.addTaxon(taxonName)
    }
  }

  private doFormatCommand(): void {
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }
      const parameter = this.tokenizer.getTokenValue().getValue() // getTokenValue() already consumes!

      if (this.tokenizer.consumeTokenIfMatch([Token.EQUAL])) {
        const value = this.tokenizer.getTokenValue().getValue() // getTokenValue() already consumes!
        this.matrixObject.setCharacterParameter(parameter, value)
      } else {
        this.matrixObject.setCharacterParameter(parameter, true)
      }
    }
  }

  private doCharLabelsCommand(): void {
    let characterNumber = 0
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }
      const characterName = this.tokenizer.getTokenValue().getValue() // getTokenValue() already consumes!
      this.matrixObject.addCharacter(characterNumber++, characterName)
    }
  }

  private doStateLabelsCommand(): void {
    const characterNames = this.matrixObject.getCharacterNames()
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }
      
      if (this.tokenizer.isToken([Token.NUMBER])) {
        const characterNumber =
          this.convertNumber(this.tokenizer.getTokenValue()) - 1 // getTokenValue() already consumes!
        const characterName = characterNames[characterNumber]
        
        while (this.untilToken([Token.COMMA])) {
          if (this.tokenizer.isToken([Token.SEMICOLON])) {
            break
          }
          
          // Safety check to prevent infinite loop
          if (this.tokenizer.isFinished()) {
            break
          }

          const stateName = this.tokenizer.getTokenValue().getValue() // getTokenValue() already consumes!
          this.matrixObject.addCharacterState(characterName, stateName)
        }
      } else {
        // Consume unexpected token to prevent infinite loop
        if (!this.tokenizer.isFinished()) {
          this.tokenizer.consumeToken()
        }
      }
    }
  }

  private doCharacterStateLabelsCommand(): void {
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      if (this.tokenizer.isToken([Token.NUMBER])) {
        const characterNumber =
          this.convertNumber(this.tokenizer.getTokenValue()) - 1 // getTokenValue() already consumes!
        const characterName = this.tokenizer.getTokenValue().getValue() // getTokenValue() already consumes!

        // Meristic characters do not have states to just take the string as-is.
        if (this.matrixObject.isMeristic()) {
          this.matrixObject.addCharacter(characterNumber, characterName)
        } else {
          const newCharacterName = this.matrixObject.addCharacter(
            characterNumber,
            characterName
          )
          this.tokenizer.consumeTokenIfMatch([Token.BLACKSLASH])

          while (this.untilToken([Token.COMMA])) {
            if (this.tokenizer.isToken([Token.SEMICOLON])) {
              break
            }
            
            // Safety check to prevent infinite loop
            if (this.tokenizer.isFinished()) {
              break
            }

            const stateName = this.tokenizer.getTokenValue().getValue() // getTokenValue() already consumes!
            this.matrixObject.addCharacterState(newCharacterName, stateName)
          }
        }
      } else {
        // Consume unexpected token to prevent infinite loop
        if (!this.tokenizer.isFinished()) {
          this.tokenizer.consumeToken()
        }
      }
    }
  }

  private doMatrixCommand(): void {
    const characterCount = this.matrixObject.getCharacterCount()
    const shouldAddTaxa = !this.matrixObject.getTaxonCount()

    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      const rowName = this.tokenizer.getTokenValue().getValue() // getTokenValue() already consumes!
      
      if (shouldAddTaxa) {
        this.matrixObject.addTaxon(rowName)
      }

      const row = this.matrixObject.getCells(rowName)
      while (row.length < characterCount) {
        const reader = new SubstringReader(this.reader, [
          Token.NEW_LINE,
          Token.LINE_BREAK,
        ])
        const cellTokenizer = (this.matrixObject.isMeristic() || this.hasContinuousCharacters())
          ? new ContinuousCellTokenizer(reader)
          : new CellTokenizer(reader)
        while (row.length < characterCount) {
          const cellTokenValue = cellTokenizer.getTokenValue()

          const cell = new Cell(cellTokenValue.getValue())
          if (cellTokenValue.getToken() == Token.CELL_UNCERTAIN) {
            cell.uncertain = true
          }
          row.push(cell)
          if (cellTokenizer.isFinished()) {
            break
          }
        }
      }
    }
  }

  private doDimensionCommand(): void {
    while (this.untilToken([Token.SEMICOLON])) {
      // Allow file to end mid-command
      if (this.tokenizer.isFinished()) {
        return
      }
      
      let name
      if (this.tokenizer.consumeTokenIfMatch([Token.NCHAR])) {
        name = 'CHARS'
      } else if (this.tokenizer.consumeTokenIfMatch([Token.NTAX])) {
        name = 'TAXA'
      } else {
        // Skip unknown dimension types
        this.tokenizer.consumeToken()
        continue
      }

      // Try to get EQUAL and NUMBER, but don't crash if incomplete
      if (this.tokenizer.isFinished()) {
        return
      }
      
      if (!this.tokenizer.consumeTokenIfMatch([Token.EQUAL])) {
        continue // Missing EQUAL, skip this dimension
      }
      
      if (!this.tokenizer.isToken([Token.NUMBER])) {
        continue // Missing NUMBER, skip this dimension
      }
      
      const value = this.convertNumber(this.tokenizer.getTokenValue())
      this.matrixObject.setDimensions(name, value)
    }
  }

  private doTitleCommand(titleType: string): void {
    const titles: string[] = []
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }
      titles.push(this.tokenizer.getTokenValue().getValue()) // getTokenValue() already consumes!
    }

    this.matrixObject.setTitle(titleType, titles.join(' '))
  }

  private doCharacterOrderingCommand(): void {
    this.tokenizer.consumeTokenIfMatch([Token.ASTERISK])
    
    // ordering title - make optional for incomplete files
    if (!this.tokenizer.isFinished()) {
      this.tokenizer.consumeToken()
    }

    if (this.tokenizer.consumeTokenIfMatch([Token.OPEN_PARENTHESIS])) {
      // matrix name
      if (this.tokenizer.isFinished()) {
        return
      }
      this.tokenizer.getTokenValue()

      if (!this.tokenizer.consumeTokenIfMatch([Token.EQUAL])) {
        this.skipToSemicolon()
        return
      }

      if (this.tokenizer.isFinished()) {
        return
      }
      const value = this.tokenizer.getTokenValue().getValue()

      if (!this.tokenizer.consumeTokenIfMatch([Token.CLOSE_PARENTHESIS])) {
        this.skipToSemicolon()
        return
      }

      if (value != this.matrixObject.getTitle('CHARS')) {
        this.skipToSemicolon()
        return
      }
    }

    if (!this.tokenizer.consumeTokenIfMatch([Token.EQUAL])) {
      this.skipToSemicolon()
      return
    }

    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.isFinished()) {
        return
      }
      
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }
      
      const ordering =
        this.tokenizer.getTokenValue().getValue() == 'ord' // getTokenValue() already consumes!
          ? CharacterOrdering.ORDERING
          : CharacterOrdering.UNORDERING
      
      if (!this.tokenizer.consumeTokenIfMatch([Token.COLON])) {
        continue // Missing colon, skip this ordering spec
      }

      const orderingReader = new SubstringReader(this.reader, [
        Token.COMMA,
        Token.SEMICOLON,
      ])
      const orderingTokenizer = new CharacterOrderingTokenizer(orderingReader)
      this.tokenizer.setTokenizer(orderingTokenizer)
      while (
        !this.tokenizer.isFinished() &&
        !this.tokenizer.isToken([Token.SEMICOLON])
      ) {
        if (this.tokenizer.consumeTokenIfMatch([Token.COMMA])) {
          break
        }
        let start: number
        let end: number
        let stride: number = 1
        if (this.tokenizer.isToken([Token.NUMBER])) {
          start = this.convertNumber(this.tokenizer.getTokenValue()) - 1
          end = start
          if (this.tokenizer.consumeTokenIfMatch([Token.MINUS])) {
            if (this.tokenizer.isToken([Token.NUMBER])) {
              end = this.convertNumber(this.tokenizer.getTokenValue()) - 1
            } else if (this.tokenizer.consumeTokenIfMatch([Token.DOT])) {
              end = this.matrixObject.getCharacterCount() - 1
            } else {
              // Skip malformed range spec
              continue
            }
          }
        } else if (this.tokenizer.consumeTokenIfMatch([Token.ALL])) {
          start = 0
          end = this.matrixObject.getCharacterCount()
        } else {
          // Skip malformed ordering spec
          continue
        }

        if (this.tokenizer.consumeTokenIfMatch([Token.FORWARDSLASH])) {
          if (this.tokenizer.isToken([Token.NUMBER])) {
            stride = this.convertNumber(this.tokenizer.getTokenValue())
          }
        }

        this.matrixObject.setCharacterOrdering(start, end, ordering, stride)
      }
      this.tokenizer.removeTokenizer()
    }
  }

  private doImpliedBlock(): void {
    if (this.tokenizer.consumeTokenIfMatch([Token.STATELABELS])) {
      this.doStateLabelsCommand()
    } else if (this.tokenizer.consumeTokenIfMatch([Token.MATRIX])) {
      this.doMatrixCommand()
    } else if (this.tokenizer.consumeTokenIfMatch([Token.LOG])) {
      this.skipToSemicolon()
    }
    this.tokenizer.consumeTokenIfMatch([Token.END])
    this.tokenizer.consumeTokenIfMatch([Token.SEMICOLON])
  }
}
