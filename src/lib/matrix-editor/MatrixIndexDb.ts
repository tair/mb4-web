import * as mb from './mb'

/**
 * This class represents a singleton getter to the matrix_editor IndexDB database. This is used
 * throughout the application in order to store data directly on the client.
 */
export class MatrixIndexDb {
  private static instance: MatrixIndexDb

  /**
   * The current version of the database.
   */
  private static VERSION: number = 1

  public static COLUMNS = { VIEW_STATE: 'matrix_view_state' }

  /**
   * Whether the indexeddb database is enabled, default to true.
   */
  private static IS_ENABLED: boolean = true
  private databasePromise: Promise<IDBDatabase>

  private constructor() {
    this.databasePromise = MatrixIndexDb.openDatabase(
      'matrix_editor',
      MatrixIndexDb.VERSION
    )
  }

  getDatabasePromise(): Promise<IDBDatabase> {
    return this.databasePromise
  }

  static getInstance() {
    if (MatrixIndexDb.instance == null) {
      MatrixIndexDb.instance = new MatrixIndexDb()
    }
    return MatrixIndexDb.instance
  }

  /**
   * @return Whether we can support using the indexdb database.
   */
  static isSupported(): boolean {
    return !!window.indexedDB
  }

  /**
   * @return Whether the indexdb database is enabled.
   */
  static isEnabled(): boolean {
    return MatrixIndexDb.isSupported() && MatrixIndexDb.IS_ENABLED
  }

  private static openDatabase(
    name: string,
    version: number
  ): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const openRequest = window.indexedDB.open(name, version)
      openRequest.onsuccess = function (e) {
        const request: IDBRequest = e.target as IDBRequest
        resolve(request.result)
      }
      openRequest.onerror = function (e) {
        // If we could not open the database let's assume that it's disabled.
        MatrixIndexDb.IS_ENABLED = false
        const request: IDBRequest = e.target as IDBRequest
        reject(request.error)
      }
      openRequest.onupgradeneeded = function (e) {
        MatrixIndexDb.onHandleDatabaseUpdate(e)
      }
    })
  }

  /**
   * Creates the database if it doesn't exists.
   * @param event The version change event.
   */
  private static onHandleDatabaseUpdate(event: IDBVersionChangeEvent) {
    const request: IDBRequest = event.target as IDBRequest
    const database = request.result
    if (event.newVersion !== event.oldVersion) {
      const columnStoreNames = database.objectStoreNames
      for (let columnStoreName in columnStoreNames) {
        if (mb.containsValue(MatrixIndexDb.COLUMNS, columnStoreName)) {
          database.deleteObjectStore(columnStoreName)
        }
      }
    }

    database.createObjectStore(MatrixIndexDb.COLUMNS.VIEW_STATE)
  }
}
