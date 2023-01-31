import { AbstractParser } from './AbstractParser'
import { CellTokenizer } from './CellTokenizer'
import { CharacterOrderingTokenizer } from './CharacterOrderingTokenizer'
import { ContinuousCellTokenizer } from './ContinuousCellTokenizer'
import { Cell, CharacterOrdering, type MatrixObject } from './MatrixObject'
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

  public isNexus() {
    while (this.tokenizer.consumeTokenIfMatch([Token.COMMENT]));
    return this.tokenizer.isToken([Token.NEXUS])
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
    this.tokenizer.assertToken(Token.SEMICOLON)

    while (this.untilToken([Token.END, Token.ENDBLOCK])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.TITLE])) {
        this.doTitleCommand('TAXA')
      } else if (this.tokenizer.consumeTokenIfMatch([Token.DIMENSIONS])) {
        this.doDimensionCommand()
      } else if (this.tokenizer.consumeTokenIfMatch([Token.TAXLABELS])) {
        this.doTaxaLabelsCommand()
      } else {
        throw new Error(`Invalid Token in TAXA block`)
      }
    }

    this.tokenizer.assertToken(Token.SEMICOLON)
  }

  private doCharactersBlock(): void {
    this.tokenizer.assertToken(Token.SEMICOLON)

    while (this.untilToken([Token.END, Token.ENDBLOCK])) {
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
        throw new Error(`Invalid Token in Characters block`)
      }
    }

    this.tokenizer.assertToken(Token.SEMICOLON)
  }

  private doDataBlock(): void {
    this.tokenizer.assertToken(Token.SEMICOLON)

    while (this.untilToken([Token.END, Token.ENDBLOCK])) {
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
        throw new Error(`Invalid Token in data block`)
      }
    }

    this.tokenizer.assertToken(Token.SEMICOLON)
  }

  private doAssumptionsBlock(): void {
    this.tokenizer.assertToken(Token.SEMICOLON)
    while (this.untilToken([Token.END, Token.ENDBLOCK])) {
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
    this.tokenizer.assertToken(Token.SEMICOLON)
  }

  private doNotesBlock(): void {
    this.tokenizer.assertToken(Token.SEMICOLON)
    const taxaNames = this.matrixObject.getTaxaNames()
    const characterNames = this.matrixObject.getCharacterNames()
    while (this.untilToken([Token.END, Token.ENDBLOCK])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      if (this.tokenizer.consumeTokenIfMatch([Token.TEXT])) {
        let taxaNumber : number | undefined = undefined
        let characterNumber : number | undefined = undefined
        let stateNumber: number | undefined = undefined
        let text: string | undefined = undefined
        while (this.untilToken([Token.SEMICOLON])) {
          if (this.tokenizer.consumeTokenIfMatch([Token.TAXON])) {
            this.tokenizer.assertToken(Token.EQUAL)
            taxaNumber = this.convertNumber(
              this.tokenizer.assertToken(Token.NUMBER)
            )
          } else if (this.tokenizer.consumeTokenIfMatch([Token.CHARACTER])) {
            this.tokenizer.assertToken(Token.EQUAL)
            characterNumber = this.convertNumber(
              this.tokenizer.assertToken(Token.NUMBER)
            )
          } else if (this.tokenizer.consumeTokenIfMatch([Token.STATE])) {
            this.tokenizer.assertToken(Token.EQUAL)
            stateNumber = this.convertNumber(
              this.tokenizer.assertToken(Token.NUMBER)
            )
          } else if (this.tokenizer.consumeTokenIfMatch([Token.TEXT])) {
            this.tokenizer.assertToken(Token.EQUAL)
            text = this.tokenizer.getTokenValue().getValue()
          } else if (this.tokenizer.consumeTokenIfMatch([Token.TAXA])) {
            this.tokenizer.assertToken(Token.EQUAL)
            // this refers to the title of the TAXA that the notes should be applied to
            // for now, let's ignore this since there is only one taxa list per Nexus file.
            // TAXA = title
            this.tokenizer.getTokenValue()
          }
        }

        if (!text) {
          throw `Text is not defined`
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
          throw 'Unknown text'
        }
      } else {
        this.skipToSemicolon()
      }
    }
    this.tokenizer.assertToken(Token.SEMICOLON)
  }

  private doUnknownBlock(): void {
    const blockName = this.tokenizer.getTokenValue().getValue()
    this.tokenizer.assertToken(Token.SEMICOLON)

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
    this.tokenizer.assertToken(Token.SEMICOLON)
  }

  private doTaxaLabelsCommand(): void {
    while (this.untilToken([Token.SEMICOLON])) {
      const taxonName = this.tokenizer.getTokenValue().getValue()
      this.matrixObject.addTaxon(taxonName)
    }
  }

  private doFormatCommand(): void {
    while (this.untilToken([Token.SEMICOLON])) {
      const parameter = this.tokenizer.getTokenValue().getValue()

      if (this.tokenizer.consumeTokenIfMatch([Token.EQUAL])) {
        const value = this.tokenizer.getTokenValue().getValue()
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
      const characterName = this.tokenizer.getTokenValue().getValue()
      this.matrixObject.addCharacter(characterNumber++, characterName)
    }
  }

  private doStateLabelsCommand(): void {
    const characterNames = this.matrixObject.getCharacterNames()
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.isToken([Token.NUMBER])) {
        const characterNumber =
          this.convertNumber(this.tokenizer.getTokenValue()) - 1
        const characterName = characterNames[characterNumber]
        while (this.untilToken([Token.COMMA])) {
          if (this.tokenizer.isToken([Token.SEMICOLON])) {
            break
          }

          const stateName = this.tokenizer.getTokenValue().getValue()
          this.matrixObject.addCharacterState(characterName, stateName)
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
        const characterNumber = this.convertNumber(
          this.tokenizer.getTokenValue()
        )
        const characterName = this.tokenizer.getTokenValue().getValue()

        // Meristic characters do not have states to just take the string as-is.
        if (this.matrixObject.isMeristic()) {
          this.matrixObject.addCharacter(characterNumber, characterName)
        } else {
          this.matrixObject.addCharacter(characterNumber, characterName)
          this.tokenizer.consumeTokenIfMatch([Token.BLACKSLASH])

          while (this.untilToken([Token.COMMA])) {
            if (this.tokenizer.isToken([Token.SEMICOLON])) {
              break
            }

            const stateName = this.tokenizer.getTokenValue().getValue()
            this.matrixObject.addCharacterState(characterName, stateName)
          }
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

      const rowName = this.tokenizer.getTokenValue().getValue()
      if (shouldAddTaxa) {
        this.matrixObject.addTaxon(rowName)
      }

      const row = this.matrixObject.getCells(rowName)
      while (row.length < characterCount) {
        const reader = new SubstringReader(this.reader, [
          Token.NEW_LINE,
          Token.LINE_BREAK,
        ])
        const cellTokenizer = this.matrixObject.isMeristic()
          ? new ContinuousCellTokenizer(reader)
          : new CellTokenizer(reader)
        while (!cellTokenizer.isFinished()) {
          const cellTokenValue = cellTokenizer.getTokenValue()
          const isUncertian =
            cellTokenValue.getToken() == Token.CELL_UNCERTAIN ? true : undefined
          row.push(new Cell(cellTokenValue.getValue(), isUncertian))
        }
      }
    }
  }

  private doDimensionCommand(): void {
    while (this.untilToken([Token.SEMICOLON])) {
      let name
      if (this.tokenizer.consumeTokenIfMatch([Token.NCHAR])) {
        name = 'CHARS'
      } else if (this.tokenizer.consumeTokenIfMatch([Token.NTAX])) {
        name = 'TAXA'
      } else {
        name = this.tokenizer.getTokenValue().getValue()
        throw `Unknown DIMENSION ${name}`
      }

      this.tokenizer.assertToken(Token.EQUAL)
      const value = this.convertNumber(this.tokenizer.assertToken(Token.NUMBER))

      this.matrixObject.setDimensions(name, value)
    }
  }

  private doTitleCommand(titleType: string): void {
    const titles: string[] = []
    while (this.untilToken([Token.SEMICOLON])) {
      titles.push(this.tokenizer.getTokenValue().getValue())
    }

    this.matrixObject.setTitle(titleType, titles.join(' '))
  }

  private doCharacterOrderingCommand(): void {
    this.tokenizer.consumeTokenIfMatch([Token.ASTERISK])
    // ordering title
    this.tokenizer.consumeToken()

    if (this.tokenizer.consumeTokenIfMatch([Token.OPEN_PARENTHESIS])) {
      // matrix name
      this.tokenizer.getTokenValue()

      this.tokenizer.assertToken(Token.EQUAL)

      const value = this.tokenizer.getTokenValue().getValue()

      this.tokenizer.assertToken(Token.CLOSE_PARENTHESIS)

      if (value != this.matrixObject.getTitle('CHARS')) {
        this.skipToSemicolon()
        return
      }
    }

    this.tokenizer.assertToken(Token.EQUAL)

    while (this.untilToken([Token.SEMICOLON])) {
      const ordering =
        this.tokenizer.getTokenValue().getValue() == 'ord'
          ? CharacterOrdering.ORDERING
          : CharacterOrdering.UNORDERING
      this.tokenizer.assertToken(Token.COLON)

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
        let firstNumber: number
        let secondNumber: number
        if (this.tokenizer.isToken([Token.NUMBER])) {
          firstNumber = this.convertNumber(this.tokenizer.getTokenValue()) - 1
          if (this.tokenizer.consumeTokenIfMatch([Token.MINUS])) {
            secondNumber =
              this.convertNumber(this.tokenizer.assertToken(Token.NUMBER)) - 1
          } else {
            secondNumber = firstNumber
          }
        } else if (this.tokenizer.consumeTokenIfMatch([Token.ALL])) {
          firstNumber = 1
          secondNumber = this.matrixObject.getCharacterCount()
        } else {
          throw new Error(
            'Unable to parse ' + this.tokenizer.getTokenValue().getToken()
          )
        }

        this.matrixObject.setCharacterOrdering(
          firstNumber,
          secondNumber,
          ordering
        )
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
