/**
 * An interface to indicate that this class can be disposed.
 */
export interface Disposable {
  /**
   * Disposes an object
   */
  dispose(): void

  /**
   * @return Whether this object was disposed.
   */
  isDisposed(): boolean

  /**
   * @param callback to invoke when this is disposed.
   */
  addOnDisposeCallback(callback: () => void): void
}
