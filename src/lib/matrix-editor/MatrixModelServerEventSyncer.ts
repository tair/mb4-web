import { MatrixModel } from './MatrixModel'
import { Throttle } from './Throttle'
import { CellEditEvent } from './events/CellEditEvent'
import * as CellEditEvents from './events/CellEditEvent'
import { CellHighlightEvent } from './events/CellsHighlightEvent'
import { create as createCellsHighlightEvent } from './events/CellsHighlightEvent'

/**
 * This class performs collaboration for the matrix editor based on the server-side events.
 *
 */
export class MatrixModelServerEventSyncer {
  /**
   * Number of milliseconds to wait until the next sync.
   */
  private static THROTTLE_INTERVAL_MILLIS: number = 5000

  /**
   * Values of object keys in a shared snapshot.
   */
  private static FIELDS = {
    CHARACTER_ID: 'character_id',
    TAXON_ID: 'taxon_id',
    USER_ID: 'user_id',
    ENABLE: 'enable',
    CELLS: 'cells',
    TYPE: 'type',
  }

  /**
   * Values of object keys in a shared snapshot.
   */
  private static EVENT_TYPES = {
    EDIT_CELL_EVENT: 'EDIT_CELL',
  }

  private url: string
  private throttledSync: Throttle

  constructor(
    protected readonly matrixModel: MatrixModel,
    projectId: number,
    host: string
  ) {
    this.url = this.createURL(host, projectId)
    this.throttledSync = new Throttle(
      () => this.matrixModel.sync(),
      MatrixModelServerEventSyncer.THROTTLE_INTERVAL_MILLIS
    )
  }

  /**
   * Sets up the event listeners for matrix mcollaboration.
   */
  start() {
    const userId = this.matrixModel.getProjectProperties().getUserId()
    console.log('[MATRIX-SYNC-DEBUG] Starting MatrixModelServerEventSyncer, User ID:', userId)
    
    if (userId == null) {
      console.error('[MATRIX-SYNC-DEBUG] ❌ FAILED: No user ID available, cannot establish sync')
      return
    }

    window.addEventListener(
      CellEditEvents.TYPE,
      (e: CustomEvent<CellEditEvent>) => this.onHandleMatrixCellClick(e)
    )

    const userLocation = this.url + userId + '/sync'
    console.log('[MATRIX-SYNC-DEBUG] Establishing SSE connection to:', userLocation)
    
    const serverEvents = new EventSource(userLocation)
    
    console.log('[MATRIX-SYNC-DEBUG] EventSource created, readyState:', serverEvents.readyState)
    
    serverEvents.addEventListener('open', () => {
      console.log('[MATRIX-SYNC-DEBUG] ✅ SSE connection opened successfully')
    })
    
    serverEvents.addEventListener('sync', () => this.onHandleEventSourceSync())
    serverEvents.addEventListener('init', (e) =>
      this.onHandleEventSourceInitialize(e)
    )
    serverEvents.addEventListener('error', (e) =>
      this.onHandleEventSourceError(e, serverEvents)
    )
    serverEvents.addEventListener('cell', (e) =>
      this.onHandleEventSourceEditCell(e)
    )
    serverEvents.addEventListener('close', () =>
      this.onHandleEventSourceClose()
    )
  }

  /**
   * Handles events from server-side events which indicate the connection was closed.
   */
  protected onHandleEventSourceClose() {
    console.log('[MATRIX-SYNC-DEBUG] SSE connection closed, clearing client ID')
    this.matrixModel.setClientId(null)
  }

  /**
   * Handles events from server-side events which indicate the connection received an error.
   */
  protected onHandleEventSourceError(e: Event, serverEvents: EventSource) {
    console.error('[MATRIX-SYNC-DEBUG] ❌ SSE connection error:', {
      readyState: serverEvents.readyState,
      url: serverEvents.url,
      eventType: e.type
    })
    serverEvents.close()
    console.log('[MATRIX-SYNC-DEBUG] SSE connection closed due to error')
  }

  /**
   * Handles events from server-side events which indicate that the user should sync contents from
   * the server.
   */
  protected onHandleEventSourceSync() {
    console.log('[MATRIX-SYNC-DEBUG] Received sync event from server')
    this.throttledSync.fire()
  }

  /**
   * Handles events from server-side events which indicate that this client is registered.
   */
  protected onHandleEventSourceInitialize(e: MessageEvent<any>) {
    console.log('[MATRIX-SYNC-DEBUG] Received init event from server:', e.data)
    const data = JSON.parse(e.data)
    const clientId = data['client_id']
    console.log('[MATRIX-SYNC-DEBUG] ✅ Client registered with ID:', clientId)
    this.matrixModel.setClientId(clientId)
  }

  /**
   * Handles events from server-side events which indicate that the user should sync contents from
   * the server.
   * @param e The event from the server.
   */
  protected onHandleEventSourceEditCell(e: MessageEvent) {
    const data = JSON.parse(e.data)
    const fields = MatrixModelServerEventSyncer.FIELDS
    const cells = data[fields.CELLS]
    if (!cells || !cells.length) {
      return
    }

    const editingCells: CellHighlightEvent[] = []
    for (let x = 0; x < cells.length; x++) {
      const editingCell = cells[x]
      const taxonId = editingCell[fields.TAXON_ID] as number
      const characterId = editingCell[fields.CHARACTER_ID] as number
      const userId = editingCell[fields.USER_ID] as number
      const editingCellObject: CellHighlightEvent = {
        taxonId: taxonId,
        characterId: characterId,
        userId: userId,
      }
      editingCells.push(editingCellObject)
    }
    window.dispatchEvent(createCellsHighlightEvent(editingCells))
  }

  /**
   * Handles events from the matrix grid which indicate that a cell is being edited by the current
   * user.
   * @param e The event that triggered this callback.
   */
  protected onHandleMatrixCellClick(e: CustomEvent<CellEditEvent>) {
    const event = {
      [MatrixModelServerEventSyncer.FIELDS.TYPE]:
        MatrixModelServerEventSyncer.EVENT_TYPES.EDIT_CELL_EVENT,
      [MatrixModelServerEventSyncer.FIELDS.CHARACTER_ID]: e.detail.characterId,
      [MatrixModelServerEventSyncer.FIELDS.TAXON_ID]: e.detail.taxonId,
      [MatrixModelServerEventSyncer.FIELDS.ENABLE]: e.detail.editting,
    }
    this.matrixModel.sendEvent(event)
    return true
  }

  /**
   * Creates a URL from a host.
   *
   * @param host The host to create the URL from.
   * @param projectId The ID of the project for the matrix.
   */
  protected createURL(host: string, projectId: number) {
    const matrixId = this.matrixModel.getId()
    return host + '/projects/' + projectId + '/matrices/' + matrixId + '/edit/'
  }
}
