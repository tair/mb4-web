/**
 * Event that signifies that user modified the preference for the last view state preference.
 */
export function create(): Event {
  return new Event(TYPE)
}

/**
 * The type of this event
 */
export const TYPE: string = 'LastViewStatePreferenceChangedEvent'
