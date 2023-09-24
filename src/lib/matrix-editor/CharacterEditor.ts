import { MatrixModel } from './MatrixModel'
import { MatrixLoader } from './MatrixLoader'
import { Matrix } from './data/Matrices'
import { CharacterEditorContainer } from './ui/CharacterEditorContainer'
import { MessageBar } from './ui/MessageBar'
import { Request } from './MatrixLoader'

export class CharacterEditor {
  private readonly matrixId: number
  private readonly matrixLoader: MatrixLoader

  /**
   * Starts the character editor.
   */
  constructor(properties: { [key: string]: string }) {
    const projectId = parseInt(properties['p'], 10)
    const matrixId = parseInt(properties['m'], 10)
    const location = properties['l']

    this.matrixId = matrixId

    this.matrixLoader = new MatrixLoader(projectId, location)
    this.matrixLoader.setMatrixId(matrixId)
  }

  /**
   * Loads the character data.
   */
  loadCharacterData() {
    const messageBar = new MessageBar('Loading...')
    messageBar.render()

    const request = new Request('getCharacterData').addParameter(
      'id',
      this.matrixId
    )
    this.matrixLoader
      .send(request)
      .then((data) => this.setCharacterData(data))
      .catch((error) => this.setError(error))
      .finally(() => messageBar.hide())
  }

  /**
   * Sets the character data
   * @param data the JSON from the server.
   */
  setCharacterData(data: { [key: string]: any }) {
    const matrixModel = new MatrixModel(this.matrixId, this.matrixLoader)
    matrixModel.setCharacters(data['characters'])
    matrixModel.setCharacterRules(data['character_rules'])
    matrixModel.setProjectProperties(data['user'])

    const matrixModels = new Map()
    matrixModels.set(this.matrixId, Promise.resolve(matrixModel))

    const matrices = Matrix.createMatrices(data['matrices'])
    const characterContainer = new CharacterEditorContainer(
      this.matrixId,
      matrices,
      matrixModels,
      this.matrixLoader
    )
    characterContainer.render()
  }

  /**
   * An error has occurred while loading data
   * @param errors The list of errors
   */
  setError(errors: any) {
    console.log(errors)
    const messageBar = new MessageBar('Failed to load Matrix: ' + errors)
    messageBar.render()
  }
}
