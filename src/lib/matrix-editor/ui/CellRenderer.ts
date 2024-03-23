import { CellContent } from './CellsContent'
import { CellStateNameContent } from './CellsContent'
import './CellsContent'
import { CellStateNameNumberContent } from './CellsContent'
import { CellStateNumberContent } from './CellsContent'
import { ImageRenderer } from './ImageRenderer'
import { isEmptyOrWhitespace } from '../mb'

/**
 * The abstract class that defines how cells are rendered.
 */
export abstract class CellRenderer {
  /**
   * The highlight mode index.
   */
  private static highlightIndex: number = 0

  /**
   * The colors of various states.
   */
  private static readonly cellColoringModeColors: string[] = [
    '#FF7070',
    '#FFFD70',
    '#9E9AED',
    '#F19AF6',
    '#A9F69A',
    '#F6BB9A',
    '#9AF6F5',
    '#3EBF29',
    '#Ca4E4E',
    '#B6B6B6',
  ]

  /**
   * Color of undefined cells
   */
  private static readonly cellColoringModeNPAColor: string = '#20FFFF'

  /**
   * Color of undefined cells
   */
  private static readonly cellColoringModeNoScoreColor: string = '#FF20FF'

  /**
   * Color of undefined cells
   */
  private static readonly cellColoringModeUndefinedColor: string = '#c0c0c0'

  /**
   * The cache of rendered HTML td element cells
   */
  private cellCache: { [key: number]: { [key: number]: HTMLElement } } = {}

  /**
   * Sets an HTML string representing the cell.
   */
  protected abstract renderCell(
    td: HTMLElement,
    data: { [key: string]: any }
  ): void

  /**
   * Returns the CSS class for this render.
   * @return css class name
   */
  abstract getClass(): string

  /**
   * Sets the highlight mode.
   * @param index the hightmode index
   */
  setHighlightModeIndex(index: number) {
    if (CellRenderer.highlightIndex !== index) {
      CellRenderer.highlightIndex = index
      this.clearCache()
    }
  }

  /**
   * Sets the TD HTML element cell for the taxon and character
   * @param taxonId id of the taxon
   * @param characterId id of the character
   * @param td the TD element to cache
   */
  setCachedCell(taxonId: number, characterId: number, td: HTMLElement) {
    if (!(taxonId in this.cellCache)) {
      this.cellCache[taxonId] = {}
    }
    this.cellCache[taxonId][characterId] = td
  }

  /**
   * Gets the cell for the taxon and character
   * @param taxonId id of the taxon
   * @param characterId id of the character
   * @return the cached TD element
   */
  getCachedCell(taxonId: number, characterId: number): HTMLElement | null {
    if (this.cellCache[taxonId] === undefined) {
      return null
    }
    return this.cellCache[taxonId][characterId] || null
  }

  /**
   * Deletes the cell for the taxon and character
   * @param taxonId id of the taxon
   * @param characterId id of the character
   */
  deleteCachedCell(taxonId: number, characterId: number) {
    if (!(taxonId in this.cellCache)) {
      this.cellCache[taxonId] = {}
    }
    delete this.cellCache[taxonId][characterId]
  }

  /**
   * Deletes row for taxa
   * @param taxaIds The ids of the taxa
   */
  deleteCachedRows(taxaIds: number[]) {
    for (let x = 0; x < taxaIds.length; x++) {
      delete this.cellCache[taxaIds[x]]
    }
  }

  /**
   * Clears the cache
   */
  clearCache() {
    this.cellCache = {}
  }

  /**
   * May Hightlight cell depending on the highlight mode.
   * @param cell The cell to maybe highlight.
   * @param data The information about the cell.
   */
  mayHighlightCell(cell: HTMLElement, data: { [key: string]: any }) {
    const cellMedia = data.media
    let highlightCell = false
    let cellColor = ''
    switch (CellRenderer.highlightIndex) {
      case 1:
        // recent changes
        const last_login_time = 0
        highlightCell = data.last_update_time > last_login_time
        break
      case 2:
        // past day
        const yesterday_in_seconds = new Date().getTime() / 1000 - 24 * 60 * 60
        highlightCell = data.last_update_time > yesterday_in_seconds
        break
      case 3:
        // last 7 days
        const last_week_in_seconds =
          new Date().getTime() / 1000 - 7 * 24 * 60 * 60
        highlightCell = data.last_update_time > last_week_in_seconds
        break
      case 4:
        // unscored cells
        highlightCell = data.states[0].state_name === '?'
        break
      case 5:
        // in applicable cells
        highlightCell = data.states[0].state_name === '-'
        break
      case 6:
        // NPA cells
        highlightCell = data.states[0].state_name === 'NPA'
        break
      case 7:
        // uncertain
        highlightCell = !!data.is_uncertain
        break
      case 8:
        // status = "new" (code 0)
        highlightCell = data.status === 0
        break
      case 9:
        // status = "in-progress" (code 50)
        highlightCell = data.status === 50
        break
      case 10:
        // status = "complete" (code 100)
        highlightCell = data.status === 100
        break
      case 11:
        // images
        highlightCell = cellMedia && cellMedia.length > 0
        break
      case 12:
        // labels
        if (cellMedia) {
          for (let x = 0; x < cellMedia.length; x++) {
            if (cellMedia[x].getLabelCount()) {
              highlightCell = true
              break
            }
          }
        }
        break
      case 13:
        // comments
        highlightCell = data.comment_count > 0
        break
      case 14:
        // unread comments
        highlightCell = data.unread_comment_count > 0
        break
      case 15:
        // unread citations
        highlightCell = data.citation_count > 0
        break
      case 16:
        // color states
        switch (data.states[0].state_name) {
          case 'NPA':
            cellColor = CellRenderer.cellColoringModeNPAColor
            break
          case '?':
            cellColor = CellRenderer.cellColoringModeNoScoreColor
            break
          case '-':
            cellColor = CellRenderer.cellColoringModeUndefinedColor
            break
          default:
            cellColor =
              CellRenderer.cellColoringModeColors[
                data.states[0].state_number %
                  CellRenderer.cellColoringModeColors.length
              ]
            break
        }
        break
      case 17:
        // notes
        highlightCell = data.notes != null && !isEmptyOrWhitespace(data.notes)
      default:
        // no color
        break
    }
    if (highlightCell) {
      cell.style.backgroundColor = '#CC5555'
    } else {
      cell.style.backgroundColor = cellColor
    }
    if (!!cellMedia.length) {
      cell.style.fontWeight = 'bold'
    }
  }

  /**
   * Creates the cell
   * @param taxonId The taxon id
   * @param characterId The character id
   * @param getCellFunction The function to get the cell data
   */
  createCell(
    taxonId: number,
    characterId: number,
    getCellFunction: (p1: number, p2: number) => Object
  ): HTMLElement {
    let td = this.getCachedCell(taxonId, characterId)
    if (!td) {
      td = document.createElement('td')
      td.dataset['characterId'] = String(characterId)
      td.dataset['taxonId'] = String(taxonId)
      const data = getCellFunction(taxonId, characterId)
      this.renderCell(td, data)
      this.mayHighlightCell(td, data)
      this.setCachedCell(taxonId, characterId, td)
    }
    return td
  }

  /**
   * Creates an empty cell
   */
  createEmptyCell(): HTMLElement {
    return document.createElement('td')
  }
}

/**
 * The render for Cell State Numbers.
 */
export class CellStateNumberRenderer extends CellRenderer {
  constructor() {
    super()
  }

  override renderCell(td: HTMLElement, data: { [key: string]: any }): void {
    td.textContent = CellContent(data, CellStateNumberContent)
  }

  override getClass() {
    return 'cellStateNumber'
  }
}

/**
 * The render for Cell State Numbers.
 */
export class CellStateNameRenderer extends CellRenderer {
  constructor() {
    super()
  }

  override renderCell(td: HTMLElement, data: { [key: string]: any }): void {
    td.textContent = CellContent(data, CellStateNameContent)
  }

  override getClass() {
    return 'cellStateName'
  }
}

/**
 * The render for Cell State Numbers.
 */
export class CellStateNameNumberRenderer extends CellRenderer {
  constructor() {
    super()
  }

  override renderCell(td: HTMLElement, data: { [key: string]: any }): void {
    td.textContent = CellContent(data, CellStateNameNumberContent)
  }

  override getClass() {
    return 'cellStateNumberName'
  }
}

/**
 * The render for Cell State Name and Images.
 */
export class CellStateNameImageRenderer extends CellRenderer {
  constructor() {
    super()
  }

  override renderCell(td: HTMLElement, data: { [key: string]: any }): void {
    td.textContent = CellContent(data, CellStateNameContent)
    const images = new ImageRenderer('X')
    images.setReadOnly(data.readonly)
    for (let x = 0; x < data.media.length; x++) {
      const media = data.media[x]
      const labelCount = media.getLabelCount()
      const caption = labelCount
        ? labelCount + ' label' + (labelCount === 1 ? '' : 's')
        : undefined
      const tinyMedium = media.getTiny()
      if (tinyMedium) {
        images.addImage(media.getId(), tinyMedium['url'], caption)
      }
    }
    images.render(td)
  }

  override getClass() {
    return 'cellStateImages'
  }
}

/**
 * The render for Cell State Name and Images.
 */
export class CellStateNumberImageRenderer extends CellRenderer {
  constructor() {
    super()
  }

  override renderCell(td: HTMLElement, data: { [key: string]: any }): void {
    td.textContent = CellContent(data, CellStateNumberContent)
    const images = new ImageRenderer('X')
    images.setReadOnly(data.readonly)
    for (let x = 0; x < data.media.length; x++) {
      const media = data.media[x]
      const labelCount = media.getLabelCount()
      const caption = labelCount
        ? labelCount + ' label' + (labelCount === 1 ? '' : 's')
        : undefined
      const tiny = media.getTiny()
      if (tiny) {
        images.addImage(media.getId(), tiny['url'], caption)
      }
    }
    images.render(td)
  }

  override getClass() {
    return 'cellStateImages'
  }
}
