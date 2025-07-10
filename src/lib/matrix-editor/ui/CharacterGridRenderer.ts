import { Character } from '../data/Characters'
import { MatrixModel } from '../MatrixModel'
import { ImageRenderer } from './ImageRenderer'
import * as mb from '../mb'

/**
 * The abstract class that defines how cells are rendered.
 * @param matrixModel The matrix model
 * @param readonly Whether the rows are readonly
 */
export abstract class CharacterGridRenderer {
  /**
   * The maximum limit of the character name's.
   */
  protected static MAXIMUM_CHARACTER_NAME_LIMIT: number = 225

  protected matrixModel: MatrixModel
  protected readonly: boolean

  constructor(matrixModel: MatrixModel, readonly: boolean) {
    this.matrixModel = matrixModel
    this.readonly = readonly
  }

  /**
   * Resets the matrix model for the render
   */
  setMatrixModel(matrixModel: MatrixModel) {
    this.matrixModel = matrixModel
  }

  /**
   * Whether this renderer should render read only rows
   */
  setReadOnly(b: boolean) {
    this.readonly = b
  }

  /**
   * Sets an HTML string representing the cell.
   * @return tr
   */
  abstract renderRow(character: Character): HTMLElement

  /**
   * @param character the data associated with the matrix.
   * @return The HTML content of the character states row
   */
  protected static characterStatesHtmlContent(character: Character): string {
    const stateNames: string[] = []
    const characterStates = character.getStates()
    for (let x = 0; x < characterStates.length; x++) {
      stateNames.push(
        '(' +
          characterStates[x].getNumber() +
          ') ' +
          mb.htmlEscape(characterStates[x].getName())
      )
    }
    return stateNames.join('<br/>')
  }
}

/**
 * The class that renders the detailed character grid
 * @param matrixModel The matrix model
 * @param readonly Whether the rows are readonly
 */
export class CharacterDetailedGridRenderer extends CharacterGridRenderer {
  constructor(matrixModel: MatrixModel, readonly: boolean) {
    super(matrixModel, readonly)
  }

  override renderRow(character: Character) {
    const row = document.createElement('tr')
    row.dataset['characterId'] = String(character.getId())

    const userPreferences = this.matrixModel.getUserPreferences()
    const characterNumberElement = document.createElement('td')
    characterNumberElement.textContent = String(
      character.getNumber() - userPreferences.getDefaultNumberingMode()
    )
    row.appendChild(characterNumberElement)
    const characterNameNotesElement = document.createElement('td')
    characterNameNotesElement.innerHTML =
      CharacterDetailedGridRenderer.characterNameHtmlContent(character)
    if (!this.readonly) {
      const removeSpan = document.createElement('span')
      removeSpan.classList.add('remove')
      characterNameNotesElement.appendChild(removeSpan)
    }
    row.appendChild(characterNameNotesElement)
    const characterStatesElement = document.createElement('td')
    characterStatesElement.innerHTML =
      CharacterGridRenderer.characterStatesHtmlContent(character)
    row.appendChild(characterStatesElement)
    const images = new ImageRenderer('C')
    images.setReadOnly(this.readonly)
    const characterMedia = character.getMedia()
    for (let x = 0, l = characterMedia.length; x < l; x++) {
      const characterMedium = characterMedia[x]
      const tiny = characterMedium.getTiny()
      if (tiny) {
        images.addImage(characterMedium.getId(), tiny['url'])
      }
    }
    const characterMediaElement = document.createElement('td')
    images.render(characterMediaElement)
    row.appendChild(characterMediaElement)
    return row
  }

  /**
   * @param character the data associated with the matrix.
   * @return The HTML content of the character name/notes row
   */
  protected static characterNameHtmlContent(character: Character): string {
    const truncatedCharacterName = mb.truncateString(
      mb.htmlEscape(character.getName()),
      CharacterGridRenderer.MAXIMUM_CHARACTER_NAME_LIMIT
    )
    return (
      '<div class="name">' +
      '<b>' +
      truncatedCharacterName +
      '</b>' +
      '<p>Notes:</p><i>' +
      mb.truncateString(
        mb.htmlEscapeWithLineBreaks(character.getDescription()),
        900
      ) +
      '</i>' +
      '</div>'
    )
  }
}

/**
 * The class that renders the detailed character grid
 * @param matrixModel The matrix model
 * @param readonly Whether the rows are readonly
 */
export class CharacterMinimalGridRenderer extends CharacterGridRenderer {
  constructor(matrixModel: MatrixModel, readonly: boolean) {
    super(matrixModel, readonly)
  }

  override renderRow(character: Character) {
    const row = document.createElement('tr')
    row.dataset['characterId'] = String(character.getId())

    const userPreferences = this.matrixModel.getUserPreferences()
    const characterNumberElement = document.createElement('td')
    characterNumberElement.textContent = String(
      character.getNumber() - userPreferences.getDefaultNumberingMode()
    )
    row.appendChild(characterNumberElement)
    const characterNameNotesElement = document.createElement('td')
    characterNameNotesElement.innerHTML =
      CharacterMinimalGridRenderer.characterNameHtmlContent(character)
    if (!this.readonly) {
      const removeSpan = document.createElement('span')
      removeSpan.classList.add('remove')
      characterNameNotesElement.appendChild(removeSpan)
    }
    row.appendChild(characterNameNotesElement)
    const characterStatesElement = document.createElement('td')
    characterStatesElement.innerHTML =
      CharacterGridRenderer.characterStatesHtmlContent(character)
    row.appendChild(characterStatesElement)
    const characterMediaElement = document.createElement('td')
    const characterMedia = character.getMedia()
    characterMediaElement.textContent = String(characterMedia.length)
    row.appendChild(characterMediaElement)
    return row
  }

  /**
   * @param character the data associated with the matrix.
   * @return The HTML content of the character name/notes row
   */
  protected static characterNameHtmlContent(character: Character): string {
    const truncatedCharacterName = mb.truncateString(
      mb.htmlEscape(character.getName()),
      CharacterGridRenderer.MAXIMUM_CHARACTER_NAME_LIMIT
    )
    return (
      '<div class="name">' + '<b>' + truncatedCharacterName + '</b>' + '</div>'
    )
  }
}
