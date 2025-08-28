import { CharacterRules } from '../data/CharacterRules'
import { Character } from '../data/Characters'
import { UserPreferences } from '../data/ProjectProperties'
import { MatrixModel } from '../MatrixModel'
import * as mb from '../mb'
import './CellsContent'
import './CellsContent'

/**
 * The interface that defines how character table elements are rendered.
 */
export abstract class CharacterRenderer {
  protected characterRules: CharacterRules
  protected userPreferences: UserPreferences
  protected shouldDisplayWarnings: boolean = true
  protected matrixModel: MatrixModel

  /**
   * Sets the character rules
   * @param characterRules The characters' rules
   */
  setCharacterRules(characterRules: CharacterRules) {
    this.characterRules = characterRules
  }

  /**
   * Sets the character preferences which are based from the user's preferences. Needed to determine the character name
   * display.
   * @param userPreferences the new one
   */
  setCharacterPreferences(userPreferences: UserPreferences) {
    this.userPreferences = userPreferences
  }

  /**
   * Sets whether we should display warnings
   * @param shouldDisplayWarnings Whether should we display warnings
   */
  setShouldDisplayWarnings(shouldDisplayWarnings: boolean) {
    this.shouldDisplayWarnings = shouldDisplayWarnings
  }

  /**
   * Sets the matrix model for accessing cell data
   * @param matrixModel The matrix model
   */
  setMatrixModel(matrixModel: MatrixModel) {
    this.matrixModel = matrixModel
  }

  /**
   * Checks if any taxon has media for the given character
   * @param characterId The character ID to check
   * @return true if any taxon has media for this character
   */
  protected hasAnyTaxonMediaForCharacter(characterId: number): boolean {
    if (!this.matrixModel) {
      return false
    }

    const taxa = this.matrixModel.getTaxa()
    const cells = this.matrixModel.getCells()
    
    for (const taxon of taxa.getAll()) {
      const cellInfo = cells.getCellInfo(taxon.getId(), characterId)
      if (cellInfo.getMedia().length > 0) {
        return true
      }
    }
    
    return false
  }

  /**
   * Returns an HTML string representing an empty character.
   */
  createEmptyCharacter(): Element {
    const th = document.createElement('th')
    th.classList.add('empty')
    th.innerHTML = '&nbsp;'
    return th
  }

  /**
   * Returns an HTML string representing the character header.
   */
  abstract createCharacter(characterData: Character): Element

  /**
   * Returns the CSS class for this render.
   * @return css class name
   */
  abstract getClass(): string | null

  /**
   * Character Name + Number HTML
   * @param output The output of the inputted string
   * @param data object information
   */
  protected static addLabels(output: string, data: ContentData): string {
    if (data.hasRules) {
      output += ' <span class="characterModifier">(R)</span>'
    }
    if (data.hasParentRules) {
      output += ' <span class="characterModifier">(r)</span>'
    }
    if (data.hasWarnings) {
      output = '<span class="characterModifier">(!)</span>' + output
    }
    // Add media available indicator
    if (data.hasMediaAvailable) {
      output += '<br/><span class="media-available">media available</span>'
    }
    return output
  }
}

/**
 * The render for Character Numbers and Name.
 */
export class CharacterNameNumberRenderer extends CharacterRenderer {
  constructor() {
    super()
  }

  override createCharacter(character: Character) {
    const id = character.getId()
    const th = document.createElement('th')
    th.dataset['characterId'] = String(id)
    th.innerHTML = CharacterNameNumberRenderer.Content({
      num:
        character.getNumber() - this.userPreferences.getDefaultNumberingMode(),
      name: mb.htmlEscape(character.getName()),
      hasRules: this.characterRules.hasRulesForCharacterId(id),
      hasParentRules: this.characterRules.hasParentRulesForCharacterId(id),
      hasWarnings:
        this.shouldDisplayWarnings &&
        character.getLastScoredOn() < character.getLastChangedOn(),
      displayMode: this.userPreferences.getCharacterNameDisplayMode(),
      hasMediaAvailable: this.hasAnyTaxonMediaForCharacter(id),
    })
    return th
  }

  override getClass(): string {
    return null
  }

  /**
   * Character Name + Number HTML
   */
  private static Content(data: ContentData): string {
    let output = '<span class="name">[' + data.num + '] '
    switch (data.displayMode) {
      default:
      case 0:
        // truncate name
        output += mb.truncateString(data.name, 50)
        break
      case 1:
        // don't truncate name
        output += data.name
        break
      case 2:
        // character number only
        // do nothing since we want to use only the number
        break
    }
    output += '</span>'
    
    output = CharacterRenderer.addLabels(output, data)
    return output
  }
}

/**
 * The render for Character Numbers.
 */
export class CharacterNumberRenderer extends CharacterRenderer {
  constructor() {
    super()
  }

  override createCharacter(character: Character) {
    const id = character.getId()
    const th = document.createElement('th')
    th.dataset['characterId'] = String(id)
    th.innerHTML = CharacterNumberRenderer.Content({
      id: character.getId(),
      num:
        character.getNumber() - this.userPreferences.getDefaultNumberingMode(),
      hasRules: this.characterRules.hasRulesForCharacterId(id),
      hasParentRules: this.characterRules.hasParentRulesForCharacterId(id),
      hasWarnings:
        this.shouldDisplayWarnings &&
        character.getLastScoredOn() < character.getLastChangedOn(),
      hasMediaAvailable: this.hasAnyTaxonMediaForCharacter(id),
    })
    return th
  }

  override getClass() {
    return 'characterNumber'
  }

  /**
   * Character Number HTML
   */
  protected static Content(data: ContentData): string {
    const output = '[' + data.num + ']'
    return CharacterRenderer.addLabels(output, data)
  }
}

type ContentData = {
  id?: number
  name?: string
  displayMode?: number
  num: number
  hasRules: boolean
  hasParentRules: boolean
  hasWarnings: boolean
  hasMediaAvailable?: boolean
}
