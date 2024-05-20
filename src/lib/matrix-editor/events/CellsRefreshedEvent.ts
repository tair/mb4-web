/**
 * Cells needs to be refreshed because they have been changed.
 *
 */
export function create(): Event {
  return new Event(TYPE)
}

/**
 * The type of this event
 */
export const TYPE: string = 'CellsRefreshedEvent'
