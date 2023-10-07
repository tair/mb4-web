/**
 * Throttle will perform an action that is passed in no more than once per
 * interval (specified in milliseconds). If it gets multiple signals to perform
 * the action while it is waiting, it will only perform the action once at the
 * end of the interval.
 * @param callback Function to callback when the action is triggered.
 * @param interval Interval over which to throttle. The listener can
 *     only be called once per interval.
 */
export class Throttle {
  private readonly callback: () => any
  private readonly interval: number

  /**
   * Timer for scheduling the next callback
   */
  private timer: number

  constructor(callback: () => any, interval: number) {
    this.callback = callback
    this.interval = interval
  }

  /** Dispose. */
  dispose() {
    if (this.timer) {
      window.clearTimeout(this.timer)
      this.timer = 0
    }
  }

  /** Fires a callback. */
  fire() {
    if (!this.timer) {
      this.timer = window.setTimeout(() => {
        this.timer = 0
        this.callback()
      }, this.interval)
    }
  }
}
