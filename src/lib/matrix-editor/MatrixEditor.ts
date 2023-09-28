import { AbstractMatrixAccessor } from './AbstractMatrixAccessor'
import { MatrixIndexDb } from './MatrixIndexDb'
import { MatrixViewStateLoader } from './MatrixViewStateLoader'
import { Request } from './MatrixLoader'
import { MatrixEditorContainer } from './ui/MatrixEditorContainer'
import * as LastViewStatePreferenceChangedEvents from './events/LastViewStatePreferenceChangedEvent'

/**
 * Starts the matrix editor
 * @param properties The properties used by this matrix.
 */
export class MatrixEditor extends AbstractMatrixAccessor {
  private matrixViewStateLoader: MatrixViewStateLoader | null

  constructor(projectId: number, matrixId: number, streaming: boolean, location: string) {
    super(projectId, matrixId, streaming, location)
  }

  override start() {
    this.loadMatrixData(() => {
      if (this.matrixModel.isStreaming()) {
        // we will load these sparingly
        this.loadingModal.loadedCells()
        this.loadingModal.loadedNotes()
        this.loadingModal.loadedMedia()
      } else {
        this.loadCells()
        this.loadCellNotes()
        this.loadCellMedia()
      }

      // Always load the counts. The current database model makes it extremely
      // difficult to stream the cell counts for comments so therefore we'll
      // load them upfront. Given that most matrices do not have a large amount
      // of citations or comments, this should not put a strain on our database.
      this.loadCellCounts()
    })
  }

  override loadMatrixData(callback: () => void) {
    const request = new Request('getMatrixData').addParameter(
      'id',
      this.matrixId
    )
    this.matrixLoader
      .send(request)
      .then((data: { [key: string]: any }) => {
        // Set information needed to draw the matrix grid
        this.matrixModel.setCharacters(data['characters'])
        this.matrixModel.setCharacterRules(data['character_rules'])
        this.matrixModel.setTaxa(data['taxa'])
        this.matrixModel.setMatrix(data['matrix'])
        this.matrixModel.setMatrixOptions(data['matrix_options'])
        this.matrixModel.setProjectProperties(data['user'])

        const appElement = document.getElementById('app')
        this.matrixContainer = new MatrixEditorContainer(this.matrixModel)
        this.matrixContainer.render(appElement)
        this.matrixContainer.redraw()

        this.loadingModal.loadedCharactersAndTaxa()
        if (MatrixIndexDb.isSupported()) {
          window.addEventListener(
            LastViewStatePreferenceChangedEvents.TYPE,
            () => this.setupViewStateLoader()
          )
          this.setupViewStateLoader()
        }
        this.matrixModel.setPartitions(data['partitions'])
        callback()
      })
      .catch((e) => this.setJavaScriptError(e))
  }

  /**
   * Enable or disable the view state loader.
   * @param e The event that triggerd this callback.
   */
  setupViewStateLoader(e?: Event | null) {
    const userPreferences = this.matrixModel.getUserPreferences()
    const enableLoadSavedViewState =
      userPreferences.getEnableLoadSavedViewState()
    if (enableLoadSavedViewState && !this.matrixViewStateLoader) {
      this.matrixViewStateLoader = new MatrixViewStateLoader(
        this.matrixContainer,
        this.matrixModel
      )
      this.matrixViewStateLoader.start().then((started) => {
        if (started && e) {
          this.matrixContainer.dispatchEvent(e)
        }
      })
    } else {
      if (this.matrixViewStateLoader) {
        this.matrixViewStateLoader.remove()
        this.matrixViewStateLoader = null
      }
    }
  }
}
