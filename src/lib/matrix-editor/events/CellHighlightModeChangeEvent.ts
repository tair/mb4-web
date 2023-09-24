/**
 * This event is throw when the user changes the cell highlight mode in the matrix container.
 *
 * @param highlightIndex The index of the cell highlight mode
 */
export function create(
  highlightIndex: number
): CustomEvent<CellHighlightModeChangeEvent> {
  return new CustomEvent(TYPE, { detail: { highlightIndex: highlightIndex } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'HighLightChangeEvent'
export type CellHighlightModeChangeEvent = { highlightIndex: number }
