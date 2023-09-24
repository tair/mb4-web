/**
 * Event that signifies that something was reordered
 *
 * @param sourceIndex The index of the source
 * @param targetIndex The index of the target
 */
export function create(
  sourceIndex: number,
  targetIndex: number
): CustomEvent<ReorderEvent> {
  return new CustomEvent(TYPE, {
    detail: { sourceIndex: sourceIndex, targetIndex: targetIndex },
  })
}

/**
 * The type of this event
 */
export const TYPE: string = 'ReorderEvent'
export type ReorderEvent = { sourceIndex: number; targetIndex: number }
