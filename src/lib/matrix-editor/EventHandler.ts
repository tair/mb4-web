import { Disposable } from './ui/Disposable'

/**
 * Handles events for an object within the Matrix Editor. The goal of this class
 * is to group events together so that they can be created and disposed
 * uniformly.
 */
export class EventHandler implements Disposable {
  /**
   * This is a map of all of the registered targets and their event name to the
   * callback to be invoked.
   */
  private registeredCallbacks: Map<
    EventTarget,
    Map<string, (...p: any[]) => any>
  >

  constructor() {
    this.registeredCallbacks = new Map()
  }

  /**
   * Listen to an event on an EventTarget.
   * @param src The EventTarget to be listened to.
   * @param types The name of the events to listen.
   * @param callback The function to call for the event.
   */
  listen(
    src: EventTarget,
    types: string | string[],
    callback: (...p: any[]) => any
  ): EventHandler {
    if (!Array.isArray(types)) {
      return this.listen(src, [types], callback)
    }

    for (const type of types) {
      this.registerHandler(src, type, callback)
      src.addEventListener(type, callback)
    }
    return this
  }

  /**
   * Unlisten to an event on an EventTarget..
   * @param src The EventTarget to be listened to.
   * @param  types The name of the events to stop listening for.
   */
  unlisten(src: EventTarget, types: string | string[]): EventHandler {
    if (!Array.isArray(types)) {
      return this.unlisten(src, [types])
    }

    const callbacks = this.registeredCallbacks.get(src)
    if (callbacks == null) {
      return
    }

    for (const type of types) {
      const callback = callbacks.get(type)
      this.unregisterHandler(src, type)
      if (callback) {
        src.removeEventListener(type, callback)
      }
    }

    return this
  }

  /**
   * Register an event.
   * @param src Event source.
   * @param  type Event type to listen for or array of event types.
   * @param callback The function to call for the event.
   */
  private registerHandler(
    src: EventTarget,
    type: string,
    callback: (...p1: any[]) => any
  ) {
    if (!this.registeredCallbacks.has(src)) {
      this.registeredCallbacks.set(src, new Map())
    }
    const callbacks = this.registeredCallbacks.get(src)
    if (callbacks!.has(type)) {
      throw `There is already a ${type} defined`
    }
    callbacks!.set(type, callback)
  }

  /**
   * Unregister an event.
   * @param src Event source.
   * @param type Event type to listen for or array of event types.
   */
  private unregisterHandler(src: EventTarget, type: string) {
    const callbacks = this.registeredCallbacks.get(src)
    callbacks!.delete(type)
  }

  /**
   * Removes all of the events.
   */
  removeAll() {
    for (const src of Array.from(this.registeredCallbacks.keys())) {
      const callbacks = this.registeredCallbacks.get(src)
      if (callbacks == null) {
        return
      }

      for (const type of Array.from(callbacks.keys())) {
        const callback = callbacks.get(type)
        if (callback) {
          src.removeEventListener(type, callback)
        }
      }
    }
  }

  dispose() {
    this.removeAll()
  }

  isDisposed() {
    return false
  }

  addOnDisposeCallback() {}
}
