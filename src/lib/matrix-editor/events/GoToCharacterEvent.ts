/**
 * Go to a cell event.
 * @param characterIndex the character to go to
 */
export function create(
  characterIndex: number
): CustomEvent<GoToCharacterEvent> {
  return new CustomEvent(TYPE, { detail: { characterIndex: characterIndex } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'GoToCharacter'
export type GoToCharacterEvent = { characterIndex: number }
