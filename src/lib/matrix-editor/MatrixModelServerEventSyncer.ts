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
  private serverEvents: EventSource | null = null
  private reconnectTimer: number = 0
  private disposed: boolean = false
  private focusListenersAttached: boolean = false
  private readonly onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.throttledSync.fire()
    }
  }
  private readonly onWindowFocus = () => this.throttledSync.fire()

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
    if (this.disposed) {
      return
    }
    const userId = this.matrixModel.getProjectProperties().getUserId()
    if (userId == null) {
      return
    }

    window.addEventListener(
      CellEditEvents.TYPE,
      (e: CustomEvent<CellEditEvent>) => this.onHandleMatrixCellClick(e)
    )
    this.attachFocusListeners()

    const userLocation = this.url + userId + '/sync'
    const serverEvents = new EventSource(userLocation)
    this.serverEvents = serverEvents
    
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
   * Syncs when the user comes back to this tab. Server events only cover
   * changes made inside the editor by other users; edits made elsewhere
   * (e.g. renaming a taxon on the project's taxa list in another tab) are
   * otherwise not seen until a reload. Attached once; start() is re-entered
   * on reconnect.
   */
  private attachFocusListeners() {
    if (this.focusListenersAttached) {
      return
    }
    this.focusListenersAttached = true
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    window.addEventListener('focus', this.onWindowFocus)
  }

  /**
   * Stops syncing: removes the global listeners, cancels any pending sync or
   * reconnect, and closes the server connection. Called when the editor view
   * is unmounted so a removed editor cannot keep fetching changes.
   */
  dispose() {
    this.disposed = true
    if (this.focusListenersAttached) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange)
      window.removeEventListener('focus', this.onWindowFocus)
      this.focusListenersAttached = false
    }
    this.throttledSync.dispose()
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = 0
    }
    if (this.serverEvents) {
      this.serverEvents.close()
      this.serverEvents = null
    }
    this.matrixModel.setClientId(null)
  }

  /**
   * Handles events from server-side events which indicate the connection was closed.
   */
  protected onHandleEventSourceClose() {
    this.matrixModel.setClientId(null)
  }

  /**
   * Handles events from server-side events which indicate the connection received an error.
   */
  protected onHandleEventSourceError(e: Event, serverEvents: EventSource) {
    // EventSource will automatically try to reconnect unless we close it
    // Only close and notify user if the connection is actually closed/failed
    if (serverEvents.readyState === EventSource.CLOSED) {
      serverEvents.close()
      // Clear client ID since connection is lost
      this.matrixModel.setClientId(null)
      // Attempt to reconnect after a delay
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = 0
        this.start()
      }, 5000)
    }
  }

  /**
   * Handles events from server-side events which indicate that the user should sync contents from
   * the server.
   */
  protected onHandleEventSourceSync() {
    this.throttledSync.fire()
  }

  /**
   * Handles events from server-side events which indicate that this client is registered.
   */
  protected onHandleEventSourceInitialize(e: MessageEvent<any>) {
    const data = JSON.parse(e.data)
    const clientId = data['client_id']
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
