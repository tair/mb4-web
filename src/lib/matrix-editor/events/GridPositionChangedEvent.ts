/**
 * This event is throw when the matrix grid position has been changed.
 *
 * @param taxonIndex the taxon to go to
 * @param characterIndex the character to go to
 */
export function create(
  taxonIndex: number,
  characterIndex: number
): CustomEvent<GridPositionChangedEvent> {
  return new CustomEvent(TYPE, {
    detail: { taxonIndex: taxonIndex, characterIndex: characterIndex },
  })
}

/**
 * The type of this event
 */
export const TYPE: string = 'GridPositionChangedEvent'
export type GridPositionChangedEvent = {
  taxonIndex: number
  characterIndex: number
}
