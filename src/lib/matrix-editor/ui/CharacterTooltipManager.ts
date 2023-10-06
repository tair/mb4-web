import { Character, CharacterType } from '../data/Characters'
import { MatrixModel } from '../MatrixModel'
import * as MediaExports from '../data/Media'
import * as bootstrap from 'bootstrap'
import * as mb from '../mb'

/**
 * The tooltip for cells within the matrix grid.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 */
export class CharacterTooltipManager {
  private hideTimeout: number = 0
  private hideRulesTimeout: number = 0

  constructor(private matrixModel: MatrixModel) {}

  /**
   * Shows the tooltip for the character element.
   *
   * @param element The character to show the tooltip for
   */
  showForCharacter(element: HTMLElement) {
    let tooltip = bootstrap.Popover.getInstance(element)
    if (!tooltip) {
      const characterId = CharacterTooltipManager.getCharacterId(element)
      const character = this.matrixModel.getCharacters().getById(characterId)
      const content = this.tooltipForCharacter(character)
      tooltip = CharacterTooltipManager.createToolTip(
        element,
        content,
        'characterTooltip'
      )
    }

    window.clearTimeout(this.hideTimeout)
    if (!element.getElementsByClassName('characterTooltip').length) {
      this.hideAll()
      tooltip.show()

      const contentElement =
        element.getElementsByClassName('characterTooltip')[0]
      const mediaElements = contentElement.getElementsByClassName('media')
      contentElement.addEventListener('mouseenter', () => {
        window.clearTimeout(this.hideTimeout)
        Array.from(mediaElements).forEach((mediaElement) =>
          bootstrap.Popover.getOrCreateInstance(mediaElement, {
            html: true,
            container: mediaElement,
          })
        )
      })
      contentElement.addEventListener('mouseleave', () => {
        this.hideTimeout = window.setTimeout(() => this.hide(tooltip), 750)
      })
    }
  }

  /**
   * Shows the tooltip for the character element.
   *
   * @param element The character to show the tooltip for
   * @param characterId The character ID
   */
  showRulesForCharacter(element: HTMLElement, characterId: number) {
    let tooltip = bootstrap.Popover.getInstance(element)
    if (!tooltip) {
      const character = this.matrixModel.getCharacters().getById(characterId)
      const contentElement = this.tooltipForCharacterRules(character)
      tooltip = CharacterTooltipManager.createToolTip(
        element,
        contentElement,
        'characterTooltip characterRulesTooltip'
      )
    }

    window.clearTimeout(this.hideRulesTimeout)
    if (!element.getElementsByClassName('characterTooltip').length) {
      this.hideAll()
      tooltip.show()

      const contentElement =
        element.getElementsByClassName('characterTooltip')[0]
      contentElement.addEventListener('mouseenter', () =>
        window.clearTimeout(this.hideRulesTimeout)
      )
      contentElement.addEventListener('mouseleave', () => {
        this.hideRulesTimeout = window.setTimeout(() => this.hide(tooltip), 750)
      })
    }
  }

  /**
   * Hides the tooltip for the character rules element.
   *
   * @param element The character to show the tooltip for
   */
  hideForCharacter(element: HTMLElement) {
    const tooltip = bootstrap.Popover.getInstance(element)
    if (tooltip) {
      this.hideTimeout = window.setTimeout(() => this.hide(tooltip), 750)
    }
  }

  /**
   * Hides the tooltip for the character rules element.
   *
   * @param element The character to show the tooltip for
   */
  hideForCharacterRule(element: HTMLElement) {
    const tooltip = bootstrap.Popover.getInstance(element)
    if (tooltip) {
      this.hideRulesTimeout = window.setTimeout(() => this.hide(tooltip), 750)
    }
  }

  hide(tooltip: bootstrap.Popover) {
    tooltip.hide()
  }

  hideAll() {
    const elements = document.getElementsByClassName('characterTooltip')
    for (let x = 0; x < elements.length; x++) {
      const element = elements[x]
      const tooltip = bootstrap.Popover.getInstance(element.parentElement)
      if (tooltip) {
        tooltip.hide()
      }
    }
  }

  /**
   * Returns a tooltip for the character
   * @param character The character to show the tooltip for
   */
  private tooltipForCharacter(character: Character): string {
    let html =
      '<header>' +
      mb.htmlEscape(mb.truncateString(character.getName(), 140)) +
      '</header>'
    const media = character.getMedia()
    const length = Math.min(media.length, 4)
    for (let x = 0; x < length; x++) {
      const medium = media[x]
      const mediumStateId = medium.getStateId() as number
      const state = character.getCharacterStateById(mediumStateId)
      const stateName = state
        ? '(' + state.getNumber() + ') ' + mb.htmlEscape(state.getName())
        : 'character'
      const content = MediaExports.toTag(medium.getMedium())
      html +=
        '<div class="media" data-bs-toggle="popover" data-bs-placement="bottom" data-bs-custom-class="characterMediaTooltip" data-bs-trigger="hover" data-bs-html="true" data-bs-content="' +
        content +
        '">' +
        MediaExports.toTag(medium.getTiny()) +
        '<div class="title">' +
        stateName +
        '</div></div>'
    }
    const states = character.getStates()
    for (let x = 0; x < states.length; x++) {
      const state = states[x]
      html +=
        '<br/><div class="state">(' +
        state.getNumber() +
        ') ' +
        mb.htmlEscape(state.getName()) +
        '</div>'
    }
    const type = character.getType()
    if (type === CharacterType.CONTINUOUS) {
      html += '<br/><div class="state">Continuous Character</div>'
    }
    if (type === CharacterType.MERISTIC) {
      html += '<br/><div class="state">Meristic Character</div>'
    }
    html += '<p>' + mb.htmlEscape(character.getDescription()) + '</p>'
    html +=
      '<br/> Ordering: ' + (character.getOrdering() ? 'Ordered' : 'Unordered')
    html += '<br/> Comments: ' + character.getCommentCount()
    html += '<br/> Unread comments: ' + character.getUnreadCommentCount()
    return html
  }

  /**
   * Returns a tooltip for the character rules
   * @param character The character to show the tooltip for
   */
  private tooltipForCharacterRules(character: Character): string {
    let html =
      '<header>' +
      mb.htmlEscape(mb.truncateString(character.getName(), 140)) +
      '</header>'
    const maxLengthOfName = 20
    const characters = this.matrixModel.getCharacters()
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const characterRules = this.matrixModel.getCharacterRules()
    const motherCharacterRules = characterRules.getRulesForCharacterId(
      character.getId()
    )
    const daughterCharacterRules =
      characterRules.getDaughterRulesForCharacterId(character.getId())
    const allCharacterRules = motherCharacterRules.concat(
      daughterCharacterRules
    )
    const maxLength =
      motherCharacterRules.length + daughterCharacterRules.length
    const length = Math.min(maxLength, 10)
    for (let x = 0; x < length; x++) {
      const characterRule = allCharacterRules[x]
      const characterId = characterRule.getCharacterId()
      character = characters.getById(characterId) as Character
      const characterStateId = characterRule.getStateId()
      const actionCharacterId = characterRule.getActionCharacterId()
      const actionStateId = characterRule.getActionStateId()
      const actionCharacter = characters.getById(actionCharacterId)
      const isMotherRule = x < motherCharacterRules.length
      if (characterRule.isAction('SET_STATE')) {
        html +=
          '<br/><span class="rule"> ' +
          (isMotherRule ? '(R)' : '(r)') +
          ' </span>'
        html +=
          'If character [' + (character.getNumber() - numberingMode) + '] is '
        if (characterStateId === null) {
          html += 'Inapplicable [-]'
        } else {
          const characterState =
            character.getCharacterStateById(characterStateId)
          html +=
            mb.truncateString(
              mb.htmlEscape(characterState!.getName()),
              maxLengthOfName
            ) +
            ' [' +
            characterState!.getNumber() +
            ']'
        }
        html += ' \u2794 '
        html +=
          'character [' +
          (actionCharacter!.getNumber() - numberingMode) +
          '] ' +
          mb.truncateString(
            mb.htmlEscape(actionCharacter!.getName()),
            maxLengthOfName
          ) +
          '; set state to '
        if (actionStateId === null) {
          html += 'Inapplicable [-]'
        } else {
          const characterState =
            actionCharacter!.getCharacterStateById(actionStateId)
          html +=
            mb.truncateString(
              mb.htmlEscape(characterState!.getName()),
              maxLengthOfName
            ) +
            ' [' +
            characterState!.getNumber() +
            ']'
        }
      } else {
        if (characterRule.isAction('ADD_MEDIA')) {
          html +=
            'If media is set for character [' +
            (character.getNumber() - numberingMode) +
            '] \u2794 character [' +
            (actionCharacter!.getNumber() - numberingMode) +
            '] ' +
            mb.truncateString(
              mb.htmlEscape(actionCharacter!.getName()),
              maxLengthOfName
            ) +
            '; set media'
        } else {
          throw 'Invalid character rule action for tooltip'
        }
      }
    }
    if (length === 0) {
      html += '<p>No ontology rules are set for this character</p>'
    } else {
      if (maxLength > 10) {
        html +=
          '<p> 10 of ' +
          maxLength +
          ' are displayed above. Use the ontology editor to see a complete list.</p>'
      }
    }
    return html
  }

  /**
   * Gets the character Id from the element.
   *
   * @param element The element to display the tooltip for.
   * @return The character Id associated with the element.
   */
  private static getCharacterId(element: HTMLElement): number {
    const characterId = element.dataset['characterId']
    return characterId ? parseInt(characterId, 10) : 0
  }

  /**
   * Hides the tooltip for the character element.
   *
   * @param element The element to display the tooltip for.
   * @param contentElement The content of the tooltip.
   * @param classNames The class names to set on the tooltip.
   * @return The popup.
   */
  private static createToolTip(
    element: Element,
    content: string,
    classNames: string
  ): bootstrap.Popover {
    return new bootstrap.Popover(element, {
      trigger: 'manual',
      placement: 'bottom',
      html: true,
      delay: 250,
      customClass: classNames,
      container: element,
      content: content,
      sanitize: false,
    })
  }
}
