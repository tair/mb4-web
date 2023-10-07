/**
 * Event that signifies that the partition has changed.
 * @param partitionId the ID of the partition that has changed.
 */
export function create(
  partitionId: number
): CustomEvent<PartitionChangedEvent> {
  return new CustomEvent(TYPE, { detail: { partitionId: partitionId } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'PartitionChangedEvent'
export type PartitionChangedEvent = { partitionId: number }
