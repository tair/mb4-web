import { AbstractMatrixAccessor } from './AbstractMatrixAccessor'
import { Request } from './MatrixLoader'
import { UserPreferences } from './data/ProjectProperties'
import { MatrixViewerContainer } from './ui/MatrixViewerContainer'
import * as mb from './mb'

/**
 * Starts the matrix viewer
 * @param properties The properties used by this matrix.
 */
export class MatrixViewer extends AbstractMatrixAccessor {
  constructor(
    projectId: number,
    matrixId: number,
    streaming: boolean,
    location: string,
    published: boolean = false
  ) {
    super(projectId, matrixId, streaming, location, published)
    this.matrixModel.setReadonly(true)
  }

  override start() {
    this.loadMatrixData(() => {
      // The streaming is enabled, we will set the cells, notes, and media as
      // loaded since they are loaded on-demand.
      if (this.matrixModel.isStreaming()) {
        this.loadingModal.loadedCells()
        this.loadingModal.loadedNotes()
        this.loadingModal.loadedMedia()
      } else {
        this.loadCells()
        this.loadCellNotes()
        this.loadCellMedia()
        this.loadCellCounts()
      }
    })
  }

  protected override loadMatrixData(callback: () => any) {
    const request = new Request('getMatrixData').addParameter(
      'id',
      this.matrixId
    )
    this.matrixLoader
      .send(request)
      .then((data: { [key: string]: any }) => {
        // set characters in matrix
        this.matrixModel.setCharacters(data['characters'])

        // sets the character rules
        this.matrixModel.setCharacterRules(data['character_rules'])

        // set taxa in matrix
        this.matrixModel.setTaxa(data['taxa'])

        // set matrix options
        this.matrixModel.setMatrixOptions(data['matrix_options'])

        // set user info from server
        this.matrixModel.setProjectProperties(data['user'])

        // Set User preferences from local storage
        const localStorage = mb.isLocalStorageAvailable()
          ? window.localStorage
          : window.sessionStorage
        const userPreferenceJson = localStorage.getItem(
          'matrix_user_preferences_' + this.matrixModel.getId()
        )
        const userPreferenceObj = userPreferenceJson
          ? JSON.parse(userPreferenceJson)
          : ({} as Object)
        const userPreferences = new UserPreferences(userPreferenceObj)
        this.matrixModel
          .getProjectProperties()
          .setUserPreferences(userPreferences)

        const appElement = document.getElementById('app')
        this.matrixContainer = new MatrixViewerContainer(this.matrixModel)
        this.matrixContainer.render(appElement)
        this.matrixContainer.redraw()

        this.loadingModal.loadedCharactersAndTaxa()
        callback()
      })
      .catch((e) => this.setJavaScriptError(e))
  }
}
