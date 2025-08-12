/**
 * Determines whether an element is entirely displayed on the screen.
 *
 * @param el the element to test
 * @param badElements the elements that the element shouldn't be under
 * @return Whether the element is fully on the screen
 */
export function isFullyOnScreen(el: Element, badElements?: Element[]): boolean {
  const elementRect = el.getBoundingClientRect()

  // Elements that are not on the screen do not dimensions.
  let isFullyOnScreen = elementRect.width != 0 && elementRect.height != 0
  for (
    let x = 0;
    badElements && isFullyOnScreen && x < badElements.length;
    x++
  ) {
    const badElementRect = badElements[x].getBoundingClientRect()
    isFullyOnScreen =
      isFullyOnScreen && !intersects(badElementRect, elementRect)
  }
  return isFullyOnScreen
}

/**
 * Determines whether two DOMRect intersects.
 *
 * @returns Whether the DOMRects intersect.
 */
function intersects(rect1: DOMRect, rect2: DOMRect): boolean {
  return (
    rect1.bottom > rect2.top &&
    rect1.right > rect2.left &&
    rect1.top < rect2.bottom &&
    rect1.left < rect2.right
  )
}

/**
 * Get the parent element which contains the given tag name.
 * @param element The element to query
 * @param tagName the tagName to query
 * @return The TR element of an element or null if it can't find one.
 */
export function getElementParent<T extends HTMLElement>(
  element: any,
  tagName: string
): T {
  while (element && element.tagName !== tagName) {
    element = element.parentElement
  }
  return element
}

/**
 * Convert an array of strings to an array of integers. Every caller of this function should orginially be an array of
 * integers. We should convert them to ints when we get rid of the old Flash ME.
 * @param array The array to convert to integers
 * @return The same array but as numbers
 */
export function convertToNumberArray(array: string[]): number[] {
  return array.map((element) => parseInt(element, 10))
}

export type SearchOptions = {
  limitToTaxon?: number
  limitToNPACells?: boolean
  limitToPolymorphicCells?: boolean
  limitToScoredCells?: boolean
  limitToText?: boolean
  limitToUndocumentedCells?: boolean
  limitToUnimagedCells?: boolean
  limitToUnreadComments?: boolean
  limitToUnscoredCells?: boolean
  limitToUnusedMedia?: boolean
  limitWithWarnings?: boolean
  text?: string
}

export type SearchResults = { label: string; id: number; otherId: number }

/**
 * Replace or append a child to an element.
 */
export function replaceOrAppendChild(
  element: Element,
  newNode: Node,
  oldNode: Node
) {
  if (oldNode) {
    element.replaceChild(newNode, oldNode)
  } else {
    element.appendChild(newNode)
  }
}

/**
 * @return Whether this device is a mobile device or a tablet.
 */
export function isMobileOrTablet(): boolean {
  const userAgent = window.navigator.userAgent
  return (
    userAgent.includes('iPhone') ||
    userAgent.includes('iPad') ||
    userAgent.includes('Android') ||
    userAgent.includes('Mobile')
  )
}

/**
 * @return Whether this device is a Macintosh.
 */
export function isMacintosh(): boolean {
  const userAgent = window.navigator.userAgent
  return userAgent.includes('Macintosh')
}

/**
 * Converts an html characterSet into its original character.
 *
 * @param str htmlSet entities
 * @return The converted string
 */
export function decodeHTMLEntities(str: string): string {
  return str.replace(/&#(x)?(\d+);/g, function (match, hex, dec) {
    const charcode = parseInt(dec, hex ? 16 : 10)
    return String.fromCharCode(charcode)
  })
}

/**
 * Checks if a string is empty or contains only whitespaces.
 * @param str The string to check.
 * @return Whether `str` is empty or whitespace only.
 */
export function isEmptyOrWhitespace(str: string): boolean {
  // testing length == 0 first is actually slower in all browsers (about the
  // same in Opera).
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return /^[\s\xa0]*$/.test(str)
}

/**
 * Truncates a string to a certain length and adds '...' if necessary.  The
 * length also accounts for the ellipsis, so a maximum length of 10 and a string
 * 'Hello World!' produces 'Hello W...'.
 * @param str The string to truncate.
 * @param chars Max number of characters.
 * @return The truncated `str` string.
 */
export function truncateString(str: string, chars: number): string {
  if (str.length > chars) {
    str = str.substring(0, chars - 3) + '...'
  }
  return str
}

/**
 * Returns the index of the first element of an array with a specified value, or
 * -1 if the element is not present in the array.
 *
 * @param arr The array to be searched.
 * @param obj The object for which we are searching.
 * @return The index of the first matching array element.
 * @template T
 */
export function indexOf<T>(arr: ArrayLike<T> | string, obj: T): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === obj) {
      return i
    }
  }
  return -1
}

/**
 * Removes the first occurrence of a particular value from an array.
 * @param arr Array from which to remove
 *     value.
 * @param obj Object to remove.
 * @return True if an element was removed.
 * @template T
 */
export function remove<T>(arr: Array<T>, obj: T): boolean {
  const i = arr.indexOf(obj)
  let rv
  if ((rv = i >= 0)) {
    removeAt(arr, i)
  }
  return rv
}

/**
 * Removes from an array the element at index i
 * @param arr Array or array like object from which to
 *     remove value.
 * @param i The index to remove.
 * @return True if an element was removed.
 */
export function removeAt(arr: ArrayLike<any>, i: number): boolean {
  // use generic form of splice
  // splice returns the removed items and if successful the length of that
  // will be 1
  return Array.prototype.splice.call(arr, i, 1).length == 1
}

/**
 * Whether the array contains the given object.
 * @param arr The array to test for the presence of the
 *     element.
 * @param obj The object for which to test.
 * @template T
 * @return true if obj is present.
 */
export function contains<T>(arr: Array<T>, obj: T): boolean {
  return arr.indexOf(obj) >= 0
}

/**
 * Inserts an object at the given index of the array.
 * @param arr The array to modify.
 * @param obj The object to insert.
 * @param opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
export function insertAt<T>(arr: Array<T>, obj: T, opt_i: number) {
  arr.splice(opt_i, 0, obj)
}

/**
 * Inserts at the given index of the array, all elements of another array.
 * @param arr The array to modify.
 * @param elementsToAdd The array of elements to add.
 * @param i The index at which to insert the object.
 */
export function insertArrayAt<T>(
  arr: Array<T>,
  elementsToAdd: Array<any>,
  i: number
) {
  arr.splice.apply(arr, [i, 0].concat(elementsToAdd))
}

/**
 * Moves one item of an array to a new position keeping the order of the rest
 * of the items. Example use case: keeping a list of JavaScript objects
 * synchronized with the corresponding list of DOM elements after one of the
 * elements has been dragged to a new position.
 * @param arr The array to modify.
 * @param fromIndex Index of the item to move between 0 and
 *     `arr.length - 1`.
 * @param toIndex Target index between 0 and `arr.length - 1`.
 */
export function moveItem(arr: Array<any>, fromIndex: number, toIndex: number) {
  const removedItems = Array.prototype.splice.call(arr, fromIndex, 1)
  Array.prototype.splice.call(arr, toIndex, 0, removedItems[0])
}

/**
 * Removes all the child nodes on a DOM node.
 * @param node Node to remove children from.
 */
export function removeChildren(node: Node): void {
  // Note: Iterations over live collections can be slow, this is the fastest
  // we could find. The double parenthesis are used to prevent JsCompiler and
  // strict warnings.
  let child
  while ((child = node.firstChild)) {
    node.removeChild(child)
  }
}

/**
 * Sets a specific property of an element's style.
 */
export function setElementStyle(
  element: HTMLElement,
  property: string,
  value: string
) {
  element.style.setProperty(property, value)
}

/**
 * Gets a specific property of an element's style.
 * @return The value of the property
 */
export function getElementStyle(
  element: HTMLElement,
  property: string
): string {
  return element.style.getPropertyValue(property)
}

let SCROLLBAR_WIDTH: number

/**
 * Gets the scrollbar width.
 */
export function getScrollbarWidth(): number {
  // Cache the scrollbarWidth since it causes reflow.
  if (!SCROLLBAR_WIDTH) {
    const outerDiv = document.createElement('div')
    outerDiv.style.cssText =
      'overflow:auto;position:absolute;top:0;width:100px;height:100px'
    const innerDiv = document.createElement('div')
    setElementStyle(innerDiv, 'height', '200px')
    setElementStyle(innerDiv, 'width', '200px')
    outerDiv.appendChild(innerDiv)
    document.body.appendChild(outerDiv)

    SCROLLBAR_WIDTH = outerDiv.offsetWidth - outerDiv.clientWidth
    document.body.removeChild(outerDiv)
  }
  return isMobileOrTablet() ? 30 : SCROLLBAR_WIDTH || 15
}

/**
 * Calculate the scroll position of `container` with the minimum amount so
 * that the content and the borders of the given `element` become visible.
 * If the element is bigger than the container, its top left corner will be
 * aligned as close to the container's top left corner as possible.
 *
 * @param element The element to make visible.
 * @param container The container to scroll.
 * @param opt_center Whether to center the element in the container.
 *     Defaults to false.
 * @return The new scroll position of the container.
 */
export function getContainerOffsetToScrollInto(
  element: HTMLElement,
  container: Element,
  opt_center?: boolean
): DOMPoint {
  // Absolute position of the element's border's top left corner.
  const elementPos = element.getBoundingClientRect()

  // Absolute position of the container's border's top left corner.
  const containerPos = container.getBoundingClientRect()
  const containerBorderStyles = window.getComputedStyle(container, null)
  const containerBorderLeft =
    parseFloat(containerBorderStyles.getPropertyValue('borderLeftWidth')) || 0
  const containerBorderTop =
    parseFloat(containerBorderStyles.getPropertyValue('borderTopWidth')) || 0

  // Relative pos. of the element's border box to the container's content box.
  const relX = elementPos.x - containerPos.x - containerBorderLeft
  const relY = elementPos.y - containerPos.y - containerBorderTop

  // How much the element can move in the container, i.e. the difference between
  // the element's bottom-right-most and top-left-most position where it's
  // fully visible.
  const spaceX = container.clientWidth - element.offsetWidth
  const spaceY = container.clientHeight - element.offsetHeight
  let scrollLeft = container.scrollLeft
  let scrollTop = container.scrollTop
  if (opt_center) {
    // All browsers round non-integer scroll positions down.
    scrollLeft += relX - spaceX / 2
    scrollTop += relY - spaceY / 2
  } else {
    // This formula was designed to give the correct scroll values in the
    // following cases:
    // - element is higher than container (spaceY < 0) => scroll down by relY
    // - element is not higher that container (spaceY >= 0):
    //   - it is above container (relY < 0) => scroll up by abs(relY)
    //   - it is below container (relY > spaceY) => scroll down by relY - spaceY
    //   - it is in the container => don't scroll
    scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0))
    scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
  return new DOMPoint(scrollLeft, scrollTop)
}

/**
 * Changes the scroll position of `container` with the minimum amount so
 * that the content and the borders of the given `element` become visible.
 * If the element is bigger than the container, its top left corner will be
 * aligned as close to the container's top left corner as possible.
 *
 * @param element The element to make visible.
 * @param container The container to scroll.
 * @param opt_center Whether to center the element in the container.
 *     Defaults to false.
 */
export function scrollIntoContainerView(
  element: HTMLElement,
  container: Element,
  opt_center?: boolean
) {
  const offset = getContainerOffsetToScrollInto(element, container, opt_center)
  container.scrollLeft = offset.x
  container.scrollTop = offset.y
}

/**
 * Returns the keys of the object/map/hash.
 *
 * @param obj The object from which to get the keys.
 * @return Array of property keys.
 */
export function getKeys(obj: Object): string[] {
  const res: string[] = []
  let i = 0
  for (const key in obj) {
    res[i++] = key
  }
  return res
}

/**
 * Returns a shallow clone of the object.
 *
 * @param obj Object to clone.
 * @return Clone of the input object.
 * @template K,V
 */
export function clone(obj: { [key: string]: any }): Object {
  // We cannot use the prototype trick because a lot of methods depend on where
  // the actual key is set.
  const res: { [key: string]: any } = {}
  for (let key in obj) {
    res[key] = obj[key]
  }
  return res
}

/**
 * Whether the object/map/hash contains the given value. This is O(n).
 *
 * @param obj The object in which to look for val.
 * @param val The value for which to check.
 * @return true If the map contains the value.
 * @template K,V
 */
export function containsValue(obj: any, val: any): boolean {
  for (let key in obj) {
    if (obj[key] == val) {
      return true
    }
  }
  return false
}

/**
 * Whether the object/map/hash is empty.
 *
 * @param obj The object to test.
 * @return true if obj is empty.
 */
export function isEmpty(obj: Object): boolean {
  for (let key in obj) {
    return false
  }
  return true
}

/**
 * Extends an object with another object.
 * This operates 'in-place'; it does not create a new Object.
 *
 * @param target The object to modify. Existing properties will be
 *     overwritten if they are also present in one of the objects in
 *     {@code args}.
 * @param varArgs The objects from which values will be copied.
 */
export function extend(target: { [key: string]: any }, ...args: any[]) {
  for (let i = 0; i < args.length; i++) {
    const source = args[i]
    for (const key in source) {
      target[key] = source[key]
    }
  }
}

/**
 * Escapes a string.
 * @param str The string to escape.
 * @returns The escaped string.
 */
export function htmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\x00/g, '&#0;')
}

/**
 * Escapes a string and converts line breaks to HTML <br/> tags.
 * @param str The string to escape and convert.
 * @returns The escaped string with line breaks converted to HTML.
 */
export function htmlEscapeWithLineBreaks(str: string): string {
  return htmlEscape(str).replace(/\n/g, '<br/>')
}

/**
 * Normalizes whitespace in a string, replacing all whitespace chars with
 * a space.
 * @param str The string in which to normalize whitespace.
 * @return A copy of `str` with all whitespace normalized.
 */
export function normalizeWhitespace(str: string): string {
  return str.replace(/\xa0|\s/g, ' ')
}

/**
 * @return Whether local storage is available.
 */
export function isLocalStorageAvailable(): boolean {
  const test = 'test'
  try {
    window.localStorage.setItem(test, test)
    window.localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}
