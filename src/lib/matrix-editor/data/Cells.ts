import { Citation } from './Citation'
import { Media } from './Media'
import * as mb from '../mb'

/**
 * Defines the cells model.
 * @struct
 */
export class Cells {
  /**
   * The matrix of cells. This is defined by row (taxa) by column (character). The value is an array of cells.
   */
  private cells: { [key: number]: { [key: number]: CellStates[] } } = {}

  /**
   * This is defined by row (taxa) by column (character). The value is an array of cell notes.
   */
  private cellInfo: { [key: number]: { [key: number]: CellInfo } } = {}

  /**
   * Add cell states to the cell model.
   * @param cellStates the json representation.
   */
  clearAndAddCellStates(cellStates: Object[]) {
    const cells: CellStates[] = []
    for (let x = 0; x < cellStates.length; x++) {
      const cell = new CellStates(cellStates[x])
      const taxonId = cell.getTaxonId()
      const characterId = cell.getCharacterId()
      cells.push(cell)
      if (taxonId in this.cells && characterId in this.cells[taxonId]) {
        this.cells[taxonId][characterId] = []
      }
    }
    for (let x = 0; x < cells.length; x++) {
      const cell = cells[x]
      const taxonId = cell.getTaxonId()
      const characterId = cell.getCharacterId()
      const cellId = cell.getCellId()

      // check if it's a valid cell
      if (!cellId) {
        continue
      }
      if (!(taxonId in this.cells)) {
        this.cells[taxonId] = {}
      }
      if (
        !(characterId in this.cells[taxonId]) ||
        !this.cells[taxonId][characterId]
      ) {
        this.cells[taxonId][characterId] = []
      }
      this.cells[taxonId][characterId].push(cell)
    }
  }

  /**
   * Clears the scoring for the scores for a given taxa ids
   * @param taxaIds The ids for the taxa to clear
   */
  clearScoresForTaxonId(taxaIds: number[]) {
    for (let x = 0; x < taxaIds.length; x++) {
      const taxonId = taxaIds[x]
      if (taxonId in this.cells) {
        this.cells[taxonId] = {}
      }
    }
  }

  /**
   * Add cell states to the cell model.
   * @param cellStates the json representation.
   */
  initCellStates(cellStates: Object[]) {
    for (let x = 0; x < cellStates.length; x++) {
      const cell = new CellStates(cellStates[x])
      const taxonId = cell.getTaxonId()
      const characterId = cell.getCharacterId()
      if (!(taxonId in this.cells)) {
        this.cells[taxonId] = {}
      }
      if (
        !(characterId in this.cells[taxonId]) ||
        !this.cells[taxonId][characterId]
      ) {
        this.cells[taxonId][characterId] = []
      }
      this.cells[taxonId][characterId].push(cell)
    }
  }

  /**
   * Add cell notes to the cell model
   * @param notes the json representation.
   */
  initCellNotes(notes: { [key: string]: any }[]) {
    for (let x = 0; x < notes.length; x++) {
      const note = notes[x]
      const taxonId = note['taxon_id']
      const characterId = note['character_id']
      const status = note['status']
      const cellNote = note['notes']
      const cellInfo = this.mayCreateCellInfo(taxonId, characterId)
      cellInfo.setNotes(cellNote)
      cellInfo.setStatus(status)
    }
  }

  /**
   * Add cell counting information to the matrix model.
   * @param counts the cells to add.
   */
  initCellCounts(counts: any) {
    const countFunctionMap: { [key: string]: (c: number) => void } = {
      updates: CellInfo.prototype.setLastUpdateTime,
      citation_counts: CellInfo.prototype.setCitationCount,
      comment_counts: CellInfo.prototype.setCommentCount,
      unread_comment_counts: CellInfo.prototype.setUnreadCommentCount,
    }
    for (let countKey in counts) {
      const count = counts[countKey]
      for (let taxonIdValue in count) {
        for (let characterIdValue in count[taxonIdValue]) {
          const taxonId = parseInt(taxonIdValue, 10)
          const characterId = parseInt(characterIdValue, 10)
          const cellInfo = this.mayCreateCellInfo(
            taxonId,
            characterId
          ) as Object
          countFunctionMap[countKey].call(cellInfo, count[taxonId][characterId])
        }
      }
    }
  }

  /**
   * Add cell media to the cell model
   * @param media the json representation.
   */
  initCellMedia(media: Object[]) {
    for (let x = 0; x < media.length; x++) {
      const cellMedia = new CellMedia(media[x])
      const taxonId = cellMedia.getTaxonId()
      const characterId = cellMedia.getCharacterId()
      const cellInfo = this.mayCreateCellInfo(taxonId, characterId)
      cellInfo.addMedia([cellMedia])
    }
  }

  /**
   * Gets the cell states for the taxon and character
   * @param taxonId id of the taxon
   * @param characterId id of the character
   * @return the array of cells
   */
  getCell(taxonId: number, characterId: number): CellStates[] {
    if (this.cells === undefined || this.cells[taxonId] === undefined) {
      return []
    }
    return this.cells[taxonId][characterId] || []
  }

  /**
   * Gets the cell states for the taxon and character or creates them if they do not exists
   * @param taxonId id of the taxon
   * @param characterId id of the character
   * @return the array of cells
   */
  mayCreateCell(taxonId: number, characterId: number): CellStates[] {
    if (!(taxonId in this.cells)) {
      this.cells[taxonId] = {}
    }
    if (
      !(characterId in this.cells[taxonId]) ||
      !this.cells[taxonId][characterId]
    ) {
      this.cells[taxonId][characterId] = []
    }
    return this.cells[taxonId][characterId]
  }

  /**
   * Delete cells with character and state
   * @param characterId The character id to delete from
   * @param stateIds The state id to delete
   */
  deleteCellsWithCharacterState(characterId: number, stateIds: number[]) {
    if (stateIds.length === 0) {
      return
    }
    for (const taxonId in this.cells) {
      const cellStates = this.cells[taxonId][characterId] || []
      for (let x = 0; x < cellStates.length; x++) {
        const cellState = cellStates[x]
        if (stateIds.indexOf(cellState.getStateId()) >= 0) {
          cellStates.splice(x, 1)
        }
      }
    }
  }

  /**
   * Determines whether taxa have been scored in this matrix.
   * @param taxaIds The taxa ids to check if they have been scored.
   * @return true any of the taxa have been scored.
   */
  isTaxaScored(taxaIds: number[]): boolean {
    if (this.cells) {
      for (let x = 0; x < taxaIds.length; x++) {
        const row = this.cells[taxaIds[x]]
        if (row && !mb.isEmpty(row)) {
          return true
        }
      }
    }
    return false
  }

  /**
   * Determines whether characters have been scored in this matrix.
   * @param charactersId The character ids to check if they have been scored.
   * @return true any of the character have been scored.
   */
  isCharactersScored(charactersId: number[]): boolean {
    if (this.cells) {
      for (const taxonId in this.cells) {
        for (let x = 0; x < charactersId.length; x++) {
          const characterId = charactersId[x]
          if (!mb.isEmpty(this.cells[taxonId][characterId])) {
            return true
          }
        }
      }
    }
    return false
  }

  /**
   * Determines whether a cell has been loaded to the matrix. Unloaded cells are undefined whereas loaded cells are
   * either an instance of the Cell object or null (for cells that are vacant).
   *
   * @param taxonId id of the taxon
   * @param characterId id of the character
   * @return whether the cell has been loaded
   */
  checkCellLoaded(taxonId: number, characterId: number): boolean {
    return (
      !!this.cells &&
      !!this.cells[taxonId] &&
      this.cells[taxonId][characterId] !== undefined
    )
  }

  /**
   * This ensures that the cells are marked as loaded either by verifying that it contains a valid object
   * or setting it to null which indicates an absent (e.g. '?') state.
   * @param taxonId id of the taxon
   * @param characterId id of the character
   */
  setCellAsLoaded(taxonId: number, characterId: number) {
    if (!(taxonId in this.cells)) {
      this.cells[taxonId] = {}
    }
    if (!(characterId in this.cells[taxonId])) {
      this.cells[taxonId][characterId] = []
    }
  }

  /**
   * Gets the cell for the taxon and character
   * @param taxonId id of the taxon
   * @param characterId id of the character
   * @return the array of cells
   */
  getCellInfo(taxonId: number, characterId: number): CellInfo {
    if (this.cellInfo === undefined || this.cellInfo[taxonId] === undefined) {
      return CellInfo.EMPTY
    }
    return this.cellInfo[taxonId][characterId] || CellInfo.EMPTY
  }

  /**
   * Gets the cell for the taxon and character
   * @param taxonId id of the taxon
   * @param characterId id of the character
   * @return the array of cells
   */
  mayCreateCellInfo(taxonId: number, characterId: number): CellInfo {
    if (!(taxonId in this.cellInfo)) {
      this.cellInfo[taxonId] = {}
    }
    if (
      !(characterId in this.cellInfo[taxonId]) ||
      !this.cellInfo[taxonId][characterId]
    ) {
      this.cellInfo[taxonId][characterId] = new CellInfo()
    }
    return this.cellInfo[taxonId][characterId]
  }
}

/**
 * CellState Wrapper Class
 * @param cellObj the json representation of a cell.
 * @struct
 */
export class CellStates {
  private readonly cellObj: {[key:string]:any}

  constructor(cellObj: Object) {
    this.cellObj = cellObj
  }

  /**
   * @return the taxon id of the cell.
   */
  getTaxonId(): number {
    return this.cellObj['tid']
  }

  /**
   * @return the character id of the cell.
   */
  getCharacterId(): number {
    return this.cellObj['cid']
  }

  /**
   * @return the state id of the cell.
   */
  getStateId(): number {
    return this.cellObj['sid'] || 0
  }

  /**
   * @return the id of the cell.
   */
  getCellId(): number {
    return this.cellObj['id']
  }

  /**
   * @return whether the cell is NPA.
   */
  isNPA(): boolean {
    return !!this.cellObj['npa']
  }

  /**
   * @return whether the cell is uncertain
   */
  isUncertain(): boolean {
    return !!this.cellObj['uct']
  }

  /**
   * @return the user id of the creator of the cell.
   */
  getUserId(): number {
    return this.cellObj['uid']
  }

  /**
   * @return the creation time of the cell as epoch time.
   */
  getCreationTime(): number {
    return this.cellObj['c']
  }

  /**
   * @return true is numeric start value is set
   */
  hasNumericValues(): boolean {
    return this.cellObj['sv'] != null || this.cellObj['ev'] != null
  }

  /**
   * @return The star  number for the continuous value.
   */
  getNumericStartValue(): number | null {
    return this.cellObj['sv'] != null ? this.cellObj['sv'] : null
  }

  /**
   * @return The end number for the continuous value.
   */
  getNumericEndValue(): number | null {
    return this.cellObj['ev'] != null ? this.cellObj['ev'] : null
  }
}

export type CellInfoStatus = 0 | 50 | 100

/**
 * Cell Info Class
 * @struct
 */
export class CellInfo {
  /**
   * Empty cell info
   */
  public static readonly EMPTY: CellInfo = new CellInfo()

  /**
   * This represents the status of the cell score.
   */
  public static readonly STATUS_OPTIONS: { [key: string]: CellInfoStatus } = {
    New: 0,
    'In-progress': 50,
    Complete: 100,
  }

  /**
   * This represents the certainity of the cell scores.
   *
   */
  public static readonly POLYMORPHIC_OPTIONS: { [key: string]: number } = {
    Polymorphic: 0,
    Uncertain: 1,
  }
  private notes: string | null = null
  private status: CellInfoStatus = 0
  private lastUpdateTime: number = 0

  /**
   * The initial count for citations for this cell. This is defined in during the
   * beginning of the matrix load. After citations have been loaded for the cell,
   * we'll defer the count of the citations map.
   */
  private initialCitationCount: number = 0
  private commentCount: number = 0
  private unreadCommentCount: number = 0

  /**
   * Mapping of media ids to taxon media
   */
  private media: Map<number, CellMedia>

  /**
   * Mapping of link ids to cell citations. Initially, a state of undefined means that the citations were never
   * loaded.
   */
  private citations: Map<number, Citation> | null = null

  constructor() {
    this.media = new Map()
  }

  /**
   * @param notes the notes of a cell.
   */
  setNotes(notes: string | null) {
    this.notes = notes
  }

  /**
   * @return the notes of a cell.
   */
  getNotes(): string | null {
    return this.notes
  }

  /**
   * @param status the status of a cell's note
   */
  setStatus(status: CellInfoStatus) {
    this.status = status
  }

  /**
   * @return the status of a cell's note
   */
  getStatus(): CellInfoStatus {
    return this.status
  }

  /**
   * @param lastUpdateTime the last time the cell was updated in seconds
   */
  setLastUpdateTime(lastUpdateTime: number) {
    this.lastUpdateTime = lastUpdateTime
  }

  /**
   * @return the last time the cell was updated in seconds
   */
  getLastUpdateTime(): number {
    return this.lastUpdateTime
  }

  /**
   * @param citationCount the number of citations in this cell
   */
  setCitationCount(citationCount: number) {
    this.initialCitationCount = citationCount
  }

  /**
   * Defer to the citations map if it's loaded in order to get an accurate count of the citations.
   * @return the number of citations in this cell
   */
  getCitationCount(): number {
    return this.citations !== null
      ? this.citations.size
      : this.initialCitationCount
  }

  /**
   * @param commentCount the number of comments in this cell
   */
  setCommentCount(commentCount: number) {
    this.commentCount = commentCount
  }

  /**
   * @return the number of comments in this cell
   */
  getCommentCount(): number {
    return this.commentCount
  }

  /**
   * @param unReadCommentCount the number of unread comments in this cell
   */
  setUnreadCommentCount(unReadCommentCount: number) {
    this.unreadCommentCount = unReadCommentCount
  }

  /**
   * @return the number of unread comments in this cell
   */
  getUnreadCommentCount(): number {
    return this.unreadCommentCount
  }

  /**
   * Adds a media to the cell.
   * @param media the media affliated with the cell.
   */
  addMedia(media: CellMedia[]) {
    for (let x = 0; x < media.length; x++) {
      const medium = media[x]
      this.media.set(medium.getMediaId(), medium)
    }
  }

  /**
   * Removes a media to the cell.
   * @param media the media affliated with the cell.
   */
  removeMedia(media: number[]) {
    for (let x = 0; x < media.length; x++) {
      this.media.delete(media[x])
    }
  }

  /**
   * Removes all media to the cell.
   */
  removeAllMedia() {
    this.media = new Map()
  }

  /**
   * @return the media affliated with the cell.
   */
  getMedia(): CellMedia[] {
    return Array.from(this.media.values())
  }

  /**
   * Gets a media based on its id
   * @param mediaId The id of the media to get
   * @return the one media associated by the media id
   */
  getMediaById(mediaId: number): CellMedia | undefined {
    return this.media.get(mediaId)
  }

  /**
   * Checks whether a given media id is a part of the cell's media
   * @param mediaId The id of the media to check
   * @return whether the cell has the associated the media id
   */
  containsMediaId(mediaId: number): boolean {
    return this.media.has(mediaId)
  }

  /**
   * Sets citations to in the cell.
   * @param citations the citations that will be affliated with the cell.
   */
  setCitations(citations: Citation[]) {
    this.citations = new Map()
    this.addCitations(citations)
  }

  /**
   * Adds citations to in the cell.
   * @param citations the citations that will be affliated with the cell.
   */
  addCitations(citations: Citation[]) {
    for (let x = 0; x < citations.length; x++) {
      const citation = citations[x]
      this.citations!.set(citation.getId(), citation)
    }
  }

  /**
   * Clears the citations within a cell. This is used to invalidate the cache so that it can be recomputed next time.
   */
  clearCitations() {
    this.citations = null
  }

  /**
   * Removes citations from the cell.
   * @param citationIds the ids of the citations affliated with the cell.
   */
  removeCitationById(citationIds: number[]) {
    const length = this.citations ? citationIds.length : 0
    for (let x = 0; x < length; x++) {
      this.citations!.delete(citationIds[x])
    }
  }

  /**
   * @return whether the citations are loaded.
   */
  isCitationsLoaded(): boolean {
    return this.citations !== null
  }

  /**
   * @return the citation affliated with the cell.
   */
  getCitations(): Citation[] {
    return this.citations ? Array.from(this.citations.values()) : []
  }

  /**
   * Gets a citation based on its id
   * @param citationId The id of the citation to get
   * @return the one citation associated by the citation id
   */
  getCitationById(citationId: number): Citation | undefined {
    return this.citations ? this.citations.get(citationId) : undefined
  }
}

/**
 * Cell Media Class
 * @param cellMediaObj the json representation of a cell.
 * @struct
 */
export class CellMedia {
  private cellMediaObj: { [key: string]: any }

  constructor(cellMediaObj: Object) {
    this.cellMediaObj = cellMediaObj
  }

  /**
   * @return The id of the cell media
   */
  getId(): number {
    return this.cellMediaObj['link_id']
  }

  /**
   * @return The character id of the cell media
   */
  getCharacterId(): number {
    return this.cellMediaObj['character_id']
  }

  /**
   * @return The taxa id of the cell media
   */
  getTaxonId(): number {
    return this.cellMediaObj['taxon_id']
  }

  /**
   * @return The media id of the cell media
   */
  getMediaId(): number {
    return this.cellMediaObj['media_id']
  }

  /**
   * @return the label count of the media
   */
  getLabelCount(): number {
    return this.cellMediaObj['label_count'] || 0
  }

  /**
   * Sets the new lcabel count of the media
   * @param labelCount the label count of the media
   */
  setLabelCount(labelCount: number) {
    this.cellMediaObj['label_count'] = labelCount
  }

  /**
   * @return The icon tag of the media
   */
  getIcon(): Media {
    return this.cellMediaObj['thumbnail']
  }

  /**
   * @return The tiny media
   */
  getTiny(): Media {
    return this.cellMediaObj['thumbnail']
  }
}
