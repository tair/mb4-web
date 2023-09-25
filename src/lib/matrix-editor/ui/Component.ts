import { EventHandler } from '../EventHandler'
import { Disposable } from './Disposable'
import { DelegatingEventTarget } from '../DelegatingEventTarget'
import * as mb from '../mb'

/**
 * Defines a UI component within the Matrix Editor. This is the basis of all UI
 * elements on the page. This manages component creation and lifecycle since all
 * event listeners are registered within a component.
 */
export class Component extends DelegatingEventTarget implements Disposable {
  /**
   * Whether this component is in the document.
   */
  protected inDocument: boolean

  /**
   * The DOM element for the component.
   */
  private element: HTMLElement

  /**
   * Array of child components.
   */
  private children: Disposable[]
  private handler: EventHandler
  private disposed: boolean
  private disposableCallbacks: (() => void)[]

  constructor() {
    super()

    this.inDocument = false
    this.disposed = false
    this.children = []
    this.disposableCallbacks = []
  }

  /**
   * Disposes of the component.  Calls `exitDocument`, which is expected to
   * remove event handlers and clean up the component.  Propagates the call to
   * the component's children, if any. Removes the component's DOM from the
   * document unless it was decorated.
   * @override
   */
  dispose() {
    if (this.inDocument) {
      this.exitDocument()
    }

    // Disposes of the component's children, if any.
    this.children.forEach((child) => child.dispose())

    // Detach the component's element from the DOM, unless it was decorated.
    if (this.element) {
      this.element.remove()
    }
    this.disposableCallbacks.forEach((func) => func())
    this.disposed = true
  }

  isDisposed() {
    return this.disposed
  }

  addOnDisposeCallback(callback: () => void) {
    this.disposableCallbacks.push(callback)
  }

  /**
   * Adds a disposable object to this component.
   */
  registerDisposable(child: Disposable) {
    this.children.push(child)
  }

  getHandler(): EventHandler {
    if (!this.handler) {
      this.handler = new EventHandler()
      this.registerDisposable(this.handler)
    }
    return this.handler
  }

  /**
   * Renders the component.  If a parent element is supplied, the component's
   * element will be appended to it.  If there is no optional parent element and
   * the element doesn't have a parentNode then it will be appended to the
   * document body.
   *
   * If this component has a parent component, and the parent component is
   * not in the document already, then this will not call `enterDocument`
   * on this component.
   *
   * Throws an Error if the component is already rendered.
   *
   * @param parentElement Optional parent element to render the
   *    component into.
   */
  render(parentElement?: Element) {
    this.renderInternal(parentElement)
  }

  /**
   * Renders the component before another element. The other element should be in
   * the document already.
   *
   * Throws an Error if the component is already rendered.
   *
   * @param sibling Node to render the component before.
   */
  renderBefore(sibling: Node) {
    this.renderInternal(mb.toElement(sibling.parentNode), sibling)
  }

  /**
   * Renders the component.  If a parent element is supplied, the component's
   * element will be appended to it.  If there is no optional parent element and
   * the element doesn't have a parentNode then it will be appended to the
   * document body.
   *
   * If this component has a parent component, and the parent component is
   * not in the document already, then this will not call `enterDocument`
   * on this component.
   *
   * Throws an Error if the component is already rendered.
   *
   * @param parentElement Optional parent element to render the
   *    component into.
   * @param beforeNode Node before which the component is to
   *    be rendered.  If left out the node is appended to the parent element.
   */
  private renderInternal(parentElement?: Element, beforeNode?: Node) {
    if (this.inDocument) {
      throw new Error('This component was already rendered')
    }

    this.initialize()

    if (!this.element) {
      this.createDom()
    }

    if (!this.element) {
      throw 'Failed to create element'
    }

    if (parentElement) {
      parentElement.insertBefore(this.element, beforeNode || null)
    } else {
      document.body.appendChild(this.element)
    }

    this.enterDocument()
    this.finalizeDom()
  }

  /**
   * Creates the initial DOM representation for the component.
   */
  protected createDom() {
    this.element = document.createElement('div')
  }

  /**
   * Enters the Document.
   */
  protected enterDocument() {
    this.inDocument = true
  }

  /**
   * Sets important properties.
   */
  protected initialize(): void {}

  /**
   * Complete Render
   */
  protected finalizeDom(): void {}

  /**
   * Called by dispose to clean up the elements and listeners created by a
   * component, or by a parent component/application who has removed the
   * component from the document but wants to reuse it later.
   *
   * If the component contains child components, this call is propagated to its
   * children.
   *
   * It should be possible for the component to be rendered again once this method
   * has been called.
   */
  protected exitDocument() {
    this.inDocument = false
  }

  /**
   * Gets the component's element.
   * @return The element for the component.
   */
  getElement<T extends HTMLElement>(): T {
    if (!this.element) {
      throw new Error('This element is not defined')
    }
    return this.element as T
  }

  protected override getDelegate(): EventTarget {
    return this.element
  }

  /**
   * Sets the component's root element to the given element.  Considered
   * protected and final.
   *
   * This should generally only be called during createDom. Setting the element
   * does not actually change which element is rendered, only the element that is
   * associated with this UI component.
   *
   * This should only be used by subclasses and its associated renderers.
   *
   * @param element Root element for the component.
   */
  protected setElementInternal(element: HTMLElement) {
    this.element = element
  }

  /**
   * Determines whether the component has been added to the document.
   * @return TRUE if rendered. Otherwise, FALSE.
   */
  isInDocument(): boolean {
    return this.inDocument
  }

  /**
   * Returns an array of all the elements in this component's DOM with the
   * provided className.
   * @param className The name of the class to look for.
   * @return The items found with the class name provided.
   */
  protected getElementsByClass(className: string): HTMLCollectionOf<Element> {
    return this.getElement().getElementsByClassName(className)
  }

  /**
   * Returns the first element in this component's DOM with the provided
   * className.
   * @param className The name of the class to look for.
   * @return The first item with the class name provided.
   */
  getElementByClass<T extends Element>(className: string): T {
    const elements = this.getElementsByClass(className)
    return elements[0] as T
  }

  /**
   * Decorates the element for the UI component. If the element is in the
   * document, the enterDocument method will be called.
   *
   * @param element Element to decorate.
   */
  decorate(element: HTMLElement) {
    if (this.inDocument) {
      throw new Error('Already rendered')
    }

    this.decorateInternal(element)
    if (document.body.contains(element)) {
      this.enterDocument()
    }
  }

  /**
   * Actually decorates the element. Should be overridden by inheriting objects.
   * This method can assume there are checks to ensure the component has not
   * already been rendered have occurred and that enter document will be called
   * afterwards. This method is considered protected.
   * @param element Element to decorate.
   */
  protected decorateInternal(element: HTMLElement) {
    this.element = element
  }

  /**
   * Propagate an event using this component as an event target.
   * @param e The event to propagate.
   */
  protected propagateEvent(e: Event) {
    this.dispatchEvent(new Event(e.type))
  }

  /**
   * @return A randomized string.
   */
  protected static makeNewId(): string {
    return 'rxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 3) | 8
      return v.toString(36)
    })
  }
}

/**
 * The keys used to identify standard buttons in events.
 */
export const enum EventType {
  BEFOREDRAG = 'beforedrag',
  BEFOREUNLOAD = 'beforeunload',
  BLUR = 'blur',
  CHANGE = 'change',
  CLICK = 'click',
  CUT = 'cut',
  DBLCLICK = 'dblclick',
  DRAGEND = 'dragend',
  DRAGENTER = 'dragenter',
  DRAGLEAVE = 'dragleave',
  DRAGOVER = 'dragover',
  DRAGOUT = 'dragout',
  DRAGSTART = 'dragstart',
  DROP = 'drop',
  KEYDOWN = 'keydown',
  KEYPRESS = 'keypress',
  KEYUP = 'keyup',
  INPUT = 'input',
  MOUSEDOWN = 'mousedown',
  MOUSEENTER = 'mouseenter',
  MOUSELEAVE = 'mouseleave',
  MOUSEMOVE = 'mousemove',
  MOUSEOUT = 'mouseout',
  MOUSEOVER = 'mouseover',
  MOUSEUP = 'mouseup',
  PASTE = 'paste',
  RESIZE = 'resize',
  SCROLL = 'scroll',
  SELECT = 'select',
  TOUCHEND = 'touchend',
  TOUCHMOVE = 'touchmove',
  TOUCHSTART = 'touchstart',
  WHEEL = 'wheel',
}

export const MobileFriendlyClickEventType = mb.isMobileOrTablet()
  ? EventType.CLICK
  : EventType.DBLCLICK

/**
 * The keys used to identify keyboard presses.
 */
export const enum KeyCodes {
  BACKSPACE = 'Backspace',
  DASH = 'Minus',
  DELETE = 'Delete',
  DOWN = 'ArrowDown',
  ENTER = 'Enter',
  LEFT = 'ArrowLeft',
  N = 'KeyN',
  PAGE_DOWN = 'PageDown',
  PAGE_UP = 'PageUp',
  RIGHT = 'ArrowRight',
  SPACE = 'Space',
  UP = 'ArrowUp',
  ZERO = 'Key0',
}
