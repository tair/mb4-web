/**
 * Event that signifies that taxa were changed.
 *
 */
export function create(): Event {
  return new Event(TYPE)
}

/**
 * The type of this event
 */
export const TYPE: string = 'TaxaRefreshedEvent'
