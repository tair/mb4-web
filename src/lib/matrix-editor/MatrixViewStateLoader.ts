import { MatrixAccessorContainer } from './ui/MatrixAccessorContainer'
import { MatrixModel } from './MatrixModel'
import * as mb from './mb'
import { MatrixIndexDb } from './MatrixIndexDb'
import { Throttle } from './Throttle'
import { CellHighlightModeChangeEvent } from './events/CellHighlightModeChangeEvent'
import * as CellHighlightModeChangeEvents from './events/CellHighlightModeChangeEvent'
import { CellViewModeChangeEvent } from './events/CellViewModeChangeEvent'
import * as CellViewModeChangeEvents from './events/CellViewModeChangeEvent'
import { GridPositionChangedEvent } from './events/GridPositionChangedEvent'
import * as GridPositionChangedEvents from './events/GridPositionChangedEvent'
import * as PartitionChangedEvents from './events/PartitionChangedEvent'
import * as PartitionRefreshedEvents from './events/PartitionRefreshedEvent'
import * as GoToCellEvents from './events/GoToCellEvent'
import { EventType } from './ui/Component'

/**
 * This class is responsible for saving and loading the last view of the matrix. This is everything
 * that corresponds to what is visibility present on the screen. This includes the cell mode,
 * highlight mode, partition, and grid position. This saves the view such that the next time the
 * user starts the matrix, he/she should be go to the last position.
 *
 * @param matrixContainer The container which holds the matrix
 * @param matrixModel The model of the matrix.
 */
export class MatrixViewStateLoader {
  /**
   * Number of milliseconds to wait until we save the next view.
   */
  private static THROTTLE_INTERVAL_MILLIS: number = 1000
  private throttledSave: Throttle
  private databasePromise: Promise<IDBDatabase>
  private currentViewState: { [key: string]: number } = {}

  constructor(
    private readonly matrixContainer: MatrixAccessorContainer,
    private readonly matrixModel: MatrixModel
  ) {
    this.throttledSave = new Throttle(
      () => this.saveViewState(),
      MatrixViewStateLoader.THROTTLE_INTERVAL_MILLIS
    )

    const matrixIndexDb = MatrixIndexDb.getInstance()
    this.databasePromise = matrixIndexDb.getDatabasePromise()
  }

  /**
   * Starts the recording view state changes as well as storing them locally.
   */
  start(): Promise<boolean> {
    // Load the view first so that it's properly initialized so that events do not corrupt state and
    // are missed.
    return this.loadViewState()
      .then(() => {
        this.attachEvents()
        this.setView()

        // We check the partition here to save it if the setting was re-enabled.
        this.onPartitionChanged()
        return true
      })
      .catch(() => false)
  }

  /**
   * Stops recording the view state changes and removes the data which was stored locally. Once
   * this method is called, no other interactions should be done on this object.
   */
  remove() {
    this.databasePromise.then((database) => {
      const transaction = database.transaction(
        [MatrixIndexDb.COLUMNS.VIEW_STATE],
        'readwrite'
      )
      const objectStore = transaction.objectStore(
        MatrixIndexDb.COLUMNS.VIEW_STATE
      )
      return objectStore.delete(this.matrixModel.getId())
    })
  }

  /**
   * Attach events so that when the matrix view is updated. We can save it properly.
   */
  private attachEvents() {
    const handler = this.matrixContainer.getHandler()
    handler.listen(
      window,
      GridPositionChangedEvents.TYPE,
      (e: CustomEvent<GridPositionChangedEvent>) => this.onHandleGridUpdate(e)
    )
    handler.listen(
      this.matrixModel,
      [PartitionChangedEvents.TYPE, PartitionRefreshedEvents.TYPE],
      () => this.onPartitionChanged()
    )
    handler.listen(
      this.matrixContainer,
      CellHighlightModeChangeEvents.TYPE,
      (e: CustomEvent<CellHighlightModeChangeEvent>) => this.onCellHighlightModeChange(e)
    )
    handler.listen(
      this.matrixContainer,
      CellViewModeChangeEvents.TYPE,
      (e: CustomEvent<CellViewModeChangeEvent>) => this.onCellViewModeChange(e)
    )

    // Saving the view state on the browser unload is not gauranteed to complete. Since the transactions are
    // asynchronous, they may be aborted before they can complete. Some browsers (e.g. Chrome) is fast enough so that
    // the indexDb is written but this is does not always complete for Firefox.
    handler.listen(
      window,
      EventType.BEFOREUNLOAD,
      () => this.saveViewState()
    )
  }

  /**
   * Sets the matrix view.
   */
  private setView() {
    this.databasePromise.then(() => this.setViewInternal())
  }

  /**
   * Sets the matrix view.
   */
  private setViewInternal() {
    const savedPartitionId = this.currentViewState[ViewState.PARTITION_ID]
    if (savedPartitionId) {
      this.matrixModel.setPartitionId(savedPartitionId)
    }
    const savedHighlightMode = this.currentViewState[ViewState.HIGHLIGHT_MODE]
    if (savedHighlightMode) {
      this.matrixContainer.changeHighlightMode(savedHighlightMode)
    }
    const savedCellMode = this.currentViewState[ViewState.CELL_MODE]
    if (savedCellMode !== undefined) {
      this.matrixContainer.changeCellMode(savedCellMode)
    }

    // Let's default to zero because if one of the values are set, we want to still go to the cell.
    const savedCharacterIndex =
      this.currentViewState[ViewState.LAST_CHARACTER_INDEX] || 0
    const savedTaxonIndex =
      this.currentViewState[ViewState.LAST_TAXON_INDEX] || 0
    if (savedCharacterIndex || savedTaxonIndex) {
      window.dispatchEvent(
        GoToCellEvents.create(savedTaxonIndex, savedCharacterIndex)
      )
    }
  }

  /**
   * Saves the view state from memory to local storage. In order to prevent numerous writes to disk
   * when the user is changing the view state, this actually will schedule a single save to disk and
   * only one save timer is scheduled at a given point.
   */
  private throttledSaveViewState() {
    this.throttledSave.fire()
  }

  /**
   * Loads the view state from local storage to memory
   */
  private loadViewState(): Promise<void> {
    const objectStorePromise: Promise<string> = this.databasePromise.then(
      (database) => {
        const transaction = database.transaction(
          [MatrixIndexDb.COLUMNS.VIEW_STATE],
          'readwrite'
        )
        const objectStore = transaction.objectStore(
          MatrixIndexDb.COLUMNS.VIEW_STATE
        )
        const viewStateGetRequest = objectStore.get(this.matrixModel.getId())
        return new Promise((resolve, reject) => {
          viewStateGetRequest.onsuccess = function (e) {
            const request = <IDBRequest>e.target
            resolve(request.result)
          }
          viewStateGetRequest.onerror = function (e) {
            const request = <IDBRequest>e.target
            reject(request.error)
          }
        })
      }
    )
    return objectStorePromise.then((serializedViewState) => {
      if (serializedViewState) {
        const viewState = JSON.parse(serializedViewState)
        for (let key in viewState) {
          const value = viewState[key]
          if (!(key in this.currentViewState)) {
            this.currentViewState[key] = value
          }
        }
      }
    })
  }

  /**
   * Saves the view state from memory to local storage.
   */
  private saveViewState() {
    this.databasePromise.then((database) => {
      const transaction = database.transaction(
        [MatrixIndexDb.COLUMNS.VIEW_STATE],
        'readwrite'
      )
      const objectStore = transaction.objectStore(
        MatrixIndexDb.COLUMNS.VIEW_STATE
      )
      if (mb.isEmpty(this.currentViewState)) {
        objectStore.delete(this.matrixModel.getId())
      } else {
        const serializedState = JSON.stringify(this.currentViewState)
        objectStore.put(serializedState, this.matrixModel.getId())
      }
    })
  }

  /**
   * Determines how to set the value in the current view state. This will either set the value or
   * remove it from the object if the value is default, undefined, or null.
   *
   * @param viewState The view state to set
   * @param value The value to set
   */
  private setViewState(viewState: ViewState, value: number | null) {
    if (value != null) {
      this.currentViewState[viewState] = value
    } else {
      delete this.currentViewState[viewState]
    }
  }

  /**
   * Handlers events when the position of the matrix grid changed.
   *
   * @param e The event that triggerd this callback.
   */
  private onHandleGridUpdate(e: CustomEvent<GridPositionChangedEvent>) {
    const characterIndex = e.detail.characterIndex
    const savedCharacterIndex =
      this.currentViewState[ViewState.LAST_CHARACTER_INDEX]
    if (savedCharacterIndex !== characterIndex) {
      this.setViewState(ViewState.LAST_CHARACTER_INDEX, characterIndex)
    }
    const taxonIndex = e.detail.taxonIndex
    const savedTaxonIndex = this.currentViewState[ViewState.LAST_TAXON_INDEX]
    if (savedTaxonIndex !== taxonIndex) {
      this.setViewState(ViewState.LAST_TAXON_INDEX, taxonIndex)
    }
    if (
      savedCharacterIndex !== characterIndex ||
      savedTaxonIndex !== taxonIndex
    ) {
      this.throttledSaveViewState()
    }
    return true
  }

  /**
   * Handlers events when the partition has changed.
   */
  protected onPartitionChanged() {
    const partitionId = this.matrixModel.getCurrentPartitionId()
    const savedPartitionId = this.currentViewState[ViewState.PARTITION_ID]
    if (savedPartitionId !== partitionId) {
      this.setViewState(ViewState.PARTITION_ID, partitionId)
      this.throttledSaveViewState()
    }
    return true
  }

  /**
   * Handlers events when the user changes the cell highlight mode.
   *
   * @param e The event that triggerd this callback.
   */
  private onCellHighlightModeChange(
    e: CustomEvent<CellHighlightModeChangeEvent>
  ) {
    const highlightIndex = e.detail.highlightIndex
    const savedHighlightIndex = this.currentViewState[ViewState.HIGHLIGHT_MODE]
    if (savedHighlightIndex !== highlightIndex) {
      this.setViewState(ViewState.HIGHLIGHT_MODE, highlightIndex)
      this.throttledSaveViewState()
    }
    return true
  }

  /**
   * Handlers events when the user changes the cell view mode
   *
   * @param e The event that triggerd this callback.
   */
  private onCellViewModeChange(e: CustomEvent<CellViewModeChangeEvent>) {
    const cellModeIndex = e.detail.cellModeIndex
    const savedCellModeIndex = this.currentViewState[ViewState.CELL_MODE]
    if (savedCellModeIndex !== cellModeIndex) {
      this.setViewState(ViewState.CELL_MODE, cellModeIndex)
      this.throttledSaveViewState()
    }
    return true
  }
}

const enum ViewState {
  CELL_MODE = 'cm',
  HIGHLIGHT_MODE = 'hm',
  PARTITION_ID = 'pid',
  LAST_CHARACTER_INDEX = 'lcid',
  LAST_TAXON_INDEX = 'ltid',
}
