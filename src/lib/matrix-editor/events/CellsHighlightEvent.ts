/**
 * Highlight cells.
 */
export function create(
  cellHighlightEvents: CellHighlightEvent[]
): CustomEvent<CellsHighlightEvent> {
  return new CustomEvent(TYPE, { detail: { cells: cellHighlightEvents } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'CellsHighlightEvent'
export type CellHighlightEvent = {
  taxonId: number
  characterId: number
  userId: number
}
export type CellsHighlightEvent = { cells: CellHighlightEvent[] }
