/**
 * Cells that have changed.
 *
 * @param taxaIds the taxa that have changed.
 * @param characterIds the character that have changed.
 * @param isSystemChange Whether the change was by the system
 */
export function create(
  taxaIds: number[],
  characterIds: number[],
  isSystemChange?: boolean | null
): CustomEvent<CellsChangedEvent> {
  return new CustomEvent(TYPE, {
    detail: {
      taxaIds: taxaIds,
      characterIds: characterIds,
      isSystemChange: !!isSystemChange,
    },
  })
}

/**
 * The type of this event
 */
export const TYPE: string = 'CellsChangedEvent'
export type CellsChangedEvent = {
  taxaIds: number[]
  characterIds: number[]
  isSystemChange: boolean
}
