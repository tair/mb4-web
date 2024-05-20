/**
 * Event when a media is dropped from the DraggableMediaGrid.
 * @param mediaId The id of the media that was dropped.
 */
export function create(mediaId: number): CustomEvent<MediaDroppedEvent> {
  return new CustomEvent(TYPE, { detail: { mediaId: mediaId } })
}

/**
 * The type of this event
 */
export const TYPE: string = 'MediaDropped'
export type MediaDroppedEvent = { mediaId: number }
