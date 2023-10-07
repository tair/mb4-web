import { Dropdown } from './Dropdown'
import { SavingLabel } from './SavingLabel'
import { Matrix } from '../data/Matrices'
import { MatrixLoader, Request } from '../MatrixLoader'
import {
  CharacterDetailedGridRenderer,
  CharacterMinimalGridRenderer,
} from './CharacterGridRenderer'
import { GoToCharacterEvent } from '../events/GoToCharacterEvent'
import * as GoToCharacterEvents from '../events/GoToCharacterEvent'
import { MatrixModel } from '../MatrixModel'
import { CharacterGrid } from './CharacterGrid'
import { Component, EventType } from './Component'
import { AddCharacterDialog } from './dialogs/AddCharacterDialog'
import { CharacterOrderingDialog } from './dialogs/CharacterOrderingDialog'
import { CharacterSearchDialog } from './dialogs/CharacterSearchDialog'
import { OntologyDialog } from './dialogs/OntologyDialog'
import * as mb from '../mb'

/**
 * The UI of the character editor, which includes anything that is visible to
 * the user.
 */
export class CharacterEditorContainer extends Component {
  /**
   * Rule checker button tooltip text
   */
  private static ONTOLOGY_TOOLTIP: string =
    'This button allows you to define rules relating one character to ' +
    'another (see MorphoBank manual for simple description). It is useful for characters that become ' +
    'inapplicable when one character is scored absent. Use of rules can help you catch human error in scoring.'

  private matrixId: number
  private matrices: Matrix[]
  private matrixModels: Map<number, Promise<MatrixModel>>
  private matrixLoader: MatrixLoader

  private matrixSelectComboBox: Dropdown
  private characterRenderersComboBox: Dropdown
  private savingLabel: SavingLabel
  private characterGrid: CharacterGrid

  /**
   * @param matrixId The current matrix
   * @param matrices The available matrices which we can switch to.
   * @param matrixModels The data associated with the matrix. This includes
   *     characters, taxon, and cells. Since this is only related to the charcter
   *     editor we only will use the characters.
   * @param matrixLoader The matrix loader
   */
  constructor(
    matrixId: number,
    matrices: Matrix[],
    matrixModels: Map<number, Promise<MatrixModel>>,
    matrixLoader: MatrixLoader
  ) {
    super()

    this.matrixId = matrixId
    this.matrices = matrices
    this.matrixModels = matrixModels
    this.matrixLoader = matrixLoader

    this.matrixSelectComboBox = new Dropdown()
    this.registerDisposable(this.matrixSelectComboBox)
    this.characterRenderersComboBox = new Dropdown()
    this.registerDisposable(this.characterRenderersComboBox)
    this.savingLabel = new SavingLabel()
    this.registerDisposable(this.savingLabel)
  }

  protected override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = CharacterEditorContainer.htmlContent()
    const dropdownElement = this.getElementByClass('mb-dropdown-bar')
    for (let x = 0; x < this.matrices.length; x++) {
      const matrix = this.matrices[x]
      this.matrixSelectComboBox.addItem({
        text: matrix.getTitle(),
        value: matrix.getId(),
      })
    }

    // Selects the current matrix
    const currentMatrix = this.getMatrix(this.matrixId)
    if (currentMatrix) {
      this.matrixSelectComboBox.setSelectedIndex(
        this.matrices.indexOf(currentMatrix)
      )
    }

    this.matrixSelectComboBox.render(dropdownElement)
    this.characterRenderersComboBox.addItem({
      text: 'Detailed View',
      value: '1',
    })
    this.characterRenderersComboBox.addItem({
      text: 'Minimal View',
      value: '2',
    })
    this.characterRenderersComboBox.render(dropdownElement)

    const topButtonBar = this.getElementByClass('topButtonBar')
    this.savingLabel.render(topButtonBar)

    const matrixPromise = this.matrixModels.get(this.matrixId)
    if (matrixPromise == null) {
      throw 'Failed to check matrix'
    }

    matrixPromise
      .then((matrixModel) => {
        this.characterGrid = new CharacterGrid(
          matrixModel,
          this.savingLabel,
          false
        )
        this.registerDisposable(this.characterGrid)
        const characterGridElement =
          this.getElementByClass<HTMLElement>('characterContainer')
        this.characterGrid.addScrollableContainer(characterGridElement)
        this.characterGrid.render(characterGridElement)
        this.onHandleResize()
        matrixModel.initMatrix(currentMatrix)
      })
      .catch((e) => this.error(e))
  }

  protected override enterDocument() {
    super.enterDocument()
    const searchElement = this.getElementByClass('mb-search-btn')
    const orderingsElement = this.getElementByClass('mb-orderings-btn')
    const ontologyElement = this.getElementByClass('mb-rules-btn')
    const addButton = this.getElementByClass('mb-add-btn')
    const deleteElement = this.getElementByClass('mb-delete-btn')
    this.getHandler()
      .listen(window, EventType.SCROLL, (e) => this.onHandleWindowScroll(e))
      .listen(
        window,
        GoToCharacterEvents.TYPE,
        (e: CustomEvent<GoToCharacterEvent>) => this.goCharacterIndex(e)
      )
      .listen(this.characterRenderersComboBox, EventType.CHANGE, (e: Event) =>
        this.onAfterMatrixLoad(
          (matrixModel) => this.onHandleViewModeChange(matrixModel),
          e
        )
      )
      .listen(this.matrixSelectComboBox, EventType.CHANGE, () =>
        this.onHandleMatrixChange()
      )
      .listen(addButton, EventType.CLICK, (e: Event) =>
        this.onAfterMatrixLoad(
          (matrixModel) => this.onHandleAddCharacterClick(matrixModel),
          e
        )
      )
      .listen(deleteElement, EventType.CLICK, (e: Event) =>
        this.onAfterMatrixLoad(
          (matrixModel) => this.onHandleDeleteCharacterClick(matrixModel),
          e
        )
      )
      .listen(ontologyElement, EventType.CLICK, (e: Event) =>
        this.onAfterMatrixLoad(
          (matrixModel) => this.onHandleOntologyClick(matrixModel),
          e
        )
      )
      .listen(orderingsElement, EventType.CLICK, (e: Event) =>
        this.onAfterMatrixLoad(
          (matrixModel) => this.onHandleOrderingClick(matrixModel),
          e
        )
      )
      .listen(searchElement, EventType.CLICK, (e: Event) =>
        this.onAfterMatrixLoad(
          (matrixModel) => this.onHandleSearchClick(matrixModel),
          e
        )
      )
      .listen(window, EventType.RESIZE, () => this.onHandleResize())
  }

  /**
   * Calls a function after the matrix is loaded.
   * @param func The callback to invoke
   * @param e The event that triggered this callback
   */
  private onAfterMatrixLoad(
    func: (p1: MatrixModel, p2: Event) => any,
    e: Event
  ) {
    const matrixPromise = this.matrixModels.get(this.matrixId)
    if (matrixPromise == null) {
      throw 'Failed to check matrix'
    }

    matrixPromise
      .then((matrixModel) => func(matrixModel, e))
      .catch((e) => this.error(e))
  }

  /**
   * Returns a promise of a matrix
   */
  private switchToMatrix(matrixId: number): Promise<MatrixModel> {
    let matrixModelPromise = this.matrixModels.get(matrixId)
    this.matrixLoader.setMatrixId(matrixId)
    if (!matrixModelPromise) {
      const matrix = this.getMatrix(matrixId)
      const request = new Request('getCharacterData')
      matrixModelPromise = this.matrixLoader
        .send(request)
        .then((data: { [key: string]: any }) => {
          const matrixModel = new MatrixModel(matrixId, this.matrixLoader)
          matrixModel.initMatrix(matrix)
          matrixModel.setCharacters(data['characters'])
          matrixModel.setCharacterRules(data['character_rules'])
          matrixModel.setProjectProperties(data['user'])
          return matrixModel
        })
        .catch((e) => {
          this.error(e)
          throw e
        })
      this.matrixModels.set(matrixId, matrixModelPromise)
    } else {
      matrixModelPromise.then((matrixModel) => {
        matrixModel.sync()
        return matrixModel
      })
    }
    matrixModelPromise.then((matrixModel) => {
      this.matrixId = matrixId
      this.setMatrixModel(matrixModel)
    })
    return matrixModelPromise
  }

  /**
   * Returns the matrix associated with the matrix id
   */
  private getMatrix(matrixId: number): Matrix {
    for (let x = 0; x < this.matrices.length; x++) {
      const matrix = this.matrices[x]
      if (matrix.getId() === matrixId) {
        return matrix
      }
    }
    throw 'Unable to find matrix'
  }

  /**
   * Sets the matrixModel of the character grid
   * @param matrixModel the model of the matrix
   */
  private setMatrixModel(matrixModel: MatrixModel) {
    this.characterGrid.setMatrixModel(matrixModel)
    this.redraw()
  }

  /**
   * Redraws the character grid.
   */
  private redraw() {
    this.characterGrid.redraw()
  }

  /**
   * Go to a particular character.
   * @param e event to go to a character
   */
  private goCharacterIndex(e: CustomEvent<GoToCharacterEvent>) {
    this.characterGrid.goToCharacter(e.detail.characterIndex)
  }

  /**
   * Handles events from resizing the window.
   */
  private onHandleResize() {
    const topButtonBar = this.getElementByClass<HTMLElement>('topButtonBar')
    const remainingHeight =
      document.documentElement.clientHeight - topButtonBar.offsetHeight
    const container = this.getElementByClass<HTMLElement>('characterContainer')
    mb.setElementStyle(container, 'height', remainingHeight + 'px')
  }

  /**
   * Handles when the users clicks the add character link.
   */
  private onHandleAddCharacterClick(matrixModel: MatrixModel) {
    const index = this.characterGrid.getSelectedIndex()
    const saveCallback = (name: string, index: number, charType: string) =>
      this.addCharacterToGrid(matrixModel, name, index, charType)
    const addCharacterDialog = new AddCharacterDialog(
      matrixModel,
      index,
      saveCallback
    )
    addCharacterDialog.setVisible(true)
  }

  /**
   * Handles when the users clicks the add character link.
   * @param matrixModel The matrix model to add the character to
   * @param name The name of the character to add
   * @param index The index to add the character to.
   * @param charType The type of character (e.g. continuous, discrete, meristic).
   */
  private addCharacterToGrid(
    matrixModel: MatrixModel,
    name: string,
    index: number,
    charType: string
  ) {
    this.savingLabel.saving()
    return matrixModel
      .addCharacter(name, index, charType)
      .then(() => {
        this.savingLabel.saved()
        this.characterGrid.setSelectedIndex(index)
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * Handles when the users clicks the delete character link.
   */
  private onHandleDeleteCharacterClick(matrixModel: MatrixModel) {
    this.characterGrid.deleteSelectedIndices()
  }

  /**
   * Handles when the ontology button is clicked.
   * @return whether the handler handled this event.
   */
  private onHandleOntologyClick(matrixModel: MatrixModel): boolean {
    const ontologyDialog = new OntologyDialog(matrixModel)
    ontologyDialog.setDisposeOnHide(true)
    ontologyDialog.setVisible(true)
    return true
  }

  /**
   * Handles when the ordering button is clicked.
   * @return whether the handler handled this event.
   */
  private onHandleOrderingClick(matrixModel: MatrixModel): boolean {
    const orderingDialog = new CharacterOrderingDialog(matrixModel)
    orderingDialog.setDisposeOnHide(true)
    orderingDialog.setVisible(true)
    return true
  }

  /**
   * Handles when the search button is clicked.
   * @return whether the handler handled this event.
   */
  private onHandleSearchClick(matrixModel: MatrixModel): boolean {
    const searchDialog = new CharacterSearchDialog(matrixModel)
    searchDialog.setDisposeOnHide(true)
    searchDialog.setVisible(true)
    return true
  }

  /**
   * Handles events from scrolling for the window. The window should never scroll since it will mess up the calculations
   * from the offsets and cause the elements to be misaligned. We reset the scroll coordinates.
   *
   * @param e The event that triggerd this callback.
   */
  private onHandleWindowScroll(e: Event) {
    e.stopPropagation()
    e.preventDefault()
    window.scrollTo(0, 0)
    return true
  }

  /**
   * Handles events from changing the view mode of the character grid
   */
  private onHandleViewModeChange(matrixModel: MatrixModel) {
    let characterRenderer
    switch (this.characterRenderersComboBox.getSelectedValue()) {
      case '1':
        characterRenderer = new CharacterDetailedGridRenderer(
          matrixModel,
          false
        )
        break
      case '2':
      default:
        characterRenderer = new CharacterMinimalGridRenderer(matrixModel, false)
        break
    }
    this.characterGrid.setRenderer(characterRenderer)
    this.characterGrid.redraw()
  }

  /**
   * Handles events from changing the matrix
   */
  private onHandleMatrixChange() {
    const matrixId = parseInt(this.matrixSelectComboBox.getSelectedValue(), 10)
    this.switchToMatrix(matrixId).catch((e) => this.error(e))
  }

  private error(e: Error) {
    console.log(e)
    throw e
  }

  /**
   * Character Editor HTML
   */
  private static htmlContent(): string {
    return `
    <div class="characterEditor">
      <div class="topButtonBar">
        <div class="btn-group mb-dropdown-bar" role="group">
        </div>
        <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
          <button type="button" class="btn btn-primary mb-search-btn">Search</button>
          <button type="button" class="btn btn-primary mb-add-btn">Add Character</button>
          <button type="button" class="btn btn-primary mb-delete-btn">Delete Character</button>
          <button type="button" class="btn btn-primary mb-orderings-btn">Ordering</button>
          <button type="button" class="btn btn-primary mb-rules-btn">Ontology</button>
        </div>
      </div>
      <div class="characterContainer"></div>
    </div>
  `
  }
}
