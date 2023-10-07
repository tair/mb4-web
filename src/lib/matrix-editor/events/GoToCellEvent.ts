/**
 * Go to a cell event.
 * @param taxonIndex the taxon to go to
 * @param characterIndex the character to go to
 * @param highlight Whether the cell should be highlighted
 */
export function create(
  taxonIndex: number,
  characterIndex: number,
  highlight?: boolean | null
): CustomEvent<GoToCellEvent> {
  return new CustomEvent(TYPE, {
    detail: {
      taxonIndex: taxonIndex,
      characterIndex: characterIndex,
      highlight: !!highlight,
    },
  })
}

/**
 * The type of this event
 */
export const TYPE: string = 'GoToCell'
export type GoToCellEvent = {
  taxonIndex: number
  characterIndex: number
  highlight: boolean
}
