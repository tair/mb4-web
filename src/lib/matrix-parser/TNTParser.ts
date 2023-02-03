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
        if (this.tokenizer.consumeTokenIfMatch([Token.DNA])) {
          this.matrixObject.setDataType(DataType.DNA)
          throw new Error('DNA TNT files are not supported')
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
      const tokenValue = this.tokenizer.getTokenValue()
      const description = tokenValue.getValue()
      this.matrixObject.setTitle('MATRIX', description)
    }

    const characterCount = this.convertNumber(
      this.tokenizer.assertToken(Token.NUMBER)
    )
    this.matrixObject.setDimensions('CHARS', characterCount)

    const taxaCount = this.convertNumber(
      this.tokenizer.assertToken(Token.NUMBER)
    )
    this.matrixObject.setDimensions('TAXA', taxaCount)

    let characterType = CharacterType.DISCRETE
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      if (
        this.tokenizer.consumeTokenIfMatch([Token.AMPERSAND]) &&
        this.tokenizer.isToken([Token.COMMENT])
      ) {
        const characterTokenValue = this.tokenizer.getTokenValue().getValue()
        if (
          characterTokenValue == Token.CONT ||
          characterTokenValue == Token.CONTINUOUS
        ) {
          characterType = CharacterType.CONTINUOUS
        } else if (
          characterTokenValue == Token.NUM ||
          characterTokenValue == Token.NUMERIC
        ) {
          characterType = CharacterType.DISCRETE
        } else {
          throw new Error(`Invalid TOKEN for character type: ${characterType}`)
        }
        continue
      }

      const rowName = this.tokenizer.getTokenValue()
      this.matrixObject.addTaxon(rowName.getValue())

      // For TNT files, it is possible to have an AT symbol to indicate higher
      // taxonomy ranks. This is ignored by the parse so we just get value of
      // discard it.
      if (this.tokenizer.consumeTokenIfMatch([Token.AT])) {
        this.tokenizer.consumeToken()
      }

      const row = this.matrixObject.getCells(rowName.getValue())

      const cellTokenizer =
        characterType == CharacterType.CONTINUOUS
          ? new ContinuousCellTokenizer(this.reader)
          : new CellTokenizer(this.reader)
      this.tokenizer.setTokenizer(cellTokenizer)
      for (let x = 0; x < characterCount && !this.tokenizer.isFinished(); ++x) {
        const cellTokenValue = this.tokenizer.getTokenValue()
        row.push(new Cell(cellTokenValue.getValue()))
      }
      this.tokenizer.removeTokenizer()
    }
  }

  private doCnamesCommand(): void {
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      this.tokenizer.assertToken(Token.OPEN_SBRACKET)

      const characterNumber = this.convertNumber(
        this.tokenizer.assertToken(Token.NUMBER)
      )
      const characterName = this.tokenizer.getTokenValue().getValue()
      this.matrixObject.addCharacter(characterNumber, characterName)

      while (this.untilToken([Token.SEMICOLON])) {
        this.tokenizer.consumeTokenIfMatch([Token.COLON])
        const stateName = this.tokenizer.getTokenValue().getValue()
        this.matrixObject.addCharacterState(characterName, stateName)

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
        weight = this.convertNumber(this.tokenizer.assertToken(Token.NUMBER))
      } else if (this.tokenizer.consumeTokenIfMatch([Token.ASTERISK])) {
        isActive = true
        isAdditive = true
        isSankoff = true
        weight = 1
      } else {
        if (this.tokenizer.consumeTokenIfMatch([Token.DOT])) {
          startNumber = this.convertNumber(
            this.tokenizer.assertToken(Token.NUMBER)
          )
        } else if (this.tokenizer.isToken([Token.NUMBER])) {
          startNumber = this.convertNumber(this.tokenizer.getTokenValue())
          endNumber = startNumber
          if (this.tokenizer.consumeTokenIfMatch([Token.DOT])) {
            endNumber = this.convertNumber(
              this.tokenizer.assertToken(Token.NUMBER)
            )
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
    let numberOfComments = this.convertNumber(
      this.tokenizer.assertToken(Token.NUMBER)
    )

    const taxaNames = this.matrixObject.getTaxaNames()
    const characterNames = this.matrixObject.getCharacterNames()
    while (this.untilToken([Token.SEMICOLON])) {
      if (this.tokenizer.consumeTokenIfMatch([Token.COMMENT])) {
        continue
      }

      this.tokenizer.assertToken(Token.OPEN_SBRACKET)

      const taxonNumber = this.convertNumber(
        this.tokenizer.assertToken(Token.NUMBER)
      )
      const taxonName = taxaNames[taxonNumber]

      const characterNumber = this.convertNumber(
        this.tokenizer.assertToken(Token.NUMBER)
      )
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
    if (numberOfComments != 0) {
      throw new Error('Incorrect number of comments ' + numberOfComments)
    }
  }

  private doComments(): void {
    while (this.untilToken([Token.CLOSE_BRACKET])) {
      this.tokenizer.consumeToken()
    }
  }
}
