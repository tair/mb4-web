import { UserPreferences } from './data/ProjectProperties'
import { Citation } from './data/Citation'
import { MatrixLoader } from './MatrixLoader'
import { PrefixedStorage } from './PrefixedStorage'
import { Request } from './MatrixLoader'
import { Cells, CellMedia, CellStates, CellInfoStatus } from './data/Cells'
import { Character, CharacterMedia, CharacterType } from './data/Characters'
import { CharacterRules, CharacterRule } from './data/CharacterRules'
import { Characters, CharacterState } from './data/Characters'
import { Matrix } from './data/Matrices'
import { MatrixOptions } from './data/MatrixOption'
import { Partition, Partitions } from './data/Partitions'
import { ProjectProperties } from './data/ProjectProperties'
import { Taxa, Taxon, TaxonMedia } from './data/Taxa'
import * as CellsChangedEvents from './events/CellsChangedEvent'
import * as CellsRefreshedEvent from './events/CellsRefreshedEvent'
import * as CharacterChangedEvents from './events/CharacterChangedEvent'
import * as CharacterRefreshedEvents from './events/CharacterRefreshedEvent'
import * as CharacterRulesAddedEvents from './events/CharacterRulesAddedEvent'
import * as CharacterRulesRemovedEvents from './events/CharacterRulesRemovedEvent'
import * as PartitionChangedEvents from './events/PartitionChangedEvent'
import * as PartitionRefreshedEvent from './events/PartitionRefreshedEvent'
import * as TaxaAddedEvents from './events/TaxaAddedEvent'
import * as TaxaChangedEvents from './events/TaxaChangedEvent'
import * as TaxaRefreshedEvent from './events/TaxaRefreshedEvent'
import * as TaxaRemovedEvents from './events/TaxaRemovedEvent'
import * as mb from './mb'

/**
 * Class that defines the data stored within the Matrix.
 * @param matrixId The id of the matrix
 * @param loader The xhr object to read and wrie the matrix data
 */
export class MatrixModel extends EventTarget {
  private currentPartitionId: number | null = null
  private readonly: boolean = false
  private streaming: boolean = false
  private characters: Characters
  private partitionCharacters: Character[] | null = null
  private taxa: Taxa
  private partitionTaxa: Taxon[] | null = null

  /**
   * The value of null indicates that the value is not loaded.
   */
  private availableTaxa: Taxa | null = null
  private cells: Cells
  private characterRules: CharacterRules
  private partitions: Partitions
  private matrix: Matrix
  private matrixOptions: MatrixOptions
  private projectProperties: ProjectProperties
  private clientId: string | null = null

  constructor(private matrixId: number, private loader: MatrixLoader) {
    super()

    this.characters = new Characters()
    this.taxa = new Taxa()
    this.cells = new Cells()
    this.characterRules = new CharacterRules()
    this.partitions = new Partitions()
    this.matrix = new Matrix({})
    this.matrixOptions = new MatrixOptions({})
    this.projectProperties = new ProjectProperties({})
  }

  /** @return the id of the matrix */
  getId(): number {
    return this.matrixId
  }

  /** @return total number of taxa. */
  getNumberOfTaxa(): number {
    return this.taxa.size()
  }

  /** @return total number of characters. */
  getNumberOfCharacters(): number {
    return this.characters.size()
  }

  /**  @return total capacity to the number of cells within this matrix. */
  getCellCapacity(): number {
    return this.taxa.size() * this.characters.size()
  }

  /** @return Whether the matrix is streaming. */
  isStreaming(): boolean {
    return this.streaming
  }

  /**
   * Determines whether we should stream the matrix.
   * @param streaming whether we should stream the matrix
   */
  setStreaming(streaming: boolean) {
    this.streaming = streaming
  }

  /**
   * Determines whether the matrix should be readonly.
   * @param readonly whether the matrix should be readonly.
   */
  setReadonly(readonly: boolean) {
    this.readonly = readonly
    this.loader.setReadonly(this.readonly)
  }

  /**
   * Determines whether the matrix should be readonly.
   * @return whether the matrix should be readonly.
   */
  isReadonly(): boolean {
    return !!this.readonly
  }

  /**
   * Sets the client ID.
   * @param clientId The client ID.
   */
  setClientId(clientId: string | null) {
    this.clientId = clientId
  }

  /**
   * Sets the characters within the matrix.
   */
  setCharacters(characterObjs: Object[]) {
    this.characters.set(characterObjs)
  }

  /** @return return the characters in the matrix. */
  getCharacters(): Characters {
    return this.characters
  }

  /** @return returns the current partition id. */
  getCurrentPartitionId(): number | null {
    return this.currentPartitionId
  }

  /**
   * Get the character at the given index.
   * @param id the id of the character
   * @return the index of the character
   */
  getCharacterIndexById(id: number): number {
    const characters = this.getPartitionCharacters()
    const character = this.characters.getById(id)
    return character ? characters.indexOf(character) : -1
  }

  /** @return return the partition characters in the matrix. */
  getPartitionCharacters(): Character[] {
    if (this.partitionCharacters) {
      return this.partitionCharacters
    }
    if (this.currentPartitionId == null) {
      this.partitionCharacters = this.characters.getAll()
      return this.partitionCharacters
    }
    const partition = this.getPartitions().getPartition(this.currentPartitionId)
    if (partition == null) {
      return []
    }

    const partitionCharacterIds = partition.getCharacterIds()
    this.partitionCharacters = this.characters.getByIds(partitionCharacterIds)
    return this.partitionCharacters
  }

  /**
   * Returns the character at the given index.
   * @param index the index to get the character at.
   * @return the character at the given index location.
   */
  getCharacterAt(index: number): Character {
    return this.characters.getAt(index)
  }

  /**
   * Get the taxon at the given index.
   * @param index the index to get the taxon at.
   * @return the taxon at the given index.
   */
  getTaxonAt(index: number): Taxon {
    return this.taxa.getAt(index)
  }

  /**
   * Get the taxon at the given index.
   * @param id the id of the taxa
   * @return the index of the taxon
   */
  getTaxonIndexById(id: number): number {
    const taxa = this.getPartitionTaxa()
    const taxon = this.taxa.getById(id)
    return taxon ? taxa.indexOf(taxon) : -1
  }

  /**
   * Sets the taxa within the matrix.
   */
  setTaxa(taxaObjs: Object[]) {
    this.taxa.set(taxaObjs)
  }

  /**
   * @return returns the taxa in the matrix.
   */
  getTaxa(): Taxa {
    return this.taxa
  }

  /**
   * @return returns the partition taxa in the matrix.
   */
  getPartitionTaxa(): Taxon[] {
    if (this.partitionTaxa) {
      return this.partitionTaxa
    }
    if (this.currentPartitionId == null) {
      this.partitionTaxa = this.taxa.getAll()
      return this.partitionTaxa
    }

    const partition = this.getPartitions().getPartition(this.currentPartitionId)
    if (partition == null) {
      return []
    }

    const partitionTaxaIds = partition.getTaxaIds()
    this.partitionTaxa = this.taxa.getByIds(partitionTaxaIds)
    return this.partitionTaxa
  }

  /** @return return the partition taxon ids in the matrix. */
  getPartitionTaxonIds(): number[] {
    if (this.currentPartitionId !== null) {
      const partition = this.getPartitions().getPartition(
        this.currentPartitionId
      )
      return partition ? partition.getTaxaIds() : []
    }
    return this.taxa.getIds()
  }

  /**
   * @return Whether the user has access to at least one taxon in the matrix
   */
  hasAccessToAtleastOneTaxon(): boolean {
    return this.taxa.hasAccessToAtleastOneTaxon(this.projectProperties)
  }

  /**
   * @return returns the cell in the matrix.
   */
  getCells(): Cells {
    return this.cells
  }

  /**
   * Add cell states to the matrix model.
   * @param cells the cells to add.
   */
  initCellStates(cells: Object[]) {
    this.cells.initCellStates(cells)
  }

  /**
   * Add cell notes to the matrix model.
   * @param notes the cells to add.
   */
  initCellNotes(notes: Object[]) {
    this.cells.initCellNotes(notes)
  }

  /**
   * Add cell counting information to the matrix model.
   * @param counts the cells to add.
   */
  initCellCounts(counts: Object) {
    this.cells.initCellCounts(counts)
  }

  /**
   * Add cell media to the matrix model.
   * @param cellMedia the cells to add.
   */
  initCellMedia(cellMedia: Object[]) {
    this.cells.initCellMedia(cellMedia)
  }

  /**
   * Sets the matrix
   * @param matrix matrix in json representation
   */
  setMatrix(matrix: Object) {
    this.matrix = new Matrix(matrix)
  }

  // TODO: Find a better way to set the matrix for characters and matrices. This
  //    is a quick fix for setting the matrices in the character editor.
  /**
   * Sets the matrix object.
   * @param matrix This matrix.
   */
  initMatrix(matrix: Matrix) {
    this.matrix = matrix
  }

  /**
   * @return this matrix
   */
  getMatrix(): Matrix {
    return this.matrix
  }

  /**
   * Sets the matrix options
   * @param options matrix options in json representation
   */
  setMatrixOptions(options: Object) {
    this.matrixOptions = new MatrixOptions(options)
  }

  /**
   * @return the options for this matrix
   */
  getMatrixOptions(): MatrixOptions {
    return this.matrixOptions
  }

  /**
   * Sets the matrix's project's properties
   * @param properties The project properties in json representation
   */
  setProjectProperties(properties: Object) {
    this.projectProperties = new ProjectProperties(properties)
  }

  /**
   * @return the properties of this matrix's project
   */
  getProjectProperties(): ProjectProperties {
    return this.projectProperties
  }

  /**
   * @return the current user's preferences for this matrix
   */
  getUserPreferences(): UserPreferences {
    return this.projectProperties.getUserPreferences()
  }

  /**
   * @return The user's matrix settings.
   */
  getUserMatrixSettings(): PrefixedStorage {
    const storage = mb.isLocalStorageAvailable()
      ? window.localStorage
      : window.sessionStorage
    return new PrefixedStorage(storage, 'mb-user-settings-' + this.matrixId)
  }

  /**
   * Converts the position  based on the position to the one based on the numbering mode
   * @param n The number based on the position
   * @return the number based on the numbering mode
   */
  fromNumberingMode(n: number): number {
    const preferences = this.getUserPreferences()
    return n - preferences.getDefaultNumberingMode()
  }

  /**
   * Adds available taxa in the matrix.
   *
   * @param position The position to move them too.
   */
  addTaxaToMatrix(taxaIds: number[], position: number): Promise<void> {
    const taxonIdAtPosition =
      position <= 0 ? 0 : this.taxa.getAt(position - 1).getId()
    const request = new Request('addTaxaToMatrix')
      .addParameter('id', this.matrixId)
      .addParameter('taxa_ids', taxaIds)
      .addParameter('after_taxon_id', taxonIdAtPosition)
    return this.loader
      .send(request)
      .then(() => {
        const taxa = this.availableTaxa!.removeByIds(taxaIds)
        this.taxa.addAt(taxa, position)
        this.partitionTaxa = null
      })
      .catch((error) => this.onError(error))
      .finally(() => {
        this.dispatchEvent(CellsRefreshedEvent.create())
        this.dispatchEvent(TaxaAddedEvents.create(taxaIds))
      })
  }

  /**
   * Removes taxa from the matrix.
   *
   * @param taxaIds the taxon ids to remove
   * @param consentToDelete True if the user was given a dialog and consented to deleting the taxa
   */
  removeTaxaFromMatrix(
    taxaIds: number[],
    consentToDelete: boolean
  ): Promise<void> {
    const request = new Request('removeTaxaFromMatrix')
      .addParameter('id', this.matrixId)
      .addParameter('consent_to_delete', consentToDelete ? 1 : 0)
      .addParameter('taxa_ids', taxaIds)
    return this.loader
      .send(request)
      .then(() => {
        const taxa = this.taxa.removeByIds(taxaIds)
        this.availableTaxa!.addAt(taxa, 0)
        this.availableTaxa!.sortAlphabetically()
        this.cells.clearScoresForTaxonId(taxaIds)
        this.partitionTaxa = null
      })
      .catch((error) => this.onError(error))
      .finally(() => {
        this.dispatchEvent(CellsRefreshedEvent.create())
        this.dispatchEvent(TaxaRemovedEvents.create(taxaIds))
      })
  }

  /**
   * Reorders the taxa in the matrix.
   *
   * @param taxaIds the taxon ids to reorder
   * @param position the position to move them too.
   */
  reorderTaxa(taxaIds: number[], position: number): Promise<void> {
    const request = new Request('reorderTaxa')
      .addParameter('id', this.matrixId)
      .addParameter('taxa_ids', taxaIds)
      .addParameter('index', position)
    return this.loader
      .send(request)
      .then(() => {
        this.partitionTaxa = null
        this.taxa.reorder(taxaIds, position)
        this.dispatchEvent(TaxaChangedEvents.create(taxaIds))
      })
      .catch((error) => this.onError(error))
      .finally(() => this.dispatchEvent(CellsRefreshedEvent.create()))
  }

  /**
   * Sets notes to a set of taxa
   *
   * @param taxaIds the taxon ids to reorder
   * @param notes the notes to set to the taxa
   */
  setTaxaNotes(taxaIds: number[], notes: string): Promise<void> {
    const request = new Request('setTaxaNotes')
      .addParameter('id', this.matrixId)
      .addParameter('taxa_ids', taxaIds)
      .addParameter('notes', notes)
    return this.loader
      .send(request)
      .then(() => {
        const taxa = this.getTaxa().getByIds(taxaIds)
        for (let x = 0; x < taxa.length; x++) {
          const taxon = taxa[x]
          taxon.setNotes(notes)
        }
        this.dispatchEvent(TaxaChangedEvents.create(taxaIds))
      })
      .catch((error) => this.onError(error))
      .finally(() => this.dispatchEvent(CellsRefreshedEvent.create()))
  }

  /**
   * Sets access to a set of taxa
   *
   * @param taxaIds the taxon ids to change their access
   * @param groupId the id of the group which will have access to this taxon
   */
  setTaxaAccess(taxaIds: number[], groupId: number): Promise<void> {
    const request = new Request('setTaxaAccess')
      .addParameter('id', this.matrixId)
      .addParameter('taxa_ids', taxaIds)
      .addParameter('group_id', groupId)
    return this.loader
      .send(request)
      .then(() => {
        const taxa = this.getTaxa().getByIds(taxaIds)
        for (let x = 0; x < taxa.length; x++) {
          const taxon = taxa[x]
          taxon.setGroupId(groupId)
        }
        this.dispatchEvent(TaxaChangedEvents.create(taxaIds))
      })
      .catch((error) => this.onError(error))
      .finally(() => this.dispatchEvent(CellsRefreshedEvent.create()))
  }

  /**
   * Adds media to a taxon
   *
   * @param taxaIds the taxon ids to add the media
   * @param mediaIds the id of the media which will be removed from the taxon
   */
  addTaxonMedia(taxaIds: number[], mediaIds: number[]): Promise<void> {
    const request = new Request('addTaxonMedia')
      .addParameter('id', this.matrixId)
      .addParameter('media_ids', mediaIds)
      .addParameter('taxa_ids', taxaIds)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const taxa = this.getTaxa()
        const safeResults = (results && results['media']) || []
        for (let x = 0; x < safeResults.length; x++) {
          const result = safeResults[x]
          const taxonId = result['taxon_id']
          const taxon = taxa.getById(taxonId)
          if (taxon !== null) {
            taxon.addMedia([new TaxonMedia(result)])
          }
        }
        this.dispatchEvent(TaxaChangedEvents.create(taxaIds))
      })
      .catch((error) => this.onError(error))
      .finally(() => this.dispatchEvent(CellsRefreshedEvent.create()))
  }

  /**
   * Removes media from a taxon
   *
   * @param taxaId the taxon ids to remove the media
   * @param mediaId the id of the media which will be removed from the taxon
   */
  removeTaxonMedia(taxaId: number, mediaId: number): Promise<void> {
    const taxon = this.getTaxa().getById(taxaId)
    const medium = taxon!.getMediaById(mediaId)
    const request = new Request('removeTaxonMedia')
      .addParameter('id', this.matrixId)
      .addParameter('link_id', medium!.getId())
    return this.loader
      .send(request)
      .then(() => {
        taxon!.removeMedia([mediaId])
        this.dispatchEvent(TaxaChangedEvents.create([taxaId]))
      })
      .catch((error) => this.onError(error))
      .finally(() => this.dispatchEvent(CellsRefreshedEvent.create()))
  }

  /**
   * Loads all media related to a taxon
   *
   * @param taxaId the taxon ids to search
   * @param search The search string to filter the results by
   */
  loadTaxaMedia(taxaId: number, search?: string | null): Promise<any> {
    const request = new Request('loadTaxaMedia')
      .addParameter('id', this.matrixId)
      .addParameter('taxon_id', taxaId)
      .addParameter('search', search)
    return this.loader
      .send(request)
      .then(
        (results: { [key: string]: any }) => (results && results['media']) || []
      )
      .catch((e) => this.onError(e))
  }

  /**
   * Gets the available Taxa, which which are in the project but not in this matrix
   */
  async getAvailableTaxa(): Promise<Taxa> {
    if (this.availableTaxa !== null) {
      return Promise.resolve(this.availableTaxa)
    }

    const request = new Request('getAvailableTaxa').addParameter(
      'id',
      this.matrixId
    )
    const results: { [key: string]: any } = await this.loader.send(request)
    this.availableTaxa = new Taxa()
    this.availableTaxa.set(results['taxa'])
    return this.availableTaxa
  }

  /**
   * Sets notes to a set of cells
   *
   * @param taxaIds the taxon ids to set
   * @param characterIds the character ids to set
   * @param notes the notes to set to the cell
   * @param status the status to set in the cell
   * @param batchmode whether this is a batched insert
   */
  setCellNotes(
    taxaIds: number[],
    characterIds: number[],
    notes?: string | null,
    status?: CellInfoStatus | null,
    batchmode?: number | null
  ): Promise<void> {
    const request = new Request('setCellNotes')
      .addParameter('id', this.matrixId)
      .addParameter('taxa_ids', taxaIds)
      .addParameter('character_ids', characterIds)
    if (notes !== undefined) {
      request.addParameter('notes', notes)
    }
    if (status !== undefined) {
      request.addParameter('status', status)
    }
    if (batchmode !== undefined) {
      request.addParameter('batchmode', batchmode)
    }
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const ts = parseInt(results['ts'], 10)
        for (let x = 0; x < taxaIds.length; x++) {
          const taxonId = taxaIds[x]
          for (let y = 0; y < characterIds.length; y++) {
            const characterId = characterIds[y]
            const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
            cellInfo.setLastUpdateTime(ts)
            if (notes !== undefined) {
              cellInfo.setNotes(String(notes))
            }
            if (status != null) {
              cellInfo.setStatus(status)
            }
          }
        }
        this.dispatchEvent(CellsChangedEvents.create(taxaIds, characterIds))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Adds media to a taxon
   *
   * @param taxonId the taxon id to add the media
   * @param characterIds the character ids to set
   * @param mediaIds the id of the media which will be removed from the taxon
   * @param batchmode whether this is a batched insert
   */
  addCellMedia(
    taxonId: number,
    characterIds: number[],
    mediaIds: number[],
    batchmode?: boolean | null
  ): Promise<void> {
    const request = new Request('addCellMedia')
      .addParameter('id', this.matrixId)
      .addParameter('media_ids', mediaIds)
      .addParameter('character_ids', characterIds)
      .addParameter('taxon_id', taxonId)
    if (batchmode !== undefined) {
      request.addParameter('batchmode', batchmode)
    }
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const safeResults = (results && results['media']) || []
        for (let x = 0; x < safeResults.length; x++) {
          const result = safeResults[x]
          const taxonId = result['taxon_id']
          const characterId = result['character_id']
          const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
          const cellMedia = new CellMedia(result)
          cellInfo.addMedia([cellMedia])
        }
        this.dispatchEvent(CellsChangedEvents.create([taxonId], characterIds))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Removes media from a cell
   *
   * @param taxonId the taxon id to remove the media
   * @param characterId the character id to remove the media
   * @param mediaId the id of the media which will be removed from the taxon
   * @param shouldCopyCitations whether we should copy the citations from the media file
   */
  removeCellMedia(
    taxonId: number,
    characterId: number,
    mediaId: number,
    shouldCopyCitations?: boolean | null
  ): Promise<void> {
    const cellInfo = this.cells.getCellInfo(taxonId, characterId)
    const medium = cellInfo.getMediaById(mediaId)
    const request = new Request('removeCellMedia')
      .addParameter('id', this.matrixId)
      .addParameter('link_id', medium!.getId())
      .addParameter('character_id', characterId)
      .addParameter('taxon_id', taxonId)
    if (shouldCopyCitations !== undefined) {
      request.addParameter('should_copy_citations', shouldCopyCitations)
    }
    return this.loader
      .send(request)
      .then(() => {
        cellInfo.removeMedia([mediaId])
        this.dispatchEvent(CellsChangedEvents.create([taxonId], [characterId]))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Removes media from cells
   *
   * @param taxonId the taxon id to remove the media
   * @param characterIds the character id to remove the media
   */
  removeCellsMedia(taxonId: number, characterIds: number[]): Promise<void> {
    const request = new Request('removeCellsMedia')
      .addParameter('id', this.matrixId)
      .addParameter('character_ids', characterIds)
      .addParameter('taxon_id', taxonId)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const taxonId = results && results['taxon_id']
        const characterIds = (results && results['character_ids']) || []
        if (!taxonId || characterIds.length === 0) {
          return
        }
        for (let x = 0; x < characterIds.length; x++) {
          const characterId = characterIds[x]
          const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
          cellInfo.removeAllMedia()
        }
        this.dispatchEvent(CellsChangedEvents.create([taxonId], characterIds))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Loads cell citations
   *
   * @param taxonId the taxon id to load the citations
   * @param characterId the character id to load the citations
   */
  async getCellCitations(
    taxonId: number,
    characterId: number
  ): Promise<Citation[]> {
    const request = new Request('getCellCitations')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('taxon_id', taxonId)
    const results: { [key: string]: any } = await this.loader.send(request)
    const safeResults = (results && results['citations']) || []

    const citations: Citation[] = []
    for (let x = 0; x < safeResults.length; x++) {
      citations.push(new Citation(safeResults[x]))
    }

    const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
    cellInfo.setCitations(citations)
    return citations
  }

  getLabelCount(linkId: number) {
    const request = new Request('getLabelCount')
      .addParameter('id', this.matrixId)
      .addParameter('link_id', linkId)
    return this.loader
      .send(request)
      .then((result: { [key: string]: any }) => {
        if (!result) {
          return
        }
        const taxonId = result['taxon_id']
        const characterId = result['character_id']
        const mediaId = result['media_id']
        const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
        const cellMedia = cellInfo.getMediaById(mediaId)
        if (cellMedia) {
          const labelCount = result['label_count']
          cellMedia.setLabelCount(labelCount)
        }
        this.dispatchEvent(
          CellsChangedEvents.create([taxonId], [characterId], true)
        )
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Edits a cell citation or adds one if it doesn't exists.
   *
   * @param taxonId the taxon id to load the citations
   * @param characterId the character id to load the citations
   * @param linkId the id of the citation if it exists
   * @param citationId the citation id to modify
   * @param pages the pages of the citation
   * @param notes the notes of the citation
   * @return The upserted citation
   */
  upsertCellCitation(
    taxonId: number,
    characterId: number,
    linkId: number | null,
    citationId: number,
    pages: string,
    notes: string
  ): Promise<Citation> {
    const request = new Request('upsertCellCitation')
      .addParameter('id', this.matrixId)
      .addParameter('taxon_id', taxonId)
      .addParameter('character_id', characterId)
      .addParameter('link_id', linkId)
      .addParameter('citation_id', citationId)
      .addParameter('pp', pages)
      .addParameter('notes', notes)
    return this.loader.send(request).then((result: { [key: string]: any }) => {
      const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
      let citation
      if (linkId) {
        citation = cellInfo.getCitationById(linkId)
        citation.setPages(pages)
        citation.setNotes(notes)
      } else {
        citation = new Citation(result['citation'])
        if (cellInfo.isCitationsLoaded()) {
          cellInfo.addCitations([citation])
        } else {
          cellInfo.setCitations([citation])
        }
      }
      return citation
    })
  }

  /**
   * Edits a cell citation or adds one if it doesn't exists.
   *
   * @param taxonIds the taxon id to load the citations
   * @param characterIds the character id to load the citations
   * @param citationId the citation id to modify
   * @param pages the pages of the citation
   * @param notes the notes of the citation
   * @param batchmode whether this is a batched insert
   */
  addCellCitations(
    taxonIds: number[],
    characterIds: number[],
    citationId: number,
    pages: string,
    notes: string,
    batchmode?: number | null
  ): Promise<void> {
    const request = new Request('addCellCitations')
      .addParameter('id', this.matrixId)
      .addParameter('taxon_ids', taxonIds)
      .addParameter('character_ids', characterIds)
      .addParameter('citation_id', citationId)
      .addParameter('pp', pages)
      .addParameter('notes', notes)
    if (batchmode !== undefined) {
      request.addParameter('batchmode', batchmode)
    }
    return this.loader
      .send(request)
      .then((result: { [key: string]: any }) => {
        const pp = result['pp']
        const notes = result['notes']
        const name = result['name']
        const citationId = result['citation_id']
        const citations = result['citations']
        for (let x = 0; x < citations.length; x++) {
          const taxonId = citations['taxon_id']
          const characterId = citations['character_id']
          const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
          if (cellInfo.isCitationsLoaded()) {
            const linkId = citations['link_id']
            const citationObj = {
              link_id: linkId,
              citation_id: citationId,
              pp: pp,
              notes: notes,
              name: name,
            }
            const citation = new Citation(citationObj)
            cellInfo.addCitations([citation])
          }
        }
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Removes citation from a cell
   *
   * @param taxonId the taxon id to load the citations
   * @param characterId the character id to load the citations
   * @param citationId the citation id to modify
   */
  removeCellCitation(
    taxonId: number,
    characterId: number,
    citationId: number
  ): Promise<void> {
    const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
    const request = new Request('removeCellCitation')
      .addParameter('id', this.matrixId)
      .addParameter('link_id', citationId)
    return this.loader
      .send(request)
      .then(() => cellInfo.removeCitationById([citationId]))
      .catch((e) => this.onError(e))
  }

  /**
   * Finds citations
   *
   * @param text the text to search for
   */
  findCitation(text: string): Promise<Object[]> {
    const request = new Request('findCitation')
      .addParameter('id', this.matrixId)
      .addParameter('text', text)
    return this.loader
      .send(request)
      .then(
        (results: { [key: string]: any }) =>
          (results && results['citations']) || []
      )
      .catch((e) => this.onError(e))
  }

  /**
   * Loads cell comments
   *
   * @param taxonId the taxon id to load the comments
   * @param characterId the character id to load the comments
   */
  getCellComments(taxonId: number, characterId: number): Promise<Object[]> {
    const request = new Request('getCellComments')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('taxon_id', taxonId)
    return this.loader
      .send(request)
      .then(
        (results: { [key: string]: any }) =>
          (results && results['comments']) || []
      )
      .catch((e) => this.onError(e))
  }

  /**
   * Loads cell comments
   *
   * @param taxonId the taxon id to load the comments
   * @param characterId the character id to load the comments
   * @param text the text of the comment
   */
  addCellComment(
    taxonId: number,
    characterId: number,
    text: string
  ): Promise<void> {
    const request = new Request('addCellComment')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('taxon_id', taxonId)
      .addParameter('text', text)
    return this.loader
      .send(request)
      .then(
        (results: { [key: string]: any }) =>
          (results && results['comment']) || []
      )
      .catch((e) => this.onError(e))
  }

  /**
   * Loads cell changes
   *
   * @param taxonId the taxon id to load the changes
   * @param characterId the character id to load the changes
   */
  getCellChanges(taxonId: number, characterId: number): Promise<Object[]> {
    const request = new Request('getCellChanges')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('taxon_id', taxonId)
    return this.loader
      .send(request)
      .then(
        (results: { [key: string]: any }) => (results && results['logs']) || []
      )
      .catch((e) => this.onError(e))
  }

  /**
   * Loads the character rule violations
   */
  getCharacterRuleViolations(): Promise<Object[]> {
    const request = new Request('getCharacterRuleViolations').addParameter(
      'id',
      this.matrixId
    )
    return this.loader
      .send(request)
      .then(
        (results: { [key: string]: any }) => results && results['violations']
      )
      .catch((e) => this.onError(e))
  }

  /**
   * Fixes the given character rule violations
   * @param violations The violations to be fixed
   */
  fixSelectedCharacterRuleViolations(violations: Object): Promise<void> {
    const request = new Request('fixSelectedCharacterRuleViolations')
      .addParameter('id', this.matrixId)
      .addParameter('violations', violations)
    return this.loader
      .send(request)
      .then((results) => this.maybeAddCellStateAndCellMedia(results))
      .catch((e) => this.onError(e))
  }

  /**
   * Fixes all character rule violations
   */
  fixAllCharacterRuleViolations(): Promise<void> {
    const request = new Request('fixAllCharacterRuleViolations').addParameter(
      'id',
      this.matrixId
    )
    return this.loader
      .send(request)
      .then((results) => this.maybeAddCellStateAndCellMedia(results))
      .catch((e) => this.onError(e))
  }

  /**
   * Adds cells states and cell media to the grid
   */
  private maybeAddCellStateAndCellMedia(results: { [key: string]: any }) {
    const changedCharacterIds: number[] = []
    const changedTaxaIds: number[] = []
    const cells = (results && results['cells']) || []
    this.cells.clearAndAddCellStates(cells)
    for (let x = 0; x < cells.length; x++) {
      const cell = cells[x]
      changedTaxaIds.push(cell['tid'])
      changedCharacterIds.push(cell['cid'])
    }

    // Update last scored on for the characters
    const timestamp = results['ts']
    for (let x = 0; x < changedCharacterIds.length; x++) {
      const characterId = changedCharacterIds[x]
      const character = this.characters.getById(characterId)
      character!.setLastScoredOn(timestamp)
    }
    const media = (results && results['media']) || []
    for (let x = 0; x < media.length; x++) {
      const medium = media[x]
      const taxonId = medium['taxon_id']
      const characterId = medium['character_id']
      const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
      const cellMedia = new CellMedia(medium)
      cellInfo.addMedia([cellMedia])

      // Add changed taxa and characters
      changedTaxaIds.push(taxonId)
      changedCharacterIds.push(characterId)
    }
    this.dispatchEvent(
      CellsChangedEvents.create(changedTaxaIds, changedCharacterIds)
    )
    this.dispatchEvent(CharacterRefreshedEvents.create(changedCharacterIds))
  }

  /**
   * Loads character citations
   *
   * @param characterId the character id to load the citations
   */
  async getCharacterCitations(characterId: number): Promise<Citation[]> {
    const request = new Request('getCharacterCitations')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
    const results: { [key: string]: any } = await this.loader.send(request)

    const citations: Citation[] = []
    const safeResults = (results && results['citations']) || []
    for (let x = 0; x < safeResults.length; x++) {
      citations.push(new Citation(safeResults[x]))
    }

    const character = this.characters.getById(characterId)
    if (character) {
      character.setCitations(citations)
      character.setCitationCount(citations.length)
    }

    return citations
  }

  /**
   * Edits a character citation or adds one if it doesn't exists.
   *
   * @param characterId the character id to load the citations
   * @param linkId the id of the citation if it exists
   * @param citationId the citation id to modify
   * @param pages the pages of the citation
   * @param notes the notes of the citation
   */
  async upsertCharacterCitation(
    characterId: number,
    linkId: number | null,
    citationId: number,
    pages: string,
    notes: string
  ): Promise<Citation> {
    const character = this.characters.getById(characterId)
    if (!character) {
      return Promise.reject('Character not found in this matrix')
    }

    const request = new Request('upsertCharacterCitation')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('link_id', linkId)
      .addParameter('citation_id', citationId)
      .addParameter('pp', pages)
      .addParameter('notes', notes)
    const result: { [key: string]: any } = this.loader.send(request)

    let citation
    if (linkId) {
      citation = character.getCitationById(linkId)
      if (citation) {
        citation.setPages(pages)
        citation.setNotes(notes)
      }
    } else {
      citation = new Citation(result['citation'])
      character.addCitations([citation])
      character.setCitationCount(character.getCitationCount() + 1)
    }
    return citation
  }

  /**
   * Removes citation from a character
   *
   * @param characterId the character id to load the citations
   * @param citationId the citation id to modify
   */
  removeCharacterCitation(
    characterId: number,
    citationId: number
  ): Promise<void> {
    const character = this.characters.getById(characterId)
    if (!character) {
      return Promise.reject('Character not found in this matrix')
    }

    const request = new Request('removeCharacterCitation')
      .addParameter('id', this.matrixId)
      .addParameter('link_id', citationId)
    return this.loader
      .send(request)
      .then(() => {
        character.removeCitationById([citationId])
        character.setCitationCount(character.getCitationCount() - 1)
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Loads character changes
   *
   * @param characterId the character id to load the changes
   */
  getCharacterChanges(characterId: number): Promise<Object[]> {
    const request = new Request('getCharacterChanges')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
    return this.loader
      .send(request)
      .then(
        (results: { [key: string]: any }) => (results && results['logs']) || []
      )
      .catch((e) => this.onError(e))
  }

  /**
   * Loads character changes
   *
   * @param characterId the character id set information
   * @param name the new name of the character
   * @param description the new description of the character
   * @param ordering the character's ordering
   * @param states the states of the character
   * @param isMinorEdit whether the edit is minor.
   */
  updateCharacter(
    characterId: number,
    name: string,
    description: string,
    ordering: number,
    states: Object,
    isMinorEdit: boolean
  ): Promise<void> {
    const character = this.characters.getById(characterId)
    if (!character) {
      return Promise.reject('Character not found in this matrix')
    }

    const request = new Request('updateCharacter')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('name', name)
      .addParameter('description', description)
      .addParameter('ordering', ordering)
      .addParameter('states', states)
      .addParameter('is_minor_edit', isMinorEdit)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        // Update the character
        character.setName(results['name'])
        character.setDescription(results['description'])
        character.setOrdering(ordering)
        const timestamp = parseInt(results['ts'], 10)
        if (timestamp > 0 && !results['is_minor_edit']) {
          character.setLastChangedOn(timestamp)
        }

        // Update the character states
        const states = results['states'] || []
        const newCharacterStates: CharacterState[] = []
        for (let x = 0; x < states.length; x++) {
          const state = states[x]
          newCharacterStates.push(new CharacterState(state))
        }
        character.setStates(newCharacterStates)

        // Update the cells
        const deletedStateIds = results['deleted_state_ids'] || []
        if (deletedStateIds.length) {
          this.cells.deleteCellsWithCharacterState(characterId, deletedStateIds)

          // Update character rules
          this.characterRules.deleteRulesForCharacterState(
            characterId,
            deletedStateIds
          )

          // dispatch events
          this.dispatchEvent(
            CellsChangedEvents.create(
              this.getPartitionTaxonIds(),
              [characterId],
              true
            )
          )
        }
        this.dispatchEvent(CharacterChangedEvents.create([characterId]))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Update the orderings of the characters
   *
   * @param characterIds the character ids to update the orderings
   * @param ordering the character's ordering
   */
  updateCharactersOrdering(
    characterIds: number[],
    ordering: number
  ): Promise<void> {
    const characters = this.characters.getByIds(characterIds)
    const request = new Request('updateCharactersOrdering')
      .addParameter('id', this.matrixId)
      .addParameter('character_ids', characterIds)
      .addParameter('ordering', ordering)
    return this.loader
      .send(request)
      .then(() => {
        for (let x = 0; x < characters.length; x++) {
          const character = characters[x]
          character.setOrdering(ordering)
        }
        this.dispatchEvent(CharacterChangedEvents.create(characterIds))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Adds a character at a given index.
   * @param name The name of the character to add
   * @param index The position to add the character
   * @param charType The type of character to add (i.e continuous, discrete).
   */
  addCharacter(
    name: string | null,
    index: number,
    charType: string
  ): Promise<void> {
    const request = new Request('addCharacter')
      .addParameter('id', this.matrixId)
      .addParameter('name', name)
      .addParameter('charType', charType)
      .addParameter('index', index)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        this.partitionCharacters = null
        const newCharacter = new Character(results['character'])
        this.characters.addAt([newCharacter], newCharacter.getNumber() - 1)

        // Since this reorders characters we want to refresh all characters
        this.dispatchEvent(CharacterChangedEvents.create())
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Removes characters from the matrix
   *
   * @param characterIds An array of character ids to remove
   */
  removeCharacters(characterIds: number[]): Promise<void> {
    const request = new Request('removeCharacters')
      .addParameter('id', this.matrixId)
      .addParameter('character_ids', characterIds)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        this.partitionCharacters = null
        const characterIds = (results && results['character_ids']) || []
        this.characters.removeByIds(characterIds)
        this.characterRules.deleteRulesForCharacterIds(characterIds)

        // since this reorders characters we want to refresh all characters
        this.dispatchEvent(CharacterChangedEvents.create())
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Reorders character changes
   *
   * @param characterIds the character ids to reorder
   * @param index The index to move to
   */
  reorderCharacters(characterIds: number[], index: number): Promise<void> {
    const request = new Request('reorderCharacters')
      .addParameter('id', this.matrixId)
      .addParameter('character_ids', characterIds)
      .addParameter('index', index)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        if (results && results['success']) {
          this.partitionCharacters = null
          this.characters.reorder(characterIds, index)
          this.dispatchEvent(CharacterChangedEvents.create())
        }
      })
      .catch((error) => this.onError(error))
      .finally(() => this.dispatchEvent(CellsRefreshedEvent.create()))
  }

  setCellRulesState(taxaIds: number[], characterIds: number[]) {
    const request = new Request('setCellRulesState')
      .addParameter('id', this.matrixId)
      .addParameter('character_ids', characterIds)
      .addParameter('taxon_ids', taxaIds)
    return this.loader.send(request).catch((e) => this.onError(e))
  }

  /**
   * Sets the cell states based. This overwrites the old cell states with the new one.
   *
   * @param taxaIds the taxon ids to set the scores
   * @param characterIds the character id to set the scores
   * @param stateIds the state ids to set as scores
   * @param options the options for scoring
   */
  setCellStates(
    taxaIds: number[],
    characterIds: number[],
    stateIds: (number | null)[],
    options: { [key: string]: number }
  ): Promise<void> {
    const request = new Request('setCellStates')
      .addParameter('id', this.matrixId)
      .addParameter('character_ids', characterIds)
      .addParameter('taxa_ids', taxaIds)
      .addParameter('state_ids', stateIds)
    if (options) {
      request.addParameter('options', options)
    }
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const cells = (results && results['cells']) || []
        this.cells.clearAndAddCellStates(cells)
        const taxaIdsSet = new Set(taxaIds)
        const characterIdsSet = new Set(characterIds)
        for (let x = 0; x < cells.length; x++) {
          const cell = cells[x]
          taxaIdsSet.add(cell['tid'])
          characterIdsSet.add(cell['cid'])
        }

        // Update last scored on
        const timestamp = results['ts']
        const changedCharacterIds = Array.from(characterIdsSet.values())
        for (let x = 0, l = changedCharacterIds.length; x < l; ++x) {
          const characterId = changedCharacterIds[x]
          const character = this.characters.getById(characterId)
          if (character) {
            character.setLastScoredOn(timestamp)
          }
        }
        const changedTaxaIds = Array.from(taxaIdsSet.values())
        this.dispatchEvent(
          CellsChangedEvents.create(changedTaxaIds, changedCharacterIds)
        )
        this.dispatchEvent(CharacterRefreshedEvents.create(changedCharacterIds))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Sets the cell states based. This overwrites the old cell states with the new one.
   *
   * @param taxaIds the taxon ids to set the scores
   * @param characterIds the character id to set the scores
   * @param startValue starting value of range
   * @param endValue ending value of range
   * @param options the options for scoring
   */
  setContinuousValues(
    taxaIds: number[],
    characterIds: number[],
    startValue: number | null,
    endValue: number | null,
    options?: { [key: string]: number } | null
  ): Promise<void> {
    const request = new Request('setCellContinuousValues')
      .addParameter('id', this.matrixId)
      .addParameter('character_ids', characterIds)
      .addParameter('taxa_ids', taxaIds)
      .addParameter('startValue', startValue)
      .addParameter('endValue', endValue)
    if (options) {
      request.addParameter('options', options)
    }
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const cells = (results && results['cells']) || []
        this.cells.clearAndAddCellStates(cells)
        const taxaIdsSet = new Set(taxaIds)
        const characterIdsSet = new Set(characterIds)
        for (let x = 0; x < cells.length; x++) {
          const cell = cells[x]
          taxaIdsSet.add(cell['tid'])
          characterIdsSet.add(cell['cid'])
        }

        // Update last scored on
        const timestamp = results['ts']
        const changedCharacterIds = Array.from(characterIdsSet.keys())
        for (let x = 0, l = changedCharacterIds.length; x < l; ++x) {
          const characterId = changedCharacterIds[x]
          const character = this.characters.getById(characterId)
          if (character) {
            character.setLastScoredOn(timestamp)
          }
        }
        const changedTaxaIds = Array.from(taxaIdsSet.keys())
        this.dispatchEvent(
          CellsChangedEvents.create(changedTaxaIds, changedCharacterIds)
        )
        this.dispatchEvent(CharacterRefreshedEvents.create(changedCharacterIds))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * @return A promise indicating whether the matrix was updated.
   */
  async sync(): Promise<boolean> {
    if (!this.clientId) {
      return Promise.resolve(false)
    }
    const request = new Request('fetchChanges')
      .addParameter('id', this.matrixId)
      .setRetries(0)
      .setTimeoutInterval(
        /* 5 minutes */
        300000
      )
    const data: { [key: string]: any } = await this.loader.send(request)

    const modifiedCells = (data && data['cells']) || []
    this.cells.clearAndAddCellStates(modifiedCells)
    const modifiedNotes = data['notes'] || []
    for (let x = 0; x < modifiedNotes.length; x++) {
      const note = modifiedNotes[x]
      const cellInfo = this.cells.mayCreateCellInfo(
        note['taxon_id'],
        note['character_id']
      )
      cellInfo.setNotes(note['notes'])
      cellInfo.setStatus(note['status'])
      cellInfo.setLastUpdateTime(new Date().getTime())
    }

    // If citations where updated, we remove the citations from the matrix so that they will be
    // re-fetched when they are viewed.
    const modifiedCitations = data['citations'] || []
    for (let x = 0; x < modifiedCitations.length; x++) {
      const citation = modifiedCitations[x]
      const cellInfo = this.cells.mayCreateCellInfo(
        citation['taxon_id'],
        citation['character_id']
      )
      cellInfo.clearCitations()
      cellInfo.setLastUpdateTime(new Date().getTime())
    }

    // Media contains all of the media from the affected cell. We do not want to prepend
    // the same media so we remove all the media from a cell first and then add it.
    const modifiedMedia = data['media'] || []
    for (let x = 0; x < modifiedMedia.length; x++) {
      const media = modifiedMedia[x]
      const cellInfo = this.cells.mayCreateCellInfo(
        media['taxon_id'],
        media['character_id']
      )
      cellInfo.removeAllMedia()
    }

    for (let x = 0; x < modifiedMedia.length; x++) {
      const media = modifiedMedia[x]
      const cellInfo = this.cells.mayCreateCellInfo(
        media['taxon_id'],
        media['character_id']
      )
      const cellMedia = new CellMedia(media)
      if (cellMedia.getId()) {
        cellInfo.addMedia([cellMedia])
        cellInfo.setLastUpdateTime(new Date().getTime())
      }
    }

    const modifiedCharacters = data['characters'] || []
    if (modifiedCharacters.length) {
      const charactersToAdd: Character[] = modifiedCharacters.map(
        this.characters.createItem
      )
      this.characters.add(charactersToAdd)
      const characterIds = charactersToAdd.map((character) => character.getId())
      this.dispatchEvent(CharacterRefreshedEvents.create(characterIds))
    }

    const modifiedTaxa = data['taxa'] || []
    if (modifiedTaxa.length) {
      const taxaToAdd = modifiedTaxa.map(this.taxa.createItem)
      this.taxa.add(taxaToAdd)
      this.dispatchEvent(TaxaRefreshedEvent.create())
    }

    const order = data['order']
    if (!!order) {
      this.characters.reorder(order['characters'], 0)
      this.taxa.reorder(order['taxa'], 0)
      this.dispatchEvent(TaxaRefreshedEvent.create())
      this.dispatchEvent(CharacterRefreshedEvents.create())
    }

    const partitionObjs = data['partitions'] || []
    if (partitionObjs.length) {
      for (let x = 0; x < partitionObjs.length; x++) {
        const partition = new Partition(partitionObjs[x])
        this.partitions.addPartition(partition)
      }
      this.dispatchEvent(PartitionRefreshedEvent.create())
    }

    const taxaIds = data['taxa_ids'] || []
    const characterIds = data['character_ids'] || []
    if (taxaIds.length && characterIds.length) {
      this.dispatchEvent(CellsChangedEvents.create(taxaIds, characterIds, true))
    }

    return !taxaIds.length
  }

  /**
   * Updates a cell score such that it's time stamp is up to date but does not change the score.
   *
   * @param taxaIds the taxon ids to set the scores
   * @param characterIds the character id to set the scores
   */
  logCellCheck(taxaIds: number[], characterIds: number[]): Promise<void> {
    const request = new Request('logCellCheck')
      .addParameter('id', this.matrixId)
      .addParameter('character_ids', characterIds)
      .addParameter('taxa_ids', taxaIds)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        // Update last scored on
        const timestamp = results['ts']
        for (let x = 0; x < characterIds.length; x++) {
          const characterId = characterIds[x]
          const character = this.characters.getById(characterId)
          if (character) {
            character.setLastScoredOn(timestamp)
          }
        }
        this.dispatchEvent(CharacterChangedEvents.create(characterIds))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Sets the partition of the matrix
   *
   * @param partitionId the id of the partition.
   */
  setPartitionId(partitionId: number | null) {
    if (this.currentPartitionId === partitionId) {
      return
    }

    // clear out old partitions
    this.partitionCharacters = null
    this.partitionTaxa = null
    this.currentPartitionId = partitionId
    this.dispatchEvent(PartitionRefreshedEvent.create())
    this.dispatchEvent(CellsRefreshedEvent.create())
  }

  /**
   * Adds a partition
   *
   * @param name the name of the partition.
   * @param description the description of the partition.
   */
  addPartition(name: string, description: string): Promise<void> {
    const request = new Request('addPartition')
      .addParameter('id', this.matrixId)
      .addParameter('name', name)
      .addParameter('description', description)
    return this.loader
      .send(request)
      .then((partitionObj) => {
        const partition = new Partition(partitionObj)
        this.partitions.addPartition(partition)
        this.dispatchEvent(PartitionChangedEvents.create(partition.getId()))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Copies a partition
   *
   * @param partitionId the id of the partition to copy
   * @param name the name of the partition.
   * @param description the description of the partition.
   */
  copyPartition(
    partitionId: number,
    name: string,
    description: string
  ): Promise<void> {
    const request = new Request('copyPartition')
      .addParameter('id', this.matrixId)
      .addParameter('partition_id', partitionId)
      .addParameter('name', name)
      .addParameter('description', description)
    return this.loader
      .send(request)
      .then((partitionObj) => {
        const partition = new Partition(partitionObj)
        this.partitions.addPartition(partition)
        this.dispatchEvent(PartitionChangedEvents.create(partition.getId()))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Edits a partition
   *
   * @param partitionId the id of the partition.
   */
  editPartition(
    partitionId: number,
    name: string,
    description: string
  ): Promise<void> {
    const partition = this.partitions.getPartition(partitionId)
    if (partition == null) {
      return Promise.reject('Partition is not found in this matrix')
    }

    const request = new Request('editPartition')
      .addParameter('id', this.matrixId)
      .addParameter('partition_id', partitionId)
      .addParameter('name', name)
      .addParameter('description', description)
    return this.loader
      .send(request)
      .then(() => {
        partition.setName(name)
        partition.setDescription(description)
        this.dispatchEvent(PartitionChangedEvents.create(partition.getId()))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Removes a partition
   *
   * @param partitionId the id of the partition.
   */
  removePartition(partitionId: number): Promise<void> {
    const request = new Request('removePartition')
      .addParameter('id', this.matrixId)
      .addParameter('partition_id', partitionId)
    return this.loader
      .send(request)
      .then(() => {
        const partitions = this.getPartitions()
        partitions.removePartition(partitionId)
        if (partitionId === this.currentPartitionId) {
          this.setPartitionId(null)
        }
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Adds taxa to a partition
   *
   * @param partitionId the id of the partition.
   * @param taxaIds the taxon ids to add to the partition
   */
  addTaxaToPartition(partitionId: number, taxaIds: number[]): Promise<void> {
    const partition = this.getPartitions().getPartition(partitionId)
    if (partition == null) {
      return Promise.reject('Partition is not found in this matrix')
    }

    const request = new Request('addTaxaToPartition')
      .addParameter('id', this.matrixId)
      .addParameter('taxa_ids', taxaIds)
      .addParameter('partition_id', partitionId)
    return this.loader
      .send(request)
      .then(() => {
        partition.addTaxaIds(taxaIds)
        if (partitionId === this.currentPartitionId) {
          this.partitionTaxa = null
        }
        this.dispatchEvent(PartitionChangedEvents.create(partition.getId()))
      })
      .catch((error) => this.onError(error))
      .finally(() => {
        this.dispatchEvent(TaxaChangedEvents.create())
        this.dispatchEvent(CellsRefreshedEvent.create())
      })
  }

  /**
   * Removes taxa from a partition
   *
   * @param partitionId the id of the partition.
   * @param taxaIds the taxon ids to remove to the partition
   */
  removeTaxaFromPartition(
    partitionId: number,
    taxaIds: number[]
  ): Promise<void> {
    const partition = this.getPartitions().getPartition(partitionId)
    if (partition == null) {
      return Promise.reject('Partition is not found in this matrix')
    }

    const request = new Request('removeTaxaToPartition')
      .addParameter('id', this.matrixId)
      .addParameter('taxa_ids', taxaIds)
      .addParameter('partition_id', partitionId)
    return this.loader
      .send(request)
      .then(() => {
        partition.removeTaxaIds(taxaIds)
        if (partitionId === this.currentPartitionId) {
          this.partitionTaxa = null
        }
        this.dispatchEvent(PartitionChangedEvents.create(partition.getId()))
      })
      .catch((error) => this.onError(error))
      .finally(() => {
        this.dispatchEvent(TaxaChangedEvents.create())
        this.dispatchEvent(CellsRefreshedEvent.create())
      })
  }

  /**
   * Adds characters to a partition
   *
   * @param partitionId the id of the partition.
   * @param characterIds the character ids to add to the partition
   */
  addCharactersToPartition(
    partitionId: number,
    characterIds: number[]
  ): Promise<void> {
    const partition = this.getPartitions().getPartition(partitionId)
    if (partition == null) {
      return Promise.reject('Partition is not found in this matrix')
    }

    const request = new Request('addCharactersToPartition')
      .addParameter('id', this.matrixId)
      .addParameter('character_ids', characterIds)
      .addParameter('partition_id', partitionId)
    return this.loader
      .send(request)
      .then(() => {
        partition.addCharactersIds(characterIds)
        if (partitionId === this.currentPartitionId) {
          this.partitionCharacters = null
        }
        this.dispatchEvent(PartitionChangedEvents.create(partition.getId()))
      })
      .catch((error) => this.onError(error))
      .finally(() => {
        this.dispatchEvent(CharacterChangedEvents.create())
        this.dispatchEvent(CellsRefreshedEvent.create())
      })
  }

  /**
   * Removes taxa from a partition
   *
   * @param partitionId the id of the partition.
   * @param characterIds the character ids to add to the partition
   */
  removeCharactersFromPartition(
    partitionId: number,
    characterIds: number[]
  ): Promise<void> {
    const partition = this.getPartitions().getPartition(partitionId)
    if (partition == null) {
      return Promise.reject('Partition is not found in this matrix')
    }

    const request = new Request('removeCharactersFromPartition')
      .addParameter('id', this.matrixId)
      .addParameter('character_ids', characterIds)
      .addParameter('partition_id', partitionId)
    return this.loader
      .send(request)
      .then(() => {
        partition.removeCharactersIds(characterIds)
        if (partitionId === this.currentPartitionId) {
          this.partitionCharacters = null
        }
        this.dispatchEvent(PartitionChangedEvents.create(partition.getId()))
      })
      .catch((error) => this.onError(error))
      .finally(() => {
        this.dispatchEvent(CharacterChangedEvents.create())
        this.dispatchEvent(CellsRefreshedEvent.create())
      })
  }

  /**
   * Adds a character rule action to the mmodel
   *
   * @param action The type of rule to add
   */
  addCharacterRuleAction(
    action: string,
    characterId: number,
    stateId: number | null,
    actionCharacterIds: number[],
    actionStateId: number | null
  ): Promise<void> {
    const request = new Request('addCharacterRuleAction')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('state_id', stateId)
      .addParameter('action_character_ids', actionCharacterIds)
      .addParameter('action_state_id', actionStateId)
      .addParameter('action', action)
    return this.loader
      .send(request)
      .then((actionObj: { [key: string]: any }) => {
        const characterRules = this.getCharacterRules()
        const actionIds = actionObj['ads']
        const modifiedCharacters = [actionObj['cd']]
        for (let x = 0; x < actionIds.length; x++) {
          const actionCharacterId = actionObj['acds'][x]
          const rule = new CharacterRule({
            id: actionObj['id'],
            ad: actionIds[x],
            cd: actionObj['cd'],
            sd: actionObj['sd'],
            acd: actionCharacterId,
            asd: actionObj['asd'],
            a: actionObj['a'],
          })
          characterRules.addRuleAction(rule)
          modifiedCharacters.push(actionCharacterId)
        }
        this.dispatchEvent(CharacterRulesAddedEvents.create(modifiedCharacters))
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Removes character rule action.
   *
   */
  removeCharacterRuleAction(
    characterId: number,
    actionId: number
  ): Promise<void> {
    const characterRules = this.getCharacterRules()
    const rule = characterRules.getRulesForActionId(actionId)
    if (rule == null) {
      return Promise.reject('Failed to get character rules')
    }

    const request = new Request('removeCharacterRuleAction')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('action_id', actionId)
    return this.loader
      .send(request)
      .then(() => {
        const modifiedCharacters = [
          rule.getCharacterId(),
          rule.getActionCharacterId(),
        ]
        characterRules.removeRuleAction(actionId)
        this.dispatchEvent(
          CharacterRulesRemovedEvents.create(modifiedCharacters)
        )
      })
      .catch((e) => this.onError(e))
  }

  /**
   * Loads character comments
   *
   * @param characterId the character id to load the comments
   */
  getCharacterComments(characterId: number): Promise<Object[]> {
    const request = new Request('getCharacterComments')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const comments = (results && results['comments']) || []
        const character = this.characters.getById(characterId)
        if (character) {
          character.setCommentCount(comments.length)
        }
        return comments
      })
      .catch((error) => this.onError(error))
  }

  /**
   * Adds character comments
   *
   * @param characterId the character id to add the comments to
   * @param stateId the state id to add the comments to
   * @param text the text of the comment
   */
  addCharacterComment(
    characterId: number,
    stateId: number,
    text: string
  ): Promise<Object> {
    const character = this.characters.getById(characterId)
    if (character == null) {
      return Promise.reject('Character not found')
    }
    const request = new Request('addCharacterComment')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('state_id', stateId)
      .addParameter('text', text)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const commentCount = character.getCommentCount()
        character.setCommentCount(commentCount + 1)
        return (results && results['comment']) || []
      })
      .catch((error) => this.onError(error))
  }

  /**
   * Marks a character's comment as unread
   *
   * @param characterId the character id to mark its comment as unread
   */
  setCharacterCommentsAsUnread(characterId: number): Promise<void> {
    const character = this.characters.getById(characterId)
    if (character == null) {
      return Promise.reject('Character not found')
    }

    const request = new Request('setCharacterCommentsAsUnread')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
    return this.loader
      .send(request)
      .then(() => {
        const commentCount = character.getCommentCount()
        character.setUnreadCommentCount(commentCount)
      })
      .catch((error) => this.onError(error))
  }

  /**
   * Find character media based on a given text
   *
   * @param characterId the character id to search
   * @param search The text to search
   */
  findCharacterMedia(characterId: number, search: string): Promise<Object[]> {
    const request = new Request('findCharacterMedia')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('search', search)
      .setRetries(0)
      .setTimeoutInterval(
        // 2 minutes
        120000
      )
    return this.loader
      .send(request)
      .then(
        (results: { [key: string]: any }) => (results && results['media']) || []
      )
      .catch((error) => this.onError(error))
  }

  /**
   * Add the media to a given character
   *
   * @param characterId the character id to add the media to
   * @param stateId the state id to add the media to
   * @param mediaIds the media ids to add
   */
  addCharacterMedia(
    characterId: number,
    stateId: number | null,
    mediaIds: number[]
  ): Promise<void> {
    const character = this.characters.getById(characterId)
    if (character == null) {
      return Promise.reject('Character not found')
    }

    const request = new Request('addCharacterMedia')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('state_id', stateId)
      .addParameter('media_ids', mediaIds)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const media = (results && results['media']) || []
        const characterMedia: CharacterMedia[] = []
        for (let x = 0; x < media.length; x++) {
          characterMedia.push(new CharacterMedia(media[x]))
        }
        character.addMedia(characterMedia)
        this.dispatchEvent(CharacterChangedEvents.create([characterId]))
      })
      .catch((error) => this.onError(error))
  }

  /**
   * Add the media to a given character
   *
   * @param characterId the character id to add the media to
   * @param stateId the state id to add the media to
   * @param linkId the link id of the media
   * @param mediaId the media id of the media
   */
  moveCharacterMedia(
    characterId: number,
    stateId: number | null,
    linkId: number,
    mediaId: number
  ): Promise<number> {
    const character = this.characters.getById(characterId)
    if (character == null) {
      return Promise.reject('Character not found')
    }

    const request = new Request('moveCharacterMedia')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('state_id', stateId)
      .addParameter('link_id', linkId)
      .addParameter('media_id', mediaId)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const media = character.getMediaByIds([mediaId])
        for (let x = 0; x < media.length; x++) {
          const medium = media[x]
          medium.setStateId(stateId)
        }

        // The character media are removed and added so that moved media are added to the end.
        character.removeMedia([mediaId])
        character.addMedia(media)
        this.dispatchEvent(CharacterChangedEvents.create([characterId]))
        return results['old_state_id']
      })
      .catch((error) => this.onError(error))
  }

  /**
   * Remove a media from a character
   *
   * @param characterId the character id to remove the media from
   * @param linkId the link id for the character and media
   * @param mediaId the media id to remove from the character
   */
  removeCharacterMedia(
    characterId: number,
    linkId: number,
    mediaId: number
  ): Promise<void> {
    const character = this.characters.getById(characterId)
    if (character == null) {
      return Promise.reject('Character not found')
    }

    const request = new Request('removeCharacterMedia')
      .addParameter('id', this.matrixId)
      .addParameter('character_id', characterId)
      .addParameter('link_id', linkId)
      .addParameter('media_id', mediaId)
    return this.loader
      .send(request)
      .then(() => {
        character.removeMedia([mediaId])
        this.dispatchEvent(CharacterChangedEvents.create([characterId]))
      })
      .catch((error) => this.onError(error))
  }

  /**
   * @return The cell batch logs
   */
  getCellBatchLogs(): Promise<Object[]> {
    const request = new Request('getCellBatchLogs').addParameter(
      'id',
      this.matrixId
    )
    return this.loader
      .send(request)
      .then(
        (results: { [key: string]: any }) =>
          (results && results['batch_log']) || []
      )
      .catch((error) => this.onError(error))
  }

  /**
   * Copy cell sources from one taxon to another
   *
   * @param srcTaxonId the taxon id to use as the source
   * @param dstTaxonId the taxon id to use as the destination
   * @param characterIds the characters ids to modify
   * @param options the options for scoring
   */
  copyCellScores(
    srcTaxonId: number,
    dstTaxonId: number,
    characterIds: number[],
    options: { [key: string]: any }
  ): Promise<void> {
    const request = new Request('copyCellScores')
      .addParameter('id', this.matrixId)
      .addParameter('src_taxon_id', srcTaxonId)
      .addParameter('dst_taxon_id', dstTaxonId)
      .addParameter('character_ids', characterIds)
      .addParameter('options', options)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const cells = (results && results['cells']) || []
        this.cells.clearAndAddCellStates(cells)
        const cellNotes = (results && results['cell_notes']) || []
        this.cells.initCellNotes(cellNotes)
        const taxaIdsSet = new Set([dstTaxonId])
        const characterIdsSet = new Set(characterIds)
        for (let x = 0; x < cells.length; x++) {
          const cell = cells[x]
          taxaIdsSet.add(cell['tid'])
          characterIdsSet.add(cell['cid'])
        }
        const changedTaxaIds = Array.from(taxaIdsSet.keys())
        const changedCharacterIds = Array.from(characterIdsSet.keys())
        this.dispatchEvent(
          CellsChangedEvents.create(changedTaxaIds, changedCharacterIds)
        )
      })
      .catch((error) => this.onError(error))
  }

  /**
   * Undo a batch operation
   *
   * @param batchId the taxon id to use as the source
   */
  undoCellBatch(batchId: number): Promise<void> {
    const request = new Request('undoCellBatch')
      .addParameter('id', this.matrixId)
      .addParameter('log_id', batchId)
    return this.loader
      .send(request)
      .then((results: { [key: string]: any }) => {
        const taxaIdsSet: Set<number> = new Set()
        const characterIdsSet: Set<number> = new Set()

        // Remove cached citations
        const modifiedCitations = [].concat(
          results['updated_citations'] || [],
          results['added_citations'] || [],
          results['deleted_citations'] || []
        )
        for (let x = 0; x < modifiedCitations.length; x++) {
          const citation = modifiedCitations[x]
          const taxonId = citation['taxon_id']
          const characterId = citation['character_id']
          const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
          cellInfo.clearCitations()
        }

        // remove deleted media
        const deletedMedia = results['deleted_media'] || []
        for (let x = 0; x < deletedMedia.length; x++) {
          const deletedMedium = deletedMedia[x]
          const taxonId = deletedMedium['taxon_id']
          const characterId = deletedMedium['character_id']
          const mediaId = deletedMedium['media_id']
          const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
          cellInfo.removeMedia([mediaId])
          taxaIdsSet.add(taxonId)
          characterIdsSet.add(characterId)
        }

        // insert added media
        const addedMedia = results['added_media'] || []
        for (let x = 0; x < addedMedia.length; x++) {
          const medium = addedMedia[x]
          const cellMedia = new CellMedia(medium)
          const cellInfo = this.cells.mayCreateCellInfo(
            cellMedia.getTaxonId(),
            cellMedia.getCharacterId()
          )
          cellInfo.addMedia([cellMedia])
          taxaIdsSet.add(cellMedia.getTaxonId())
          characterIdsSet.add(cellMedia.getCharacterId())
        }

        // cell notes and status
        const notes = results['updated_cell_notes'] || []
        for (let x = 0; x < notes.length; x++) {
          const note = notes[x]
          const taxonId = note['taxon_id']
          const characterId = note['character_id']
          const status = note['status']
          const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
          cellInfo.setNotes(note['notes'])
          cellInfo.setStatus(status)
          taxaIdsSet.add(taxonId)
          characterIdsSet.add(characterId)
        }

        // delete scores
        const deletedScores = results['deleted_scores'] || []
        for (let x = 0; x < deletedScores.length; x++) {
          const deletedScore = deletedScores[x]
          const taxonId = deletedScore['taxon_id']
          const characterId = deletedScore['character_id']

          // The cell state defaults to 0 if a null value was given.
          const stateId = deletedScore['state_id'] || 0
          const cellStates = this.cells.getCell(taxonId, characterId)
          for (let y = 0; y < cellStates.length; y++) {
            const cellState = cellStates[y]
            if (cellState.getStateId() === stateId) {
              mb.remove(cellStates, cellState)
              break
            }
          }
          taxaIdsSet.add(taxonId)
          characterIdsSet.add(characterId)
        }

        // add scores
        const addedScores = results['added_scores'] || []
        nextAddedScore: for (let x = 0; x < addedScores.length; x++) {
          const addedScore = addedScores[x]
          const taxonId = addedScore['taxon_id']
          const characterId = addedScore['character_id']
          const stateId = addedScore['state_id']
          const cellStates = this.cells.mayCreateCell(taxonId, characterId)
          for (let y = 0; y < cellStates.length; y++) {
            const cellState = cellStates[y]
            if (cellState.getStateId() === stateId) {
              continue nextAddedScore
            }
          }
          const newCellState = new CellStates({
            uid: addedScore['user_id'],
            npa: addedScore['is_npa'],
            uct: addedScore['is_uncertain'],
            tid: taxonId,
            cid: characterId,
            sid: stateId,
            sv: addedScore['start_value'],
            ev: addedScore['end_value'],
          })
          cellStates.push(newCellState)
          taxaIdsSet.add(taxonId)
          characterIdsSet.add(characterId)
        }
        const taxaIds: number[] = Array.from(taxaIdsSet.keys())
        const characterIds: number[] = Array.from(characterIdsSet.keys())
        this.dispatchEvent(CellsChangedEvents.create(taxaIds, characterIds))
      })
      .catch((error) => this.onError(error))
  }

  /**
   * Searches the current model for characters
   *
   */
  searchCharacters(options: mb.SearchOptions): Promise<mb.SearchResults[]> {
    const userPreferences = this.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const results = [] as mb.SearchResults[]
    const text = options.text ? options.text.toLowerCase() : null
    options = options || {}

    // searches we can't do locally if this matrix is streaming
    if (
      this.isStreaming() &&
      (options.limitToUnscoredCells ||
        options.limitToNPACells ||
        options.limitToUnusedMedia)
    ) {
      const request = new Request('searchCharacters')
        .addParameter('id', this.matrixId)
        .addParameter('partition_id', this.currentPartitionId || 0)
        .addParameter(
          'limitToUnscoredCells',
          options.limitToUnscoredCells ? 1 : 0
        )
        .addParameter('limitToUnusedMedia', options.limitToUnusedMedia ? 1 : 0)
        .addParameter('limitToNPACells', options.limitToNPACells ? 1 : 0)
      return this.loader
        .send(request)
        .then((searchObj: { [key: string]: any }) => {
          const searchResults = searchObj['results']
          const characters = this.getCharacters()
          for (let x = 0; x < searchResults.length; x++) {
            const searchResult = searchResults[x]
            const characterId = searchResult['character_id']
            const extraInfo = searchResult['media_list'] || ''
            const character = characters.getById(characterId)
            if (character) {
              const result = {
                label:
                  '[' +
                  (character.getNumber() - numberingMode) +
                  '] ' +
                  character.getName() +
                  extraInfo,
                id: characterId,
              } as mb.SearchResults
              results.push(result)
            }
          }
          return results
        })
    }

    let extraInfo = ''
    const characters = this.getPartitionCharacters()
    for (let x = 0; x < characters.length; x++) {
      const character = characters[x]
      if (
        text &&
        character.getName().toLowerCase().indexOf(text) < 0 &&
        character.getDescription().toLowerCase().indexOf(text) < 0 &&
        character
          .getStates()
          .every(
            (state) => state.getName().toLocaleLowerCase().indexOf(text) < 0
          )
      ) {
        continue
      }
      if (
        options.limitToUnreadComments &&
        character.getUnreadCommentCount() === 0
      ) {
        continue
      }
      if (
        options.limitWithWarnings &&
        character.getLastScoredOn() > character.getLastChangedOn()
      ) {
        continue
      }
      const characterId = character.getId()
      if (options.limitToUnscoredCells || options.limitToNPACells) {
        const taxa = this.getPartitionTaxa()
        let y = 0
        for (y = 0; y < taxa.length; y++) {
          const taxon = taxa[y]
          const taxonId = taxon.getId()
          const cells = this.cells.getCell(taxonId, characterId)
          if (
            options.limitToNPACells &&
            cells.length === 1 &&
            cells[0].getStateId() === 0 &&
            cells[0].isNPA()
          ) {
            break
          } else {
            if (options.limitToUnscoredCells && cells.length === 0) {
              break
            }
          }
        }

        // not found
        if (y === taxa.length) {
          continue
        }
      }
      if (options.limitToUnusedMedia) {
        const media = character.getMedia()
        if (media.length === 0) {
          continue
        }
        const characterMediaIds: number[] = []
        for (let y = 0; y < media.length; y++) {
          const medium = media[y]
          characterMediaIds.push(medium.getMediaId())
        }
        const taxa = this.getPartitionTaxa()
        for (let y = 0; y < taxa.length; y++) {
          const taxon = taxa[y]
          const taxonId = taxon.getId()
          const cellInfo = this.cells.mayCreateCellInfo(taxonId, characterId)
          const cellMedia = cellInfo.getMedia()
          for (let z = 0; z < cellMedia.length; z++) {
            const cellMedium = cellMedia[z]
            mb.remove(characterMediaIds, cellMedium.getMediaId())
          }
        }
        if (characterMediaIds.length === 0) {
          continue
        }
        extraInfo = '; M' + characterMediaIds.join('; M')
      }
      const result = {
        label:
          '[' +
          (character.getNumber() - numberingMode) +
          '] ' +
          character.getName() +
          extraInfo,
        id: characterId,
      } as mb.SearchResults
      results.push(result)
    }
    return Promise.resolve(results)
  }

  /**
   * Searches the current model for taxa
   *
   */
  searchTaxa(options: mb.SearchOptions): Promise<mb.SearchResults[]> {
    const userPreferences = this.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const results = [] as mb.SearchResults[]
    options = options || {}

    // searches we can't do locally if this matrix is streaming
    if (
      this.isStreaming() &&
      (options.limitToUnscoredCells || options.limitToNPACells)
    ) {
      const request = new Request('searchTaxa')
        .addParameter('id', this.matrixId)
        .addParameter('partition_id', this.currentPartitionId || 0)
        .addParameter(
          'limitToUnscoredCells',
          options.limitToUnscoredCells ? 1 : 0
        )
        .addParameter('limitToNPACells', options.limitToNPACells ? 1 : 0)
      return this.loader
        .send(request)
        .then((searchObj: { [key: string]: any }) => {
          const searchResults = searchObj['results']
          const taxa = this.getTaxa()
          for (let x = 0; x < searchResults.length; x++) {
            const searchResult = searchResults[x]
            const taxonId = searchResult['taxon_id']
            const taxon = taxa.getById(taxonId)
            if (taxon) {
              const result = {
                label:
                  '[' +
                  (taxon.getNumber() - numberingMode) +
                  '] ' +
                  taxon.getDisplayName(),
                id: taxonId,
              } as mb.SearchResults
              results.push(result)
            }
          }
          return results
        })
    }
    const taxa = this.getPartitionTaxa()
    const text = options.text ? options.text.toLowerCase() : null
    for (let x = 0; x < taxa.length; x++) {
      const taxon = taxa[x]
      const taxonId = taxon.getId()
      const taxonNotes = taxon.getNotes().toLowerCase()
      const taxonName = taxon.getName().toLowerCase()
      if (text && taxonName.indexOf(text) < 0 && taxonNotes.indexOf(text) < 0) {
        continue
      }
      if (options.limitToUnscoredCells || options.limitToNPACells) {
        const characters = this.getPartitionCharacters()
        let y
        for (y = 0; y < characters.length; y++) {
          const character = characters[y]
          const characterId = character.getId()
          const cells = this.cells.getCell(taxonId, characterId)
          if (
            options.limitToNPACells &&
            cells.length === 1 &&
            cells[0].getStateId() === 0 &&
            cells[0].isNPA()
          ) {
            break
          } else {
            if (options.limitToUnscoredCells && cells.length === 0) {
              break
            }
          }
        }

        // not found
        if (y === characters.length) {
          continue
        }
      }
      const result = {
        label:
          '[' +
          (taxon.getNumber() - numberingMode) +
          '] ' +
          taxon.getDisplayName(),
        id: taxonId,
      } as mb.SearchResults
      results.push(result)
    }
    return Promise.resolve(results)
  }

  /**
   * Searches the current model for cells
   *
   */
  searchCells(options: mb.SearchOptions): Promise<mb.SearchResults[]> {
    const userPreferences = this.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const results = [] as mb.SearchResults[]

    // Searching through the cells locally cannot be done if streaming is enabled, therefore we send a request to the
    // server in order to search directly from the database.
    if (this.isStreaming()) {
      const request = new Request('searchCells')
        .addParameter('id', this.matrixId)
        .addParameter('partition_id', this.currentPartitionId || 0)
        .addParameter('limitToTaxon', options.limitToTaxon || 0)
        .addParameter(
          'limitToUndocumentedCells',
          options.limitToUndocumentedCells ? 1 : 0
        )
        .addParameter(
          'limitToUnscoredCells',
          options.limitToUnscoredCells ? 1 : 0
        )
        .addParameter(
          'limitToUnimagedCells',
          options.limitToUnimagedCells ? 1 : 0
        )
        .addParameter('limitToNPACells', options.limitToNPACells ? 1 : 0)
        .addParameter(
          'limitToPolymorphicCells',
          options.limitToPolymorphicCells ? 1 : 0
        )
        .setRetries(1)
        .setTimeoutInterval(
          /* 5 minutes */
          300000
        )
      return this.loader
        .send(request)
        .then((searchObj: { [key: string]: any }) => {
          const searchResults = searchObj['results']
          const characters = this.getCharacters()
          const taxa = this.getTaxa()
          for (let x = 0; x < searchResults.length; x++) {
            const searchResult = searchResults[x]
            const characterId = searchResult['character_id']
            const taxonId = searchResult['taxon_id']
            const character = characters.getById(characterId)
            const taxon = taxa.getById(taxonId)
            if (character && taxon) {
              const result = {
                label:
                  '[' +
                  (character.getNumber() - numberingMode) +
                  '] ' +
                  character.getName() +
                  '; [' +
                  (taxon.getNumber() - numberingMode) +
                  '] ' +
                  taxon.getDisplayName(),
                id: characterId,
                otherId: taxonId,
              } as mb.SearchResults
              results.push(result)
            }
          }
          return results
        })
    }
    const characters = this.getPartitionCharacters()
    const taxa = options.limitToTaxon
      ? [this.taxa.getById(options.limitToTaxon)]
      : this.getPartitionTaxa()
    options = options || {}
    for (let x = 0; x < characters.length; x++) {
      const character = characters[x]
      const characterId = character.getId()
      for (let y = 0; y < taxa.length; y++) {
        const taxon = taxa[y]
        if (taxon == null) {
          continue
        }
        const taxonId = taxon.getId()
        const cellInfo = this.cells.getCellInfo(taxonId, characterId)
        if (options.limitToUnimagedCells && cellInfo.getMedia().length !== 0) {
          continue
        }
        if (
          options.limitToUndocumentedCells &&
          (cellInfo.getNotes() !== '' || cellInfo.getCitationCount() !== 0)
        ) {
          continue
        }
        if (
          options.limitToUnscoredCells ||
          options.limitToNPACells ||
          options.limitToScoredCells ||
          options.limitToPolymorphicCells
        ) {
          const cells = this.cells.getCell(taxonId, characterId)
          if (
            options.limitToNPACells &&
            (cells.length === 0 || !cells[0].isNPA())
          ) {
            continue
          } else {
            if (options.limitToUnscoredCells && cells.length !== 0) {
              continue
            } else {
              if (
                options.limitToScoredCells &&
                (cells.length === 0 || cells[0].getStateId() === 0)
              ) {
                continue
              } else {
                if (
                  options.limitToPolymorphicCells &&
                  (cells.length < 2 ||
                    !cells.some((cell) => cell.getStateId() === 0))
                ) {
                  continue
                }
              }
            }
          }
        }
        const result = {
          label:
            '[' +
            (character.getNumber() - numberingMode) +
            '] ' +
            character.getName() +
            '; [' +
            (taxon.getNumber() - numberingMode) +
            '] ' +
            taxon.getDisplayName(),
          id: characterId,
          otherId: taxonId,
        } as mb.SearchResults
        results.push(result)
      }
    }
    return Promise.resolve(results)
  }

  /**
   * Sets the user preferences and matrix options
   *
   */
  setUserPreference(): Promise<void> {
    const serializedMatrixOptions = this.getMatrixOptions().serialize()
    const serializedUserPreference = this.getUserPreferences().serialize()
    const request = new Request('setPreferences')
      .addParameter('id', this.matrixId)
      .addParameter('options', serializedMatrixOptions)
      .addParameter('preferences', serializedUserPreference)
    return this.loader
      .send(request)
      .then(() => {
        this.dispatchEvent(CharacterChangedEvents.create())
        this.dispatchEvent(TaxaChangedEvents.create())
      })
      .catch((error) => this.onError(error))
  }

  /**
   * Determine whether the cells are loaded in the matrix. This returns an array of taxa ids and character ids which
   * signifies the cells that should be loaded. Otherwise, it returns null which signify that all the cells are loaded.
   *
   * @param taxaIds the id of the taxa to check
   * @param characterIds the id of the characters to check
   * @return an array of taxa ids and character ids or null.
   */
  checkCellsLoaded(
    taxaIds: number[],
    characterIds: number[]
  ): number[][] | null {
    if (!this.isStreaming()) {
      return null
    }

    const taxaNotLoaded: Set<number> = new Set()
    const charactersNotLoaded: Set<number> = new Set()
    for (let x = 0; x < taxaIds.length; x++) {
      const taxonId = taxaIds[x]
      for (let y = 0; y < characterIds.length; y++) {
        const characterId = characterIds[y]
        if (!this.cells.checkCellLoaded(taxonId, characterId)) {
          taxaNotLoaded.add(taxonId)
          charactersNotLoaded.add(characterId)
        }
      }
    }
    if (taxaNotLoaded.size === 0) {
      return null
    }
    const taxaIdsNotLoaded = Array.from(taxaNotLoaded.keys())
    const characterIdsNotLoaded = Array.from(charactersNotLoaded.keys())
    return [taxaIdsNotLoaded, characterIdsNotLoaded]
  }

  /**
   * Determine whether the cells are loaded in the matrix.
   *
   * @param taxaIds the id of the taxa to check
   * @param characterIds the id of the characters to check
   */
  fetchCellsData(taxaIds: number[], characterIds: number[]): Promise<void> {
    const request = new Request('fetchCellsData')
      .addParameter('id', this.matrixId)
      .addParameter('taxa_ids', taxaIds)
      .addParameter('character_ids', characterIds)
    for (let x = 0; x < taxaIds.length; x++) {
      const taxonId = taxaIds[x]
      for (let y = 0; y < characterIds.length; y++) {
        this.cells.setCellAsLoaded(taxonId, characterIds[y])
      }
    }
    return this.loader
      .send(request)
      .then((data: { [key: string]: any }) => {
        this.cells.clearAndAddCellStates(data['cells'])
        this.cells.initCellMedia(data['media'])
        this.cells.initCellNotes(data['notes'])
        this.cells.initCellCounts(data['counts'])

        // Cells were changed by a systematic update to fetch the latest changes. This should not trigger a sync but
        // instead should re-invalidate all UI and caches.
        this.dispatchEvent(
          CellsChangedEvents.create(taxaIds, characterIds, true)
        )
      })
      .catch((error) => this.onError(error))
  }

  /**
   * Returns a cell(s) assigned to the taxon and character.
   * @param taxonId the id of the taxon
   * @param characterId the id of the character
   * @return cell info
   */
  getCell(taxonId: number, characterId: number): CellObject {
    const cells = this.cells.getCell(taxonId, characterId)
    const cellInfo = this.cells.getCellInfo(taxonId, characterId)
    const character = this.characters.getById(characterId)
    const cellsInfo: CellObject = {
      character_id: characterId,
      taxon_id: taxonId,
      notes: cellInfo.getNotes(),
      status: cellInfo.getStatus(),
      last_update_time: cellInfo.getLastUpdateTime(),
      citation_count: cellInfo.getCitationCount(),
      comment_count: cellInfo.getCommentCount(),
      unread_comment_count: cellInfo.getUnreadCommentCount(),
      media: cellInfo.getMedia(),
      readonly: this.readonly,
      states: [],
    }

    if (cells.length === 0 || character == null) {
      cellsInfo.states = [
        { state_number: '?', state_name: '?', state_id: null },
      ]
      return cellsInfo
    }
    const states = cellsInfo.states as any
    for (let x = 0; x < cells.length; x++) {
      const cell = cells[x]
      const type = character.getType()
      if (
        type === CharacterType.CONTINUOUS ||
        type === CharacterType.MERISTIC
      ) {
        states.push({
          start_value: cell.getNumericStartValue(),
          end_value: cell.getNumericEndValue(),
        })
        continue
      }
      const state_id = cell.getStateId()
      if (state_id === 0) {
        if (cell.isNPA()) {
          states.push({
            state_number: 'NPA',
            state_name: 'NPA',
            state_id: null,
          })
        } else {
          states.push({ state_number: '-', state_name: '-', state_id: null })
        }
        continue
      }
      const characterState = character.getCharacterStateById(state_id)
      if (characterState == null) {
        continue
      }
      states.push({
        state_number: characterState.getNumber(),
        state_name: characterState.getName(),
        state_id: state_id,
      })
    }
    if (states.length > 1) {
      states.sort(function (a: any, b: any) {
        const a_state_number = a.state_number === '-' ? -1 : a.state_number
        const b_state_number = b.state_number === '-' ? -1 : b.state_number
        return a_state_number - b_state_number
      })
      cellsInfo.is_uncertain = cells[0].isUncertain()
    }

    return cellsInfo
  }

  /**
   * Send events to server.
   *
   * @param event The event to send to the server.
   */
  sendEvent(event: { [key: string]: any }): Promise<void | Object> {
    if (!this.clientId) {
      return Promise.resolve()
    }
    const request = new Request('sendEvent')
      .addParameter('id', this.matrixId)
      .addParameter('client_id', this.clientId)
      .addParameter('event', event)
    return this.loader.send(request).catch((error) => this.onError(error))
  }

  /**
   * Sets the character rules within the matrix.
   */
  setCharacterRules(ruleObjs: Object[]) {
    this.characterRules.setRules(ruleObjs)
  }

  /**
   * Gets the character rules within the matrix.
   * @return the character rules
   */
  getCharacterRules(): CharacterRules {
    return this.characterRules
  }

  /**
   * Sets the partitions in the matrix.
   */
  setPartitions(partitionObjs: Object[]) {
    this.partitions.setPartitions(partitionObjs)
  }

  /**
   * Gets the partitions in the matrix.
   * @return the character rules
   */
  getPartitions(): Partitions {
    return this.partitions
  }

  /**
   * Send an error to the server but do not throw an error.
   * @param e The error message to send to the server.
   */
  sendError(e: string) {
    const request = new Request('logError')
      .addParameter('id', this.matrixId)
      .addParameter('e', e)
    this.loader.send(request).catch(this.onError)
    console.log('Error', e)
    throw e
  }

  /**
   * Present an alert to the user that a server-side error occurred.
   * @param e The error message to send to the server.
   */
  private onError(e: any) {
    console.log('Error from server', e)
    throw e
  }
}

type CellDiscreteStatesObject = {
  state_name?: string
  state_number?: string
  state_id?: number
  start_value?: number
  end_value?: number
}

export type CellObject = {
  character_id: number
  taxon_id: number
  notes: string | null
  status: 0 | 50 | 100
  last_update_time: number
  citation_count: number
  comment_count: number
  unread_comment_count: number
  media: CellMedia[]
  readonly: boolean
  is_uncertain?: boolean
  states: CellDiscreteStatesObject[]
}
