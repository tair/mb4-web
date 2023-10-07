import { Component, EventType, MobileFriendlyClickEventType } from './Component'
import * as ReorderEvents from '../events/ReorderEvent'
import * as mb from '../mb'

/**
 * The grid table.
 */
export class DataGridTable extends Component {
  /**
   * The css selectors to apply to an element
   */
  private static readonly CSS = {
    DISABLED: 'disabled',
    DROPPABLE: 'droppable',
    EMPTY: 'empty',
    REMOVE: 'remove',
    REMOVEABLE: 'removeable',
    SELECTED: 'selected',
  }

  private static dragStarted: number
  private static dragDirection: number
  private static scrollingTimer: number

  protected columns: DataColumn[]
  protected rows: DataRow[]
  private resizeObserver: ResizeObserver

  private focusable: boolean
  private selectable: boolean
  private draggable: boolean

  private scrollableContainer: HTMLElement
  private lastSelectedElement: HTMLElement

  constructor() {
    super()
    this.columns = []
    this.rows = []
    this.focusable = true
    this.selectable = false
    this.draggable = false
  }

  protected override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('dataGrid')
    element.classList.add('nonSelectable')

    this.redraw()
  }

  protected override enterDocument() {
    super.enterDocument()
    const element = this.getElement()
    const handler = this.getHandler()
    handler
      .listen(element, EventType.CLICK, (e) => this.handleClick(e))
      .listen(element, MobileFriendlyClickEventType, (e: Event) =>
        this.handleDoubleClick(e)
      )
  }

  override dispose() {
    super.dispose()
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  }

  /**
   * Whether to set the data grid as selectable given the parameter.
   * @param selectable Whether this data grid will be selectable
   */
  setSelectable(selectable: boolean) {
    this.selectable = selectable
  }

  /**
   * Whether to set the data grid as draggable given the parameter.
   * @param draggable Whether this data grid's rows can be dragged and dropped.
   */
  setDraggable(draggable: boolean) {
    this.draggable = draggable
  }

  /**
   * Whether to set the data grid as focusable given the parameter.
   * @param focusable Whether this data grid can be focused and navigable.
   */
  setFocusable(focusable: boolean) {
    this.focusable = focusable
  }

  /**
   * Redraws data grid
   */
  redraw() {
    const oldScrollingPane = this.getElementByClass('topGrid')
    const oldScrollTop = oldScrollingPane ? oldScrollingPane.scrollTop : 0
    this.scrollableContainer = document.createElement('div')
    this.scrollableContainer.classList.add('topGrid')
    const table = this.createTable()
    this.scrollableContainer.appendChild(table)
    const element = this.getElement()

    // We replace instead of remove/insert so that we don't have a lag effect
    // when scrolling and redrawing.
    mb.replaceOrAppendChild(element, this.scrollableContainer, oldScrollingPane)
    if (oldScrollTop) {
      this.scrollableContainer.scrollTop = oldScrollTop
    }

    const redrawItems = () => {
      if (table.clientHeight == 0) {
        return
      }

      const remainingHeight =
        this.scrollableContainer.clientHeight - table.clientHeight

      if (remainingHeight > 0) {
        mb.setElementStyle(this.scrollableContainer, 'overflow', 'hidden')

        const tbody = table.getElementsByTagName('tbody')[0]
        const firstEmptyTr = this.createEmptyTr()
        tbody.appendChild(firstEmptyTr)

        // Get the height of the newly added empty row and use it to calculate
        // how many rows to add. If the height isn't calculated yet, we will
        // wait until the next render.
        const trHeight = firstEmptyTr.clientHeight
        if (trHeight == 0) {
          return
        }

        const rowsToAdd = remainingHeight / trHeight
        for (let x = 0; x <= rowsToAdd; x++) {
          tbody.appendChild(this.createEmptyTr())
        }
      }
    }

    // Redraw on the next animation frame so that we can get updated height and
    // width.
    requestAnimationFrame(redrawItems)

    // Redaw the grid when the height changes.
    this.resizeObserver = new ResizeObserver(redrawItems)
    this.resizeObserver.observe(element)
  }

  /**
   * @return The new header row
   */
  private createHeader(): Element {
    const tr = document.createElement('tr')
    for (let x = 0; x < this.columns.length; x++) {
      const column = this.columns[x]
      const th = document.createElement('th')
      th.innerHTML = column.label
      tr.appendChild(th)
    }
    return tr
  }

  /**
   * @return The new table
   */
  private createTable(): Element {
    const table = document.createElement('table')
    if (this.focusable) {
      table.setAttribute('tabindex', '0')
    }
    if (this.columns.length > 0) {
      const thead = document.createElement('thead')
      thead.appendChild(this.createHeader())
      table.appendChild(thead)
    }
    const tbody = document.createElement('tbody')
    if (this.rows.length === 0) {
      tbody.appendChild(this.createEmptyTr())
    }
    const columnSize = this.columns.length || 1
    for (let x = 0; x < this.rows.length; x++) {
      const row = this.rows[x]
      const tr = document.createElement('tr')
      if (row.className) {
        tr.classList.add(row.className)
      }
      if (row.tooltip) {
        tr.title = row.tooltip
      }
      if (row.data) {
        for (const key in row.data) {
          const value = String(row.data[key])
          tr.dataset[key] = value
        }
      }
      for (let y = 0; y < columnSize; y++) {
        const td = document.createElement('td')
        const label = row.labels[y]
        if (label instanceof Component) {
          label.render(td)
        } else {
          td.innerHTML = String(label)
        }
        tr.appendChild(td)
      }
      if (row.removeable) {
        const removeableIndex = row.removeableIndex || 0
        const firstTd = tr.getElementsByTagName('td')[removeableIndex]
        firstTd.classList.add(DataGridTable.CSS.REMOVEABLE)
        const removeSpan = document.createElement('span')
        removeSpan.classList.add(DataGridTable.CSS.REMOVE)
        firstTd.appendChild(removeSpan)
      }
      if (row.disabled) {
        tr.classList.add(DataGridTable.CSS.DISABLED)
      }
      if (this.draggable) {
        tr.draggable = true
        this.getHandler()
          .listen(tr, EventType.DRAGSTART, (e: DragEvent) =>
            this.onHandleDragStart(e)
          )
          .listen(tr, EventType.DRAGEND, () => this.onHandleDragEnd())
          .listen(tr, EventType.DROP, (e: DragEvent) => this.onHandleDrop(e))
          .listen(
            tr,
            [EventType.DRAGOVER, EventType.DRAGENTER],
            (e: DragEvent) => this.onHandleDragEnter(e)
          )
          .listen(
            tr,
            [EventType.DRAGOUT, EventType.DRAGLEAVE],
            (e: DragEvent) => this.onHandleDragLeave(e)
          )
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    return table
  }

  /**
   * @return An empty tr row
   */
  private createEmptyTr(): Element {
    const tr = document.createElement('tr')
    tr.classList.add(DataGridTable.CSS.EMPTY)
    const columnSize = this.columns.length || 1
    for (let y = 0; y < columnSize; y++) {
      const td = document.createElement('td')
      tr.appendChild(td)
    }
    return tr
  }

  /**
   * Adds a column to the data table.
   * @param column the column to add to the table
   * @param opt_type the type of the column to add (defaults to string)
   */
  addColumn(column: string, type?: DataType) {
    this.addColumnAt(this.columns.length, column, type)
  }

  /**
   * Adds a column to the data table.
   * @param index the position to add the column
   * @param column the column to add to the table
   * @param type the type of the column to add (defaults to string)
   */
  private addColumnAt(index: number, column: string, type?: DataType) {
    const datacolumn = { label: column, type: type } as DataColumn
    mb.insertAt(this.columns, datacolumn, index)
    for (let x = 0; x < this.rows.length; x++) {
      const row = this.rows[x]
      mb.insertAt(row.labels, '', index)
    }
  }

  /**
   * Adds a row to the data table.
   * @param rows the rows to add to the table
   */
  addRows(rows: DataRow[]) {
    this.addRowsAt(this.rows.length - 1, rows)
  }

  /**
   * Adds a row to the data table.
   * @param index The index to add the row
   * @param rows the row to add to the table
   */
  addRowsAt(index: number, rows: DataRow[]) {
    mb.insertArrayAt(this.rows, rows, index)
  }

  /** Clears the rows. Does not draw grid. */
  clearRows() {
    this.rows = []
  }

  /**
   * Gets the TR of this grid by the row index.
   * @param rowIndex the index to row
   * @return the element of the row and column in this grid
   */
  getRowElement(rowIndex: number): Element {
    return this.getRowElements()[rowIndex]
  }

  /**
   * @return the elements of the row and column in this grid
   */
  getRowElements(): HTMLCollectionOf<Element> {
    const dataGrid = this.getElementByClass('topGrid')
    const tbody = dataGrid.getElementsByTagName('TBODY')[0]
    return tbody.getElementsByTagName('TR')
  }

  /**
   * Handles events from mouse down in the row.
   * @param e The event that triggerd this callback.
   */
  protected handleClick(e: Event) {
    const targetElement = e.target as Element
    const tr = this.getParentTrElement<HTMLDivElement>(targetElement)
    if (
      !tr ||
      tr.classList.contains(DataGridTable.CSS.EMPTY) ||
      tr.classList.contains(DataGridTable.CSS.DISABLED)
    ) {
      return false
    }
    const eventDetails = { detail: {} }
    mb.extend(eventDetails.detail, tr.dataset)
    if (targetElement.classList.contains(DataGridTable.CSS.REMOVE)) {
      // send new event to listener
      this.dispatchEvent(new CustomEvent(EventType.CUT, eventDetails))
      return true
    }
    if (this.selectable) {
      if (this.lastSelectedElement) {
        this.lastSelectedElement.classList.toggle(DataGridTable.CSS.SELECTED)
      }
      tr.classList.toggle(DataGridTable.CSS.SELECTED)
      this.lastSelectedElement = tr
    }
    this.dispatchEvent(new CustomEvent(EventType.SELECT, eventDetails))
    return true
  }

  /**
   * Handles events from mouse down in the row.
   * @param e The event that triggerd this callback.
   */
  protected handleDoubleClick(e: Event) {
    const targetElement = e.target as Element
    const tr = this.getParentTrElement<HTMLDivElement>(targetElement)
    if (
      !tr ||
      tr.classList.contains(DataGridTable.CSS.EMPTY) ||
      tr.classList.contains(DataGridTable.CSS.DISABLED)
    ) {
      return false
    }
    const eventDetails = { detail: {} }
    mb.extend(eventDetails.detail, tr.dataset)
    if (targetElement.classList.contains(DataGridTable.CSS.REMOVE)) {
      // send new event to listener
      this.dispatchEvent(new CustomEvent(EventType.CUT, eventDetails))
      return true
    }
    this.dispatchEvent(
      new CustomEvent(MobileFriendlyClickEventType, eventDetails)
    )
    return true
  }

  /**
   * Handles when the drag start event on this component.
   * @param e The event that triggered this callback.
   */
  protected onHandleDragStart(e: DragEvent) {
    DataGridTable.dragStarted = 0
    const element = this.getElement()
    const tbody = element.getElementsByTagName('tbody')[0]
    const trs = tbody.getElementsByTagName('tr')
    const sourceElement = this.getParentTrElement<HTMLTableRowElement>(e.target)
    const sourceIndex = mb.indexOf(trs, sourceElement)
    e.dataTransfer!.clearData()
    e.dataTransfer!.setData('text/plain', String(sourceIndex))
  }

  /**
   * Handles when the drag end event on this component.
   */
  protected onHandleDragEnd() {}

  /**
   * Handles when the drag drop event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleDrop(e: DragEvent) {
    const targetElement = this.getParentTrElement<HTMLTableRowElement>(e.target)
    if (!targetElement) {
      return
    }
    targetElement.classList.remove(DataGridTable.CSS.DROPPABLE)
    const element = this.getElement()
    const tbody = element.getElementsByTagName('tbody')[0]
    const trs = tbody.getElementsByTagName('tr')
    const sourceIndex = parseInt(e.dataTransfer!.getData('text'), 10)
    const targetIndex = mb.indexOf(trs, targetElement)
    if (sourceIndex != targetIndex) {
      this.dispatchEvent(ReorderEvents.create(sourceIndex, targetIndex))
    }
  }

  /**
   * Handles when the drag enter event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleDragEnter(e: DragEvent) {
    // Ensure that the source item is non-empty.
    const trElement = this.getParentTrElement<HTMLTableRowElement>(
      e.currentTarget
    )
    if (!trElement || trElement.classList.contains(DataGridTable.CSS.EMPTY)) {
      return false
    }

    const targetItem = this.getParentTrElement<HTMLTableRowElement>(e.target)
    if (targetItem) {
      e.preventDefault()
      targetItem.classList.add(DataGridTable.CSS.DROPPABLE)
      this.scrollToTrElement(targetItem)
    }
  }

  /**
   * Handles when the drag drag leave event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleDragLeave(e: DragEvent) {
    const trElement = this.getParentTrElement(e.target)
    if (trElement) {
      trElement.classList.remove(DataGridTable.CSS.DROPPABLE)
    }
  }

  /**
   * @param element The element to query
   * @return The TR element of the row.
   */
  protected getParentTrElement<T extends Element>(element: any): T | null {
    if (element === this.getElement()) {
      return null
    }

    while (element) {
      if (element.tagName === 'TR') {
        break
      }
      const parentNode = element.parentNode
      if (element === parentNode) {
        break
      }
      element = parentNode
    }
    return element as T
  }

  /**
   * Scroll to a TR element
   * @param element the element that we may scroll to
   * @return whether we scroll to the element
   */
  protected scrollToTrElement(element: HTMLElement): boolean {
    if (mb.getElementStyle(this.scrollableContainer, 'overflow') === 'hidden') {
      return true
    }

    const offset = mb.getContainerOffsetToScrollInto(
      element,
      this.scrollableContainer,
      /* center */ true
    )
    const delta = offset.y - this.scrollableContainer.scrollTop
    const dragDirection = delta > 1 ? 1 : delta < -1 ? -1 : 0
    if (DataGridTable.dragDirection !== dragDirection) {
      DataGridTable.dragDirection = dragDirection
      DataGridTable.dragStarted = 0
    }
    if (this.scrollableContainer.scrollTop !== offset.y) {
      const speed = Math.max(
        150 / ((++DataGridTable.dragStarted >>> 3) + 1),
        20
      )
      clearTimeout(DataGridTable.scrollingTimer)
      DataGridTable.scrollingTimer = window.setTimeout(
        () => (this.scrollableContainer.scrollTop = offset.y),
        speed
      )
      return true
    }
    return false
  }
}

const enum DataType {
  UNKNOWN = 0,
  NUMBER = 1,
  STRING = 2,
  DATE = 3,
}

// Do nothing
export interface DataColumn {
  label: string
  type: DataType
}

export interface DataRow {
  labels: (string | number | Component)[]
  className?: string
  removeable?: boolean
  removeableIndex?: number
  tooltip?: string
  disabled?: boolean
  data?: { [key: string]: boolean | number | string | null }
}
