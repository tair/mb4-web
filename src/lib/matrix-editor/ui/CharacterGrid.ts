import { SavingLabel } from './SavingLabel'
import { Character } from '../data/Characters'
import { CharacterRefreshedEvent } from '../events/CharacterRefreshedEvent'
import * as CharacterRefreshedEvents from '../events/CharacterRefreshedEvent'
import * as mb from '../mb'
import { MatrixModel } from '../MatrixModel'
import { CharacterChangedEvent } from '../events/CharacterChangedEvent'
import * as CharacterChangedEvents from '../events/CharacterChangedEvent'
import { CharacterDetailedGridRenderer } from './CharacterGridRenderer'
import { CharacterGridRenderer } from './CharacterGridRenderer'
import {
  Component,
  EventType,
  KeyCodes,
  MobileFriendlyClickEventType,
} from './Component'
import { CharacterDialog } from './dialogs/CharacterDialog'
import { ConfirmDialog } from './dialogs/ConfirmDialog'
import { ReadonlyCharacterDialog } from './dialogs/ReadonlyCharacterDialog'

/**
 * The grid of the character which includes anything that is visible to the user.
 *
 * @param matrixModel the data associated with the matrix. This includes characters and character
 *     rules.
 * @param savingLabel the lavel used to indicate that the character were altered and are in the
 *     process of being saved.
 * @param readonly Whether the grid is read-only
 */
export class CharacterGrid extends Component {
  /**
   * The css selectors to apply to an element
   */
  private static readonly CSS = {
    DROPPABLE: 'droppable',
    EMPTY: 'empty',
    SELECTED: 'selected',
  }

  private static dragStarted: number = 0
  private static dragDirection: number = 0
  private static scrollingTimer: number = 0

  private matrixModel: MatrixModel
  private readonly savingLabel: SavingLabel
  private readonly readonly: boolean

  private highlightedElement: HTMLElement
  private scrollableContainer: HTMLElement
  private selectedItems: HTMLElement[]
  private renderer: CharacterGridRenderer

  constructor(
    matrixModel: MatrixModel,
    savingLabel: SavingLabel,
    readonly: boolean
  ) {
    super()

    this.matrixModel = matrixModel
    this.savingLabel = savingLabel
    this.readonly = readonly
    this.selectedItems = []
    this.renderer = new CharacterDetailedGridRenderer(
      matrixModel,
      this.readonly
    )
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('characterGrid')
    element.tabIndex = 0
    this.redraw()
  }

  override enterDocument() {
    super.enterDocument()
    const element = this.getElement()
    const handler = this.getHandler()
    handler
      .listen(element, MobileFriendlyClickEventType, (e: Event) =>
        this.onHandleCharacterDoubleClick(e)
      )
      .listen(element, EventType.MOUSEDOWN, (e: MouseEvent) =>
        this.onHandleMouseDown(e)
      )
      .listen(
        element,
        [EventType.KEYDOWN, EventType.KEYPRESS],
        (e: KeyboardEvent) => this.onHandleKeyDown(e)
      )
    if (!this.readonly) {
      handler
        .listen(
          this.matrixModel,
          CharacterChangedEvents.TYPE,
          (e: CustomEvent<CharacterChangedEvent>) =>
            this.onHandleCharacterChanged(e)
        )
        .listen(
          this.matrixModel,
          CharacterRefreshedEvents.TYPE,
          (e: CustomEvent<CharacterRefreshedEvent>) =>
            this.onHandleCharacterRefreshed(e)
        )
    }
  }

  /**
   * Adds a scrollable container for the grid
   * @param element The scrollable container for the grid
   */
  addScrollableContainer(element: HTMLElement) {
    this.scrollableContainer = element
  }

  /**
   * Redraws the character grid.
   */
  redraw() {
    const element = this.getElement()
    mb.removeChildren(element)
    const table = document.createElement('table')
    const thead = document.createElement('thead')
    const tr = document.createElement('tr')
    const headers = ['#', 'Name', 'States', 'Media']
    for (let x = 0; x < headers.length; x++) {
      const th = document.createElement('th')
      th.textContent = headers[x]
      tr.appendChild(th)
    }
    thead.appendChild(tr)
    const tbody = document.createElement('tbody')

    // Render with we calculate the height and width
    setTimeout(() => {
      // After the next window refresh, we should have the proper height in order to calculate the
      // proper amount of rows to add.
      const remainingHeight =
        this.scrollableContainer.clientHeight - table.clientHeight
      mb.setElementStyle(
        this.scrollableContainer,
        'overflow',
        remainingHeight > 0 ? 'hidden' : 'auto'
      )
      if (remainingHeight > 0) {
        const rowsToAdd =
          Math.ceil(
            /* height in pixel */
            remainingHeight / 100
          ) + 1
        for (let x = 0; x < rowsToAdd; x++) {
          tbody.appendChild(this.createEmptyRow())
        }
      }
    }, 0)

    // Get the selected items so that we can maintain the selected rows.
    const selectedCharacterIds = this.selectedItems.map((element) =>
      parseInt(element.dataset['characterId'] as string, 10)
    )
    this.selectedItems = []
    const characters = this.matrixModel.getCharacters()
    for (let x = 0, l = characters.size(); x < l; x++) {
      const character = characters.getAt(x)
      const characterRow = this.createCharacter(character)
      if (mb.contains(selectedCharacterIds, character.getId())) {
        this.addSelectedItems(characterRow)
      }
      tbody.appendChild(characterRow)
    }

    // Last row for the characters. This is used so that we can drop characters at the end of the list.
    const lastRow = this.createEmptyRow()
    tbody.appendChild(lastRow)
    table.appendChild(thead)
    table.appendChild(tbody)
    element.appendChild(table)
  }

  /**
   * Fixes the broken styles in the window.
   */
  resizeWindow() {
    const fixedHeader = this.getElementByClass<HTMLElement>('fixedHeader')
    if (fixedHeader === null) {
      return
    }
    const element = this.getElement()
    const thead = element.getElementsByTagName('thead')[0]
    const tr = thead.getElementsByTagName('tr')[0]
    mb.setElementStyle(fixedHeader, 'width', tr.clientWidth + 'px')

    // Ensure that all the headers are the exact size
    const fixedHeaderElements = fixedHeader.childNodes
    const headerElements = tr.childNodes
    for (let x = 0; x < headerElements.length; x++) {
      const fixedHeaderElement = fixedHeaderElements[x] as HTMLElement
      const newStyle = fixedHeaderElement.style
      const headerElement = headerElements[x] as HTMLElement
      newStyle.minWidth = newStyle.maxWidth =
        headerElement.clientWidth - 4 + 'px'
    }
  }

  /**
   * Go to the character
   * @param index The index to go to
   */
  goToCharacter(index: number) {
    const element = this.getElement()
    const thead = element.getElementsByTagName('tbody')[0]
    const tr = thead.getElementsByTagName('tr')[index]
    if (tr) {
      this.scrollToTrElement(tr)
    }
  }

  /** Focuses on this element */
  focus() {
    this.getElement().focus()
  }

  /**
   * @return The last selected index if any
   */
  getSelectedIndex(): number {
    if (this.selectedItems.length == 0) {
      return -1
    }
    const element = this.getElement()
    const tbody = element.getElementsByTagName('tbody')[0]
    const trs = tbody.getElementsByTagName('tr')
    return mb.indexOf(trs, this.selectedItems[0])
  }

  /**
   * Scrolls to a character in the character grid
   * @param index The index to scroll to
   */
  setSelectedIndex(index: number) {
    const element = this.getElement()
    const tbody = element.getElementsByTagName('tbody')[0]
    const trs = tbody.getElementsByTagName('tr')
    if (index < trs.length && trs[index]) {
      mb.scrollIntoContainerView(
        trs[index],
        this.scrollableContainer,
        /* center */
        true
      )
    }
  }

  /**
   * Delete the selected indices.
   */
  deleteSelectedIndices() {
    if (!this.readonly) {
      const characterIds = this.selectedItems.map((element) =>
        parseInt(element.dataset['characterId'] as string, 10)
      )
      this.confirmRemoveCharacters(characterIds)
    }
  }

  /**
   * Sets the matrix model for the character grid.
   * @param matrixModel The new matrix model to set
   */
  setMatrixModel(matrixModel: MatrixModel) {
    const handler = this.getHandler()

    // unlistens from the previous matrix model
    handler.unlisten(this.matrixModel, [
      CharacterChangedEvents.TYPE,
      CharacterRefreshedEvents.TYPE,
    ])
    this.matrixModel = matrixModel
    this.renderer.setMatrixModel(matrixModel)
    handler.listen(
      this.matrixModel,
      CharacterChangedEvents.TYPE,
      (e: CustomEvent<CharacterChangedEvent>) =>
        this.onHandleCharacterChanged(e)
    )
    handler.listen(
      this.matrixModel,
      CharacterRefreshedEvents.TYPE,
      (e: CustomEvent<CharacterRefreshedEvent>) =>
        this.onHandleCharacterRefreshed(e)
    )
  }

  /**
   * Sets the renderer for the character grid
   * @param renderer The renderer of the character grid
   */
  setRenderer(renderer: CharacterGridRenderer) {
    this.renderer = renderer
  }

  /**
   * Creates an row element which contains the character's information
   * @param character the character's data
   * @return the element in the character grid
   */
  protected createCharacter(character: Character): HTMLElement {
    const row = this.renderer.renderRow(character)
    if (!this.readonly) {
      row.draggable = true
      this.getHandler()
        .listen(row, EventType.DRAGSTART, () => this.onHandleDragStart())
        .listen(row, EventType.DRAGEND, () => this.onHandleDragEnd())
        .listen(row, EventType.DROP, (e: DragEvent) => this.onHandleDrop(e))
        .listen(
          row,
          [EventType.DRAGOVER, EventType.DRAGENTER],
          (e: DragEvent) => this.onHandleDragEnter(e)
        )
        .listen(row, [EventType.DRAGOUT, EventType.DRAGLEAVE], (e: DragEvent) =>
          this.onHandleDragLeave(e)
        )
    }
    return row
  }

  /**
   * Creates an empty row element which contains no information
   * @return the element in the character grid
   */
  protected createEmptyRow(): Element {
    const row = document.createElement('tr')
    const characterNumberElement = document.createElement('td')
    row.appendChild(characterNumberElement)
    const characterNameNotesElement = document.createElement('td')
    row.appendChild(characterNameNotesElement)
    const characterStatesElement = document.createElement('td')
    row.appendChild(characterStatesElement)
    const characterMediaElement = document.createElement('td')
    row.appendChild(characterMediaElement)
    row.classList.add(CharacterGrid.CSS.EMPTY)
    return row
  }

  /**
   * Handles when the mouse down event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleMouseDown(e: MouseEvent) {
    const targetElement = mb.toElement(e.target)
    const tr = this.getParentTrElement(targetElement)
    if (tr === null) {
      return
    }
    if (targetElement.classList.contains('remove')) {
      const dataset = <any>tr.dataset
      const characterId = parseInt(dataset['characterId'], 10)
      this.confirmRemoveCharacters([characterId])
      return
    }
    this.highlightedElement = tr
    this.focus()
    const isMultiSelectPressed = mb.isMacintosh() ? e.metaKey : e.ctrlKey
    if (e.shiftKey) {
      const savedTr = this.popSelectedItem()
      this.removeSelectedItems()

      // save elements from tr to savedTr
      const element = this.getElement()
      const tbody = element.getElementsByTagName('tbody')[0]
      const trs = tbody.getElementsByTagName('tr')
      const savedLiIndex = mb.indexOf(trs, savedTr)
      let liIndex = mb.indexOf(trs, tr)
      const inc = liIndex < savedLiIndex ? 1 : -1

      // we iterate this way so when users double shift they use the original li element
      for (; liIndex !== savedLiIndex; liIndex += inc) {
        this.addSelectedItems(trs[liIndex])
      }
      this.addSelectedItems(trs[liIndex])
    } else {
      if (isMultiSelectPressed) {
        this.toggleSelectedItems(tr)
      } else {
        if (!this.isSelectedItems(tr)) {
          this.removeSelectedItems()
          this.addSelectedItems(tr)
        }
      }
    }
    this.dispatchEvent(new Event(EventType.SELECT))
  }

  /**
   * Handles when the key down event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleKeyDown(e: KeyboardEvent) {
    switch (e.code) {
      // Prevent the dialog from receiving the enter keycode which will close it and instead okay the dialog
      case KeyCodes.SPACE:
      case KeyCodes.ENTER:
        this.openCharacterDialogForElement(this.highlightedElement)
        break
      case KeyCodes.UP:
        this.moveHighlightedElementBy(-1)
        break
      case KeyCodes.DOWN:
        this.moveHighlightedElementBy(1)
        break
      case KeyCodes.PAGE_UP:
        this.moveHighlightedElementBy(-3)
        break
      case KeyCodes.PAGE_DOWN:
        this.moveHighlightedElementBy(3)
        break
      case KeyCodes.DELETE:
        this.deleteSelectedIndices()
        break

      // Eat the key press and don't do anything
      case KeyCodes.LEFT:
      case KeyCodes.RIGHT:
        break

      // If we are not listening to this event propagate it upward
      default:
        return false
    }
    e.stopPropagation()
    e.preventDefault()
    return true
  }

  /**
   * Handles when the drag start event on this component.
   */
  protected onHandleDragStart() {
    CharacterGrid.dragStarted = 0
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
    const targetElement = this.getParentTrElement(e.target)
    if (!targetElement) {
      return
    }
    targetElement.classList.remove(CharacterGrid.CSS.DROPPABLE)
    const element = this.getElement()
    const tbody = element.getElementsByTagName('tbody')[0]
    const trs = tbody.getElementsByTagName('tr')
    const droppedIndex = mb.indexOf(trs, targetElement)

    // If we are moving one element and it's in the same place, we don't need to move it
    if (
      this.selectedItems.length === 1 &&
      trs[droppedIndex] === this.selectedItems[0]
    ) {
      return
    }
    const characterIds = this.selectedItems.map((element) =>
      parseInt(element.dataset['characterId'] as string, 10)
    )
    if (characterIds.length == 0) {
      return
    }
    this.savingLabel.saving()
    this.matrixModel
      .reorderCharacters(characterIds, droppedIndex)
      .then(() => {
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * Handles when the drag enter event on this component.
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleDragEnter(e: DragEvent) {
    const trElement = this.getParentTrElement(e.target)
    if (trElement) {
      e.preventDefault()
      trElement.classList.add(CharacterGrid.CSS.DROPPABLE)
      this.scrollToTrElement(trElement)
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
      trElement.classList.remove(CharacterGrid.CSS.DROPPABLE)
    }
  }

  /**
   * Handles events from double clicks on the characters.
   * @param e The event that triggerd this callback.
   */
  protected onHandleCharacterDoubleClick(e: Event) {
    const tr = this.getParentTrElement(e.target)
    if (tr) {
      this.openCharacterDialogForElement(tr)
      return true
    }
    return false
  }

  /**
   * Handles events from changing characters.
   * @param e The event that triggerd this callback.
   */
  protected onHandleCharacterRefreshed(
    e: CustomEvent<CharacterRefreshedEvent>
  ) {
    const changedCharacterIds = e ? e.detail.characterIds : []
    if (changedCharacterIds.length) {
      this.redrawCharacterForIds(changedCharacterIds)
    } else {
      this.redraw()
    }
  }

  /**
   * Handles events from changing characters.
   * @param e The event that triggerd this callback.
   */
  protected onHandleCharacterChanged(e: CustomEvent<CharacterChangedEvent>) {
    const changedCharacterIds = e ? e.detail.characterIds : []
    if (changedCharacterIds.length) {
      this.redrawCharacterForIds(changedCharacterIds)
    } else {
      this.redraw()
    }
  }

  /**
   * Redraws the character based on the given character ids.
   * @param changedCharacterIds The ids of the characters to redraw.
   */
  protected redrawCharacterForIds(changedCharacterIds: number[]) {
    // create mapping so it's easier to search through
    const element = this.getElement()
    const tbody = element.getElementsByTagName('tbody')[0]
    const trs = tbody.getElementsByTagName('tr')
    const idsToTrs = new Map()
    for (let x = 0; x < trs.length; x++) {
      const tr = trs[x]
      const characterId = parseInt(tr.dataset['characterId'] as string, 10)
      idsToTrs.set(characterId, tr)
    }

    // replace changed characters
    const characters = this.matrixModel.getCharacters()
    for (let x = 0; x < changedCharacterIds.length; x++) {
      const characterId = changedCharacterIds[x]
      const character = characters.getById(characterId)
      if (character) {
        const tr = this.createCharacter(character)
        tbody.replaceChild(tr, idsToTrs.get(characterId))
      }
    }
  }

  /**
   * Handles events from double clicks on the characters.
   * @param tr The element to render the character dialog for
   */
  protected openCharacterDialogForElement(tr: HTMLElement) {
    if (tr === null || !tr.dataset['characterId']) {
      return false
    }
    const characterId = parseInt(tr.dataset['characterId'], 10)
    const characterDialogConstructor = this.readonly
      ? ReadonlyCharacterDialog
      : CharacterDialog
    const characterDialog = new characterDialogConstructor(
      this.matrixModel,
      characterId
    )
    characterDialog.setVisible(true)
    return true
  }

  /**
   * Asks to remove characters from the grid.
   *
   * @param characterIds The character ids to remove from the grid
   */
  protected confirmRemoveCharacters(characterIds: number[]) {
    const characters = this.matrixModel.getCharacters()
    const charactersToRemove = characters.getByIds(characterIds)
    if (charactersToRemove.length == 0) {
      return
    }
    const confirmDialog = new ConfirmDialog(
      'Confirm',
      CharacterGrid.confirmRemoveCharactersText(charactersToRemove),
      () => this.removeCharacters(characterIds)
    )
    confirmDialog.setVisible(true)
  }

  /**
   * Removes characters from the character grid
   *
   * @param characterIds The character ids to remove from the grid
   */
  protected removeCharacters(characterIds: number[]) {
    this.savingLabel.saving()
    this.matrixModel
      .removeCharacters(characterIds)
      .then(() => {
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * Removes all the selected items
   */
  protected popSelectedItem() {
    const lastTr = this.selectedItems.pop()
    if (lastTr !== undefined) {
      lastTr.classList.remove(CharacterGrid.CSS.SELECTED)
    }
    return lastTr
  }

  /**
   * Removes all the selected items
   */
  protected removeSelectedItems() {
    let lastLi
    while ((lastLi = this.selectedItems.pop()) !== undefined) {
      lastLi.classList.remove(CharacterGrid.CSS.SELECTED)
    }
  }

  /**
   * Adds item to the selected items
   * @param tr the element to add
   */
  protected addSelectedItems(tr: HTMLElement) {
    if (tr.classList.contains(CharacterGrid.CSS.EMPTY)) {
      return
    }
    if (!this.isSelectedItems(tr)) {
      tr.classList.add(CharacterGrid.CSS.SELECTED)
      this.selectedItems.push(tr)
    }
  }

  /**
   * Adds item to the selected items
   * @param tr the element to add
   */
  protected toggleSelectedItems(tr: HTMLElement) {
    if (tr.classList.contains(CharacterGrid.CSS.EMPTY)) {
      return
    }
    if (this.isSelectedItems(tr)) {
      tr.classList.remove(CharacterGrid.CSS.SELECTED)
      const index = this.selectedItems.indexOf(tr)
      if (index > -1) {
        this.selectedItems.splice(index, 1)
      }
    } else {
      tr.classList.add(CharacterGrid.CSS.SELECTED)
      this.selectedItems.push(tr)
    }
  }

  /**
   * @param tr the element to add
   * @return Whether the tr is selected.
   */
  protected isSelectedItems(tr: HTMLElement): boolean {
    return tr.classList.contains(CharacterGrid.CSS.SELECTED)
  }

  /**
   * @param element The element to query
   * @return The LI element of the taxa.
   */
  protected getParentTrElement<T extends HTMLElement>(element: any): T | null {
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
   * Move the highlighted element by
   * @param position the number to move the hightlighted element by
   */
  protected moveHighlightedElementBy(position: number) {
    this.removeSelectedItems()
    if (this.highlightedElement !== null) {
      const element = this.getElement()
      const tbody = element.getElementsByTagName('tbody')[0]
      const trs = tbody.getElementsByTagName('tr')
      const index = mb.indexOf(trs, this.highlightedElement)
      position = Math.min(
        Math.max(
          0,
          /* skip empty */
          index + position
        ),
        trs.length - 2
      )
      const newHightlightedElement = trs[position]
      if (
        newHightlightedElement &&
        newHightlightedElement.dataset['characterId']
      ) {
        mb.scrollIntoContainerView(
          newHightlightedElement,
          this.scrollableContainer,
          /* center */
          true
        )
        this.addSelectedItems(newHightlightedElement)
        this.highlightedElement = newHightlightedElement
      }
    }
  }

  /**
   * Scroll to a TR element
   * @param element the element that we may scroll to
   * @return whether we scroll to the element
   */
  protected scrollToTrElement(element: HTMLElement): boolean {
    const offset = mb.getContainerOffsetToScrollInto(
      element,
      this.scrollableContainer,
      /* center */
      true
    )
    const delta = offset.y - this.scrollableContainer.scrollTop
    const dragDirection = delta > 1 ? 1 : delta < -1 ? -1 : 0
    if (CharacterGrid.dragDirection !== dragDirection) {
      CharacterGrid.dragDirection = dragDirection
      CharacterGrid.dragStarted = 0
    }
    if (this.scrollableContainer.scrollTop !== offset.y) {
      const speed = Math.max(
        150 / ((++CharacterGrid.dragStarted >>> 3) + 1),
        20
      )
      clearTimeout(CharacterGrid.scrollingTimer)
      CharacterGrid.scrollingTimer = window.setTimeout(
        () => (this.scrollableContainer.scrollTop = offset.y),
        speed
      )
      return true
    }
    return false
  }

  /**
   * @param character The characer to delete
   * @return The HTML content of the character name/notes row
   */
  static characterNameHtmlContent(character: Character): string {
    return (
      '<div class="name">' +
      '<b>' +
      mb.truncateString(character.getName(), 100) +
      '</b>' +
      '<p>Notes:</p><i>' +
      mb.truncateString(character.getDescription(), 900) +
      '</i>' +
      '</div>'
    )
  }

  /**
   * @param character The characer to delete
   * @return The HTML content of the character states row
   */
  static characterStatesHtmlContent(character: Character): string {
    const stateNames: string[] = []
    const characterStates = character.getStates()
    for (let x = 0; x < characterStates.length; x++) {
      stateNames.push(
        '(' +
          characterStates[x].getNumber() +
          ') ' +
          characterStates[x].getName()
      )
    }
    return stateNames.join('<br/>')
  }

  /**
   * @param characters The characer to delete
   * @return The HTML content of the character states row
   */
  static confirmRemoveCharactersText(characters: Character[]): string {
    const characterNames: string[] = []
    for (let x = 0; x < characters.length; x++) {
      characterNames.push(characters[x].getName())
    }
    const charactersText =
      '<i>' + mb.truncateString(characterNames.join(', '), 100) + '</i>'
    return (
      'Are you sure you want to delete character(s): ' + charactersText + '?'
    )
  }
}
