import { Component, EventType } from './Component'

/**
 * Creates a range model
 * @param component The targeted component.
 */
export class RangeModel {
  private value: number
  private minimum: number
  private maximum: number
  private step: number

  /**
   * This is true if something is changed as a side effect. This happens when for
   * example we set the maximum below the current value.
   */
  private isChanging: boolean = false

  constructor(public readonly component: Component) {
    this.value = 0
    this.minimum = 0
    this.maximum = 100
    this.step = 1
  }

  /**
   * Sets the value.
   * @param value The new value.
   */
  setValue(value: number) {
    value = this.roundToStepWithMin(value)
    if (this.value != value) {
      if (value > this.maximum) {
        this.value = this.maximum
      } else {
        if (value < this.minimum) {
          this.value = this.minimum
        } else {
          this.value = value
        }
      }
      if (!this.isChanging) {
        this.component.dispatchEvent(new Event(EventType.CHANGE))
      }
    }
  }

  /**
   * @return the current value.
   */
  getValue(): number {
    return this.roundToStepWithMin(this.value)
  }

  /**
   * Sets the minimum
   * @param minimum The new minimum.
   */
  setMinimum(minimum: number) {
    // Don't round minimum because it is the base
    if (this.minimum != minimum) {
      const oldIsChanging = this.isChanging
      this.isChanging = true
      this.minimum = minimum
      if (minimum > this.value) {
        this.setValue(minimum)
      }
      if (minimum > this.maximum) {
        this.setMaximum(minimum)
        this.setValue(minimum)
      }
      this.isChanging = oldIsChanging
      if (!this.isChanging) {
        this.component.dispatchEvent(new Event(EventType.CHANGE))
      }
    }
  }

  /**
   * @return The minimum value for the range model.
   */
  getMinimum(): number {
    return this.roundToStepWithMin(this.minimum)
  }

  /**
   * Sets the maximum
   * @param maximum The new maximum.
   */
  setMaximum(maximum: number) {
    maximum = this.roundToStepWithMin(maximum)
    if (this.maximum != maximum) {
      let oldIsChanging = this.isChanging
      this.isChanging = true
      this.maximum = maximum
      if (maximum < this.value) {
        this.setValue(maximum)
      }
      if (maximum < this.minimum) {
        this.setMinimum(maximum)
        this.setValue(this.maximum)
      }
      this.isChanging = oldIsChanging
      if (!this.isChanging) {
        this.component.dispatchEvent(new Event(EventType.CHANGE))
      }
    }
  }

  /**
   * @return The maximimum value for the range model.
   */
  getMaximum(): number {
    return this.roundToStepWithMin(this.maximum)
  }

  /**
   * Returns the step value. The step value is used to determine how to round the
   * value.
   * @return The maximimum value for the range model.
   */
  getStep(): number {
    return this.step
  }

  /**
   * Sets the step. The step value is used to determine how to round the value.
   * @param step  The step size.
   */
  setStep(step: number) {
    if (this.step != step) {
      this.step = step

      // adjust value and maximum
      const oldIsChanging = this.isChanging
      this.isChanging = true
      this.setMaximum(this.getMaximum())
      this.setValue(this.getValue())
      this.isChanging = oldIsChanging
      if (!this.isChanging) {
        this.component.dispatchEvent(new Event(EventType.CHANGE))
      }
    }
  }

  /**
   * Rounds to the closest step using the minimum value as the base.
   * @param value  The number to round.
   * @return The number rounded to the closest step.
   */
  roundToStepWithMin(value: number): number {
    return this.step == null
      ? value
      : this.minimum +
          Math.round((value - this.minimum) / this.step) * this.step
  }

  /**
   * Rounds to the closest step.
   * @param value  The number to round.
   * @return The number rounded to the closest step.
   */
  roundToStep(value: number): number {
    return this.step == null ? value : Math.round(value / this.step) * this.step
  }
}
