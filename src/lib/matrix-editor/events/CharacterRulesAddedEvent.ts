/**
 * Event that signifies that character rules were added.
 *
 * @param characterIds The character that were modified
 */
export function create(
  characterIds: number[]
): CustomEvent<CharacterRulesAddedEvent> {
  return new CustomEvent(TYPE, { detail: { characterIds: characterIds } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'CharacterRulesAddedEvent'
export type CharacterRulesAddedEvent = { characterIds: number[] }
