import { Component, EventType } from './Component'
import { RangeModel } from './RangeModel'
import * as mb from '../mb'

/**
 * This a rework of the slider class. But the vertical scroll is reversed to the proper way.
 *
 */
export class Scrollbar extends Component {
  /**
   * The prefix we use for the CSS class names for the slider and its elements.
   */
  protected static CSS_CLASS_PREFIX: string = 'slider'

  /**
   * CSS class name for the single thumb element.
   */
  protected static THUMB_CSS_CLASS: string = 'sliderThumb'

  /**
   * CSS class name applied to a thumb while it's being dragged.
   */
  protected static THUMB_DRAGGING_CSS_CLASS: string = 'sliderThumbDragging'

  /**
   * CSS class name applied when the slider is disabled.
   */
  protected static DISABLED_CSS_CLASS: string = 'sliderDisabled'

  /**
   * CSS class name for the single arrow element.
   */
  protected static ARROW_CSS_CLASS: string = 'sliderArrow'

  /**
   * When the user holds down the mouse on the slider background, the closest
   * thumb will move in "lock-step" towards the mouse. This number indicates how
   * long each step should take (in milliseconds).
   */
  protected static MOUSE_DOWN_INCREMENT_INTERVAL: number = 100

  /**
   * Minimum amount of size for the thumb
   */
  protected static MINIMUM_SIZE: number = 200

  /**
   * Orientation of the slider.
   */
  protected orientation: Orientation
  protected incTimer: number = 0
  protected incrementing: boolean
  protected lastMousePosition: number
  protected lastThumbDownPosition: number
  protected lastMouseDownPosition: number

  /**
   * The amount to increment/decrement for page up/down as well as when holding
   * down the mouse button on the background.
   */
  protected blockIncrement: number = 10

  /**
   * The thumb size ratio
   */
  protected thumbSizeRatio: number = 0.0
  protected firstArrow: HTMLDivElement
  protected secondArrow: HTMLDivElement
  protected valueThumb: HTMLDivElement
  protected dragging: boolean = false

  /**
   * The model for the range of the slider.
   */
  protected rangeModel: RangeModel

  constructor() {
    super()
    this.orientation = Orientation.HORIZONTAL
    this.firstArrow = document.createElement('div')
    this.firstArrow.className = Scrollbar.ARROW_CSS_CLASS
    this.secondArrow = document.createElement('div')
    this.secondArrow.className = Scrollbar.ARROW_CSS_CLASS
    this.valueThumb = document.createElement('div')
    this.valueThumb.className = Scrollbar.THUMB_CSS_CLASS
    this.rangeModel = new RangeModel(this)
  }

  /**
   * Returns CSS class applied to the slider element.
   * @param orientation The orientation of the slider
   */
  static getCssClass(orientation: Orientation): string {
    // There is a bug which incorrectly doesn't get the type of the orientation correctly. This is
    // the workaround so that it compiles.
    return orientation === Orientation.VERTICAL
      ? 'sliderVertical'
      : 'sliderHorizontal'
  }

  override createDom() {
    super.createDom()
    const element = document.createElement('div')
    element.className = Scrollbar.getCssClass(this.orientation)
    this.decorateInternal(element)
    const arrowSymbol =
      this.orientation === Orientation.VERTICAL ? '\u25be' : '\u25b8'
    this.firstArrow.innerHTML = arrowSymbol
    this.secondArrow.innerHTML = arrowSymbol
    mb.setElementStyle(this.firstArrow, 'transform', 'rotate(180deg)')
    mb.setElementStyle(this.firstArrow, '-webkit-transform', 'rotate(180deg)')
    mb.setElementStyle(this.firstArrow, '-ms-transform', 'rotate(180deg)')
    this.firstArrow.classList.add('nonSelectable')
    this.secondArrow.classList.add('sliderArrowEnd')
    this.secondArrow.classList.add('nonSelectable')
    element.appendChild(this.valueThumb)
    element.appendChild(this.firstArrow)
    element.appendChild(this.secondArrow)
    this.redraw()
  }

  override decorateInternal(element: HTMLElement) {
    super.decorateInternal(element)
    element.classList.add(Scrollbar.getCssClass(this.orientation))
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(this, EventType.CHANGE, () => this.handleRangeModelChange())
      .listen(this.firstArrow, EventType.MOUSEDOWN, (e: MouseEvent) =>
        this.onHandleArrowMouseDown(e)
      )
      .listen(this.secondArrow, EventType.MOUSEDOWN, (e: MouseEvent) =>
        this.onHandleArrowMouseDown(e)
      )
      .listen(
        this.valueThumb,
        [EventType.TOUCHSTART, EventType.MOUSEDOWN],
        (e: MouseEvent) => this.onHandleThumbMouseDown(e)
      )
      .listen(this.getElement(), EventType.MOUSEDOWN, (e: MouseEvent) =>
        this.onHandleScrollbarbMouseDown(e)
      )
  }

  override dispose() {
    clearTimeout(this.incTimer)
    super.dispose()
  }

  /**
   * Handler for the before drag event. We use the event properties to determine the new value.
   * @param e The drag event used to drag the thumb.
   */
  protected onHandleThumbMouseDown(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!this.dragging) {
      this.dragging = true
      this.valueThumb.classList.add(Scrollbar.THUMB_DRAGGING_CSS_CLASS)
      if (this.orientation === Orientation.VERTICAL) {
        this.lastThumbDownPosition = this.valueThumb.offsetTop
        this.lastMouseDownPosition = e.clientY
      } else {
        this.lastThumbDownPosition = this.valueThumb.offsetLeft
        this.lastMouseDownPosition = e.clientX
      }
      const documentElement = document.documentElement
      this.getHandler()
        .listen(
          documentElement,
          [EventType.TOUCHMOVE, EventType.MOUSEMOVE],
          (e: MouseEvent) => this.onHandleThumbMouseMove(e)
        )
        .listen(documentElement, [EventType.TOUCHEND, EventType.MOUSEUP], () =>
          this.onHandleThumbDragStartEnd()
        )
    }
  }

  /**
   * Handler for the before drag event. We use the event properties to determine the new value.
   * @param e The drag event used to drag the thumb.
   */
  protected onHandleThumbMouseMove(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const currentMousePosition =
      this.orientation === Orientation.VERTICAL ? e.clientY : e.clientX
    const deltaPosition = currentMousePosition - this.lastMouseDownPosition
    const position = this.lastThumbDownPosition + deltaPosition
    const availableLength = this.getAvailableLength()
    const value =
      (position / availableLength) * (this.getMaximum() - this.getMinimum()) +
      this.getMinimum()
    const cappedValue = Math.min(
      Math.max(value, this.getMinimum()),
      this.getMaximum()
    )
    this.setValue(cappedValue)
  }

  /**
   * Gets the available length for this scrollbar.
   */
  protected getAvailableLength(): number {
    return this.orientation === Orientation.VERTICAL
      ? this.getElement().clientHeight - this.valueThumb.offsetHeight
      : this.getElement().clientWidth - this.valueThumb.offsetWidth
  }

  /**
   * Handler for the start & end drag event on the thumbs.
   */
  protected onHandleThumbDragStartEnd() {
    this.dragging = false
    const documentElement = document.documentElement
    this.getHandler().unlisten(documentElement, [
      EventType.TOUCHMOVE,
      EventType.MOUSEMOVE,
      EventType.TOUCHEND,
      EventType.MOUSEUP,
    ])
    this.valueThumb.classList.remove(Scrollbar.THUMB_DRAGGING_CSS_CLASS)
  }

  /**
   * Handler for the mouse down event and click event.
   * @param e  The mouse event object.
   */
  protected onHandleArrowMouseDown(e: MouseEvent) {
    this.startIncrementing(e, 1)
    e.preventDefault()
    e.stopPropagation()
  }

  /**
   * Handler for the mouse down event and click event.
   * @param e  The mouse event object.
   */
  protected onHandleScrollbarbMouseDown(e: MouseEvent) {
    this.startIncrementing(e, this.getBlockIncrement())
    e.preventDefault()
    e.stopPropagation()
  }

  /**
   * Starts the animation that causes the thumb to increment/decrement.
   * @param e  The mouse event object.
   * @param increment The number to change the value by.
   */
  protected startIncrementing(e: MouseEvent, increment: number) {
    this.storeMousePosition(e)
    if (this.orientation === Orientation.VERTICAL) {
      this.incrementing =
        this.lastMousePosition >
        this.valueThumb.offsetTop + this.valueThumb.offsetHeight
    } else {
      this.incrementing =
        this.lastMousePosition >
        this.valueThumb.offsetLeft + this.valueThumb.offsetWidth
    }
    this.getHandler()
      .listen(document, EventType.MOUSEUP, () => this.stopBlockIncrementing())
      .listen(this.getElement(), EventType.MOUSEMOVE, (e: MouseEvent) =>
        this.storeMousePosition(e)
      )
    if (this.incTimer == 0) {
      this.incTimer = window.setInterval(
        () => this.onHandleSingleIncrement(increment),
        Scrollbar.MOUSE_DOWN_INCREMENT_INTERVAL
      )
    }
    this.onHandleSingleIncrement(increment)
  }

  /**
   * Handler for the tick event dispatched by the timer used to update the value with an increment.
   * @param increment The number to change the value by.
   */
  protected onHandleSingleIncrement(increment: number) {
    let value
    if (this.orientation === Orientation.VERTICAL) {
      const mouseY = this.lastMousePosition
      const thumbY = this.valueThumb.offsetTop
      if (this.incrementing) {
        const thumbH = this.valueThumb.offsetHeight
        if (mouseY > thumbY + thumbH) {
          value = this.getValue() + increment
        }
      } else {
        if (mouseY < thumbY) {
          value = this.getValue() - increment
        }
      }
    } else {
      const mouseX = this.lastMousePosition
      const thumbX = this.valueThumb.offsetLeft
      if (this.incrementing) {
        const thumbW = this.valueThumb.offsetWidth
        if (mouseX > thumbX + thumbW) {
          value = this.getValue() + increment
        }
      } else {
        if (mouseX < thumbX) {
          value = this.getValue() - increment
        }
      }
    }
    if (value !== undefined) {
      value = Math.min(Math.max(value, this.getMinimum()), this.getMaximum())
      this.setValue(value)
    }
  }

  /**
   * Stops the block incrementing animation and unlistens the necessary event handlers.
   */
  protected stopBlockIncrementing() {
    clearTimeout(this.incTimer)
    this.incTimer = 0
    this.getHandler()
      .unlisten(document, EventType.MOUSEUP)
      .unlisten(this.getElement(), EventType.MOUSEMOVE)
  }

  /**
   * Stores the current mouse position so that it can be used in the timer.
   * @param e  The mouse event object.
   */
  private storeMousePosition(e: MouseEvent) {
    const elementRect = this.getElement().getBoundingClientRect()
    this.lastMousePosition =
      this.orientation === Orientation.VERTICAL
        ? e.clientY - elementRect.top
        : e.clientX - elementRect.left
  }

  /**
   * Moves the thumbs by the specified delta as follows
   * - as long as both thumbs stay within [min,max], both thumbs are moved
   * - once a thumb reaches or exceeds min (or max, respectively), it stays
   * - at min (or max, respectively).
   * In case both thumbs have reached min (or max), no change event will fire.
   * If the specified delta is smaller than the step size, it will be rounded
   * to the step size.
   * @param delta The delta by which to move the selected range.
   */
  moveThumbs(delta: number) {
    // Assume that a small delta is supposed to be at least a step.
    if (Math.abs(delta) < this.getStep()) {
      const sign = delta > 0 ? 1 : -1
      delta = sign * this.getStep()
    }
    this.setValue(this.getValue() * delta)
  }

  /**
   * Call back when the internal range model changes. Sub-classes may override
   * and re-enter this method to update a11y state.
   */
  protected handleRangeModelChange() {
    this.redraw()
  }

  /**
   * This is called when we need to update the size of the thumb. This happens
   * when first created as well as when the value and the orientation changes.
   */
  redraw() {
    if (!this.valueThumb) {
      return
    }
    const position = this.getThumbCoordinateForValue(this.getValue())
    const thumbSize = this.getThumbSize()
    if (this.orientation === Orientation.VERTICAL) {
      this.valueThumb.style.top = position + 'px'
      this.valueThumb.style.height = thumbSize + 'px'
    } else {
      this.valueThumb.style.left = position + 'px'
      this.valueThumb.style.width = thumbSize + 'px'
    }
  }

  /**
   * Returns the position to move the handle to for a given value
   * @param value  The value to get the coordinate for.
   */
  getThumbCoordinateForValue(value: number): number {
    const min = this.getMinimum()
    const max = this.getMaximum()
    const scrollWidth = this.getScrollWidth()

    // This check ensures the ratio never take NaN value, which is possible when
    // the slider min & max are same numbers (i.e. 1).
    const ratio = value === min && min === max ? 0 : (value - min) / (max - min)
    if (this.orientation === Orientation.VERTICAL) {
      const height =
        this.getElement().clientHeight -
        this.valueThumb.offsetHeight -
        scrollWidth * 2
      return Math.round(ratio * height) + scrollWidth
    } else {
      const width =
        /* the two arrows' width */
        this.getElement().clientWidth - this.valueThumb.offsetWidth - 34
      return Math.round(ratio * width) + scrollWidth
    }
  }

  /**
   * Returns the size of the new thumb
   */
  protected getThumbSize(): number {
    const availableSize =
      this.orientation === Orientation.VERTICAL
        ? this.getElement().clientHeight
        : this.getElement().clientWidth
    return Math.floor(
      Math.max(this.thumbSizeRatio * availableSize, Scrollbar.MINIMUM_SIZE)
    )
  }

  /**
   * Changes the orientation.
   * @param orient The orientation.
   */
  setOrientation(orient: Orientation) {
    if (this.orientation === orient) {
      return
    }

    const oldCss = Scrollbar.getCssClass(this.orientation)
    const newCss = Scrollbar.getCssClass(orient)
    this.orientation = orient
    if (this.isInDocument()) {
      this.getElement().classList.replace(oldCss, newCss)

      // we need to reset the left and top, plus range highlight
      this.valueThumb.style.left = this.valueThumb.style.top = ''
      this.redraw()
    }
  }

  /**
   * @return the orientation of the slider.
   */
  getOrientation(): Orientation {
    return this.orientation
  }

  /**
   * The amount to increment/decrement for page up/down as well as when holding down the mouse button
   * on the background.
   */
  getBlockIncrement(): number {
    return this.blockIncrement
  }

  /**
   * Sets the amount to increment/decrement for page up/down as well as when
   * holding down the mouse button on the background.
   *
   * @param value The value to set the block increment to.
   */
  setBlockIncrement(value: number) {
    this.blockIncrement = value
  }

  /**
   * @return The step value used to determine how to round the value.
   */
  getStep(): number {
    return this.rangeModel.getStep()
  }

  /**
   * Sets the step value. The step value is used to determine how to round the
   * value.
   * @param step  The step size.
   */
  setStep(step: number) {
    this.rangeModel.setStep(step)
  }

  /**
   * @return The value of the underlying range model.
   */
  getValue(): number {
    return this.rangeModel.getValue()
  }

  /**
   * Sets the value of the underlying range model.
   * If this is not satisifed for the given value, the call is ignored and no CHANGE event fires.
   * @param value The value.
   */
  setValue(value: number) {
    // Round first so that all computations and checks are consistent.
    const roundedPosition = this.rangeModel.roundToStepWithMin(value)
    if (
      roundedPosition >= this.getMinimum() &&
      this.getMaximum() >= roundedPosition
    ) {
      // because the underlying range model applies adjustements of value
      this.rangeModel.setValue(value)
    }
  }

  /**
   * @return The minimum value.
   */
  getMinimum(): number {
    return this.rangeModel.getMinimum()
  }

  /**
   * Sets the minimum number.
   * @param min The minimum value.
   */
  setMinimum(min: number) {
    this.rangeModel.setMinimum(min)
  }

  /**
   * @return The maximum value.
   */
  getMaximum(): number {
    return this.rangeModel.getMaximum()
  }

  /**
   * Sets the maximum number.
   * @param max The maximum value.
   */
  setMaximum(max: number) {
    this.setEnabled(max !== 0)
    this.rangeModel.setMaximum(max)
  }

  /**
   * Sets the thumb size ratio
   * @param ratio The ratio of the thumb size
   */
  setThumbRatio(ratio: number) {
    this.thumbSizeRatio = Math.max(0.01, Math.min(ratio, 0.99))
  }

  /**
   * Whether to enable the scrollbar
   * @param enabled Whether this scroll should be enabled.
   */
  setEnabled(enabled: boolean) {
    if (enabled) {
      this.valueThumb.classList.remove('disabled')
      this.firstArrow.classList.remove('disabled')
      this.secondArrow.classList.remove('disabled')
    } else {
      this.valueThumb.classList.add('disabled')
      this.firstArrow.classList.add('disabled')
      this.secondArrow.classList.add('disabled')
    }
  }

  getScrollWidth() {
    const element = this.getElement()
    return this.orientation === Orientation.VERTICAL
      ? element.offsetWidth
      : element.offsetHeight
  }

  setScrollWidth(width: number) {
    const widthPx = width + 'px'

    // Update first arrow width and height
    mb.setElementStyle(this.firstArrow, 'height', widthPx)
    mb.setElementStyle(this.firstArrow, 'line-height', widthPx)
    mb.setElementStyle(this.firstArrow, 'width', widthPx)

    // Update second arrow width and height
    mb.setElementStyle(this.secondArrow, 'height', widthPx)
    mb.setElementStyle(this.secondArrow, 'line-height', widthPx)
    mb.setElementStyle(this.secondArrow, 'width', widthPx)
    const dimension =
      this.orientation === Orientation.VERTICAL ? 'width' : 'height'
    mb.setElementStyle(this.getElement(), dimension, widthPx)
  }
}

/**
 * Enum for representing the orientation of the slider.
 */
export enum Orientation {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}
