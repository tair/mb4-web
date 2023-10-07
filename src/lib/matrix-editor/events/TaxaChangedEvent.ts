import { TaxaAddedEvent } from './TaxaAddedEvent'

/**
 * Event that signifies that taxa were changed.
 * @param taxaIds the taxa that have changed.
 */
export function create(taxaIds?: number[]): CustomEvent<TaxaAddedEvent> {
  return new CustomEvent(TYPE, { detail: { taxaIds: taxaIds || [] } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'TaxaChangedEvent'
export type TaxaChangedEvent = { taxaIds: number[] }
