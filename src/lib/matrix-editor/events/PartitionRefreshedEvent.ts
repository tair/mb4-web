/**
 * Event that signals when partitions should be refreshed.
 */
export function create(): Event {
  return new Event(TYPE)
}

/**
 * The type of this event
 */
export const TYPE: string = 'PartitionRefreshedEvent'
