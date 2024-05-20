/**
 * This event is throw when the cell mode is changed within the matrix container.
 *
 */
export function create(
  cellModeIndex: number
): CustomEvent<CellViewModeChangeEvent> {
  return new CustomEvent(TYPE, { detail: { cellModeIndex: cellModeIndex } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'CellModeChangeEvent'
export type CellViewModeChangeEvent = { cellModeIndex: number }
