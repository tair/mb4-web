/**
 * When a cell is being edited.
 *
 * @param taxonId the taxon id which was edited.
 * @param characterId the character id which was edited.
 * @param editting Whether the cell is currently being editting.
 */
export function create(
  taxonId: number,
  characterId: number,
  editting?: boolean | null
): CustomEvent<CellEditEvent> {
  return new CustomEvent(TYPE, {
    detail: {
      taxonId: taxonId,
      characterId: characterId,
      editting: !!editting,
    },
  })
}

/**
 * The type of this event
 */
export const TYPE: string = 'CellEditEvent'
export type CellEditEvent = {
  taxonId: number
  characterId: number
  editting: boolean
}
