import { MatrixModel } from '../../MatrixModel'
import { GoToCharacterEvent } from '../../events/GoToCharacterEvent'
import * as GoToCellEvents from '../../events/GoToCellEvent'
import { EventType } from '../Component'
import {
  CharacterDetailedGridRenderer,
  CharacterMinimalGridRenderer,
} from '../CharacterGridRenderer'
import { CharacterGrid } from '../CharacterGrid'
import { Dialog } from '../Dialog'
import { Dropdown } from '../Dropdown'
import { AddCharacterDialog } from './AddCharacterDialog'
import { CharacterOrderingDialog } from './CharacterOrderingDialog'
import { SearchDialog } from './SearchDialog'
import { OntologyDialog } from './OntologyDialog'
import { ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'

/**
 * Character List Editor dialog.
 *
 * @param matrixModel the data associated with the matrix.
 * @param readonly Whether the grid is read-only
 */
export class CharacterListDialog extends Dialog {
  /**
   * The keys used to identify additional buttons in events.
   */
  private static readonly ButtonKeys = {
    DELETE: 'delete',
    ONTOLOGY: 'rules',
    ORDERING: 'ordering',
    SEARCH: 'search',
  }

  /**
   * The keys used to identify additional buttons in events.
   */
  private static readonly ButtonLabels = {
    DELETE: 'Delete',
    ONTOLOGY: 'Ontology',
    ORDERING: 'Ordering',
    SEARCH: 'Search',
  }

  /**
   * The standard buttons (keys associated with captions).
   */
  private static readonly Buttons = {
    DELETE: {
      text: CharacterListDialog.ButtonLabels.DELETE,
      key: CharacterListDialog.ButtonKeys.DELETE,
      dismissable: false,
    },
    ONTOLOGY: {
      text: CharacterListDialog.ButtonLabels.ONTOLOGY,
      key: CharacterListDialog.ButtonKeys.ONTOLOGY,
      dismissable: false,
    },
    ORDERING: {
      text: CharacterListDialog.ButtonLabels.ORDERING,
      key: CharacterListDialog.ButtonKeys.ORDERING,
      dismissable: false,
    },
    SEARCH: {
      text: CharacterListDialog.ButtonLabels.SEARCH,
      key: CharacterListDialog.ButtonKeys.SEARCH,
      dismissable: false,
    },
  }
  /**
   * The min number of the character pane.
   */
  protected static MIN_CHARACTER_PANE_HEIGHT: number = 300

  /**
   * The max number of the character pane.
   */
  protected static MAX_CHARACTER_PANE_HEIGHT: number = 500
  protected characterGrid: CharacterGrid
  protected viewSelect: Dropdown

  constructor(
    protected readonly matrixModel: MatrixModel,
    protected readonly readonly: boolean
  ) {
    super()
    this.characterGrid = new CharacterGrid(
      matrixModel,
      this.savingLabel,
      readonly
    )
    this.registerDisposable(this.characterGrid)
    this.viewSelect = new Dropdown()
    this.registerDisposable(this.viewSelect)
    this.setTitle('Character List')
    this.addButton(ModalDefaultButtons.DONE)
    this.addButton(CharacterListDialog.Buttons.DELETE)
    this.addButton(CharacterListDialog.Buttons.ONTOLOGY)
    this.addButton(CharacterListDialog.Buttons.ORDERING)
    this.addButton(CharacterListDialog.Buttons.SEARCH)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('characterListDialog', 'modal-xl')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = this.htmlContent()
    this.viewSelect.addItem({ text: 'Detailed View', value: 1 })
    this.viewSelect.addItem({ text: 'Minimal View', value: 2 })
    this.viewSelect.setSelectedIndex(0)
    this.viewSelect.render(contentElement)
    const characterPane = this.getElementByClass<HTMLElement>('characterPane')
    this.characterGrid.render(characterPane)
    this.characterGrid.addScrollableContainer(characterPane)
    this.characterGrid.focus()

    // determine the max height of the character list dialog allowed
    this.onHandleCharacterSelectionChange()
    const buttons = [ModalDefaultButtons.DONE]
    if (!this.readonly) {
      buttons.push(
        CharacterListDialog.Buttons.DELETE,
        CharacterListDialog.Buttons.ONTOLOGY,
        CharacterListDialog.Buttons.ORDERING
      )
    }
    buttons.push(CharacterListDialog.Buttons.SEARCH)
    this.showButtons(buttons)
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler
      .listen(this, EventType.SELECT, (e: CustomEvent<any>) =>
        this.onHandleSelect(e)
      )
      .listen(
        window,
        GoToCellEvents.TYPE,
        (e: CustomEvent<GoToCharacterEvent>) => this.goCharacterIndex(e)
      )
      .listen(this.viewSelect, EventType.CHANGE, (e: Event) =>
        this.onHandleViewChange(e)
      )
      .listen(this.characterGrid, EventType.SELECT, () =>
        this.onHandleCharacterSelectionChange()
      )
    if (!this.readonly) {
      const addCharacterElement = this.getElementByClass('addCharacter')
      handler.listen(addCharacterElement, EventType.CLICK, () =>
        this.onHandleAddCharacterClick()
      )
    }
  }

  /**
   * Scrolls to a character to scroll to provided by its id
   * @param characterId The id of the character to scroll to.
   */
  setSelectedCharacterById(characterId: number) {
    const characterIds = this.matrixModel.getCharacters().getIds()
    const index = characterIds.indexOf(characterId)
    this.characterGrid.setSelectedIndex(index)
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleSelect(e: CustomEvent) {
    switch (e.detail.key) {
      case CharacterListDialog.ButtonKeys.ONTOLOGY:
        this.showOntologyDialog()
        return false
      case CharacterListDialog.ButtonKeys.SEARCH:
        this.showSearchDialog()
        return false
      case CharacterListDialog.ButtonKeys.ORDERING:
        this.showCharacterOrderingDialog()
        return false
      case CharacterListDialog.ButtonKeys.DELETE:
        this.characterGrid.deleteSelectedIndices()
        return false
      default:
        return true
    }
  }

  /**
   * Handles when the view has changed
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleViewChange(e: Event) {
    let characterRenderer
    const value = parseInt(this.viewSelect.getSelectedValue(), 10)
    switch (value) {
      case 1:
        characterRenderer = new CharacterDetailedGridRenderer(
          this.matrixModel,
          this.readonly
        )
        break
      case 2:
      default:
        characterRenderer = new CharacterMinimalGridRenderer(
          this.matrixModel,
          this.readonly
        )
        break
    }
    this.characterGrid.setRenderer(characterRenderer)
    this.characterGrid.redraw()
  }

  /**
   * Handles when a character on the grid is selected.
   */
  protected onHandleCharacterSelectionChange() {
    const hasCharacterSelected = this.characterGrid.getSelectedIndex() !== -1
    this.setButtonEnabled(
      CharacterListDialog.Buttons.DELETE,
      hasCharacterSelected
    )
  }

  /**
   * Handles when the users clicks the add character link.
   */
  protected onHandleAddCharacterClick() {
    const index = this.characterGrid.getSelectedIndex()
    const saveCallback = (name: string, index: number, type: string) =>
      this.addCharacterToGrid(name, index, type)
    const addCharacterDialog = new AddCharacterDialog(
      this.matrixModel,
      index,
      saveCallback
    )
    addCharacterDialog.setVisible(true)
  }

  /**
   * Go to a particular character.
   * @param e event to go to a character
   */
  protected goCharacterIndex(e: CustomEvent<GoToCharacterEvent>) {
    this.characterGrid.goToCharacter(e.detail.characterIndex)
    return true
  }

  /**
   * Adds a character to the grid.
   * @param name The name of the character to add
   * @param index The index to add the character to.
   * @param charType The type of character (e.g. continuous, discrete).
   */
  protected addCharacterToGrid(
    name: string,
    index: number,
    charType: string
  ): Promise<void> {
    this.savingLabel.saving()
    return this.matrixModel
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
   * Show the ontology dialog.
   */
  showOntologyDialog() {
    const ontologyDialog = new OntologyDialog(this.matrixModel, this.readonly)
    ontologyDialog.setDisposeOnHide(true)
    ontologyDialog.setVisible(true)
  }

  /**
   * Show the search dialog.
   */
  showSearchDialog() {
    const searchDialog = new SearchDialog(this.matrixModel)
    searchDialog.setOnlyShowCharacterTab()
    searchDialog.setDisposeOnHide(true)
    searchDialog.setVisible(true)
  }

  /**
   * Show the character ordering dialog.
   */
  showCharacterOrderingDialog() {
    const characterOrderingDialog = new CharacterOrderingDialog(
      this.matrixModel
    )
    characterOrderingDialog.setDisposeOnHide(true)
    characterOrderingDialog.setVisible(true)
  }

  /** @return The HTML content of the dialog */
  htmlContent(): string {
    const addCharacterHtml = this.readonly
      ? ''
      : '<span class="addCharacter">+ Add new</span>'
    return addCharacterHtml + '<div class="characterPane"></div>'
  }
}
