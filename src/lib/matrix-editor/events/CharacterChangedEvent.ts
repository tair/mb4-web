/**
 * Characters that have changed.
 * @param characterIds the character that have changed.
 */
export function create(
  characterIds?: number[]
): CustomEvent<CharacterChangedEvent> {
  return new CustomEvent(TYPE, { detail: { characterIds: characterIds || [] } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'CharacterChangedEvent'
export type CharacterChangedEvent = { characterIds: number[] }
