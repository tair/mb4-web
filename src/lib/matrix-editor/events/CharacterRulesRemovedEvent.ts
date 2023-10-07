/**
 * Event that signifies that character rules were removed.
 *
 * @param characterIds The character that were modified
 */
export function create(
  characterIds: number[]
): CustomEvent<CharacterRulesRemovedEvent> {
  return new CustomEvent(TYPE, { detail: { characterIds: characterIds } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'CharacterRulesRemovedEvent'
export type CharacterRulesRemovedEvent = { characterIds: number[] }
