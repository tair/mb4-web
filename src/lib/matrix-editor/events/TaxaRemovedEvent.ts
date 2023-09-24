/**
 * Event that signifies that taxa were added.
 *
 * @param taxaIds The taxa that were modified
 */
export function create(taxaIds: number[]): CustomEvent<TaxaRemovedEvent> {
  return new CustomEvent(TYPE, { detail: { taxaIds: taxaIds } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'TaxaRemovedEvent'
export type TaxaRemovedEvent = { taxaIds: number[] }
