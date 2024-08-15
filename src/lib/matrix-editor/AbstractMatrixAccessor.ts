import { MatrixAccessorContainer } from './ui/MatrixAccessorContainer'
import { MatrixModel } from './MatrixModel'
import { MatrixModelServerEventSyncer } from './MatrixModelServerEventSyncer'
import { MatrixLoader } from './MatrixLoader'
import { MessageBar } from './ui/MessageBar'
import { Request } from './MatrixLoader'
import { LoadingModal } from './ui/LoadingModal'

/**
 * This is an abstract class which is used to access the matrix data.
 */
export abstract class AbstractMatrixAccessor {
  protected matrixLoader: MatrixLoader
  protected matrixModel: MatrixModel
  protected matrixId: number
  protected matrixContainer: MatrixAccessorContainer
  protected loadingModal: LoadingModal
  protected matrixModelSyncer: MatrixModelServerEventSyncer

  /**
   * Starts the matrix editor
   * @param properties The properties used by this matrix.
   */
  constructor(
    projectId: number,
    matrixId: number,
    streaming: boolean,
    location: string,
    published: boolean = false
  ) {
    this.matrixLoader = new MatrixLoader(projectId, location)
    this.matrixLoader.setMatrixId(matrixId, published)

    this.matrixModel = new MatrixModel(matrixId, this.matrixLoader)
    this.matrixModel.setStreaming(streaming)
    this.matrixId = matrixId

    this.loadingModal = new LoadingModal()
    this.loadingModal.render()
    this.matrixModelSyncer = new MatrixModelServerEventSyncer(
      this.matrixModel,
      projectId,
      location
    )
  }

  /** Starts the loading sequence. */
  public abstract start(): void

  /**
   * Loads the matrix data.
   * @param callback The function to invoke when complete
   */
  protected abstract loadMatrixData(callback: () => any): void

  /** Loads to cells. */
  protected loadCells() {
    const request = new Request('getCellData')
      .addParameter('id', this.matrixId)
      .setTimeoutInterval(0)
    this.matrixLoader
      .send(request)
      .then((data: { [key: string]: any }) => {
        this.matrixModel.initCellStates(data['cells'])
        this.matrixContainer.refreshCells()
        this.loadingModal.loadedCells()
      })
      .catch((e) => this.setError(e))
  }

  /**
   * Sets the cell media. This is done after loading cell notes.
   */
  protected loadCellMedia() {
    const request = new Request('getCellMedia').addParameter(
      'id',
      this.matrixId
    )
    this.matrixLoader
      .send(request)
      .then((data: { [key: string]: any }) => {
        this.matrixModel.initCellMedia(data['media'])
        this.matrixContainer.refreshCells()
        this.loadingModal.loadedMedia()
      })
      .catch((e) => this.setError(e))
  }

  /**
   * Loads the cell counts.
   */
  protected loadCellCounts() {
    const characters = this.matrixModel.getCharacters()
    const taxa = this.matrixModel.getTaxa()
    const request = new Request('getCellCounts')
      .addParameter('id', this.matrixId)
      .addParameter('start_character_num', 0)
      .addParameter('end_character_num', characters.size())
      .addParameter('start_taxon_num', 0)
      .addParameter('end_taxon_num', taxa.size())
    this.matrixLoader
      .send(request)
      .then((data: { [key: string]: any }) => {
        this.matrixModel.initCellCounts(data['counts'])
        this.matrixContainer.refreshCells()
      })
      .catch((e) => this.setJavaScriptError(e))
  }

  /**
   * Load the cell notes.
   */
  protected loadCellNotes() {
    const request = new Request('getAllCellNotes').addParameter(
      'id',
      this.matrixId
    )
    this.matrixLoader
      .send(request)
      .then((data: { [key: string]: any }) => {
        this.matrixModel.initCellNotes(data['notes'])
        this.matrixContainer.refreshCells()
        this.loadingModal.loadedNotes()
        this.matrixModelSyncer.start()
      })
      .catch((e) => this.setJavaScriptError(e))
  }

  /**
   * An error has occurred while loading data
   * @param errors The list of errors
   */
  protected setError(error: Error) {
    if (!this.matrixLoader.getIsAborted()) {
      this.matrixLoader.abort()
      this.loadingModal.close()

      const messageBar = new MessageBar(
        'Failed to load Matrix: ' + error.message || 'Unknown error'
      )
      messageBar.render()
    }
  }

  /**
   * An error has occurred while loading data
   * @param errors The list of errors
   */
  protected setJavaScriptError(error: Error) {
    this.setError(error)

    const errorString = JSON.stringify(error, ['message'])
    this.matrixModel.sendError(errorString)
  }
}
