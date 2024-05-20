/**
 * Characters was stale and should be refreshed.
 * @param characterIds the character that have changed.
 */
export function create(
  characterIds?: number[]
): CustomEvent<CharacterRefreshedEvent> {
  return new CustomEvent(TYPE, { detail: { characterIds: characterIds || [] } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'CharacterRefreshedEvent'
export type CharacterRefreshedEvent = { characterIds: number[] }
