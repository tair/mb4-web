import { MatrixModel } from '../../MatrixModel'
import { Dialog } from '../Dialog'
import { DraggableSelect } from '../DraggableSelect'
import { CharacterType } from '../../data/Characters'
import { ModalDefaultButtons } from '../Modal'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import * as mb from '../../mb'

/**
 * The character ordering dialog which updates the ordering.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 */
export class CharacterOrderingDialog extends Dialog {
  private unorderedCharactersSelect: DraggableSelect
  private orderedCharactersSelect: DraggableSelect

  constructor(protected readonly matrixModel: MatrixModel) {
    super()
    this.unorderedCharactersSelect = new DraggableSelect()
    this.registerDisposable(this.unorderedCharactersSelect)
    this.orderedCharactersSelect = new DraggableSelect()
    this.registerDisposable(this.orderedCharactersSelect)
    this.setTitle('Character Ordering Editor')
    this.addButton(ModalDefaultButtons.DONE)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('characterOrderingDialog')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = this.htmlContent()

    const unorderedCharacterSelectElement = this.getElementByClass(
      'unorderedCharacterSelect'
    )
    this.unorderedCharactersSelect.render(unorderedCharacterSelectElement)
    const orderedCharacterSelectElement = this.getElementByClass(
      'orderedCharacterSelect'
    )
    this.orderedCharactersSelect.render(orderedCharacterSelectElement)

    this.unorderedCharactersSelect.addTarget(this.orderedCharactersSelect)
    this.orderedCharactersSelect.addTarget(this.unorderedCharactersSelect)

    this.setCharacterOrderingsSelect()
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(this.matrixModel, [CharacterChangedEvents.TYPE], () =>
        this.setCharacterOrderingsSelect()
      )
      .listen(
        this.unorderedCharactersSelect,
        DraggableSelect.DroppedEventType,
        () => this.updateCharactersOrdering(this.orderedCharactersSelect)
      )
      .listen(
        this.orderedCharactersSelect,
        DraggableSelect.DroppedEventType,
        () => this.updateCharactersOrdering(this.unorderedCharactersSelect)
      )
  }

  /**
   * Sets the taxa to the Taxa in Matrix select component.
   */
  protected setCharacterOrderingsSelect() {
    const characters = this.matrixModel.getCharacters()
    const numOfCharacters = characters.size()
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    this.unorderedCharactersSelect.clearItems()
    this.orderedCharactersSelect.clearItems()
    for (let x = 0; x < numOfCharacters; x++) {
      const character = characters.getAt(x)

      // Discrete charactes are not the only ones which can be ordered therefore, let's ignore all
      // other types of characters.
      if (character.getType() != CharacterType.DISCRETE) {
        continue
      }
      const characterNumber = character.getNumber() - numberingMode
      const select = character.getOrdering()
        ? this.orderedCharactersSelect
        : this.unorderedCharactersSelect
      select.addItem(
        '[' + characterNumber + '] ' + character.getName(),
        character.getId()
      )
    }
    this.unorderedCharactersSelect.redraw()
    this.orderedCharactersSelect.redraw()
  }

  /**
   * Update the orderings of the characters
   */
  private updateCharactersOrdering(sourceSelect: DraggableSelect) {
    const characterIds = mb.convertToNumberArray(
      sourceSelect.getSelectedValues()
    )
    const ordering = sourceSelect === this.unorderedCharactersSelect ? 1 : 0
    this.matrixModel
      .updateCharactersOrdering(characterIds, ordering)
      .then(() => {
        this.setCharacterOrderingsSelect()
        this.unorderedCharactersSelect.redraw()
        this.orderedCharactersSelect.redraw()
        this.savingLabel.saved()
      })
      .catch((e) => {
        this.savingLabel.failed()
        alert(e)
      })
  }

  /**
   * @return The HTML content of the dialog.
   */
  htmlContent(): string {
    return (
      '<div class="orderingSelect nonSelectable">' +
      '<span class="unorderedCharacterSelect">Unordered characters</span>' +
      '<span class="orderedCharacterSelect">Orderered characters</span>' +
      '</div>' +
      '<div style="margin-top: 10px"><i>' +
      "Drag character from one list to the other to update the character's ordering. " +
      'To select contiguous character, press the hold the SHIFT key; ' +
      'for non-contiguous character, use the COMMAND key (Mac) or CTRL key (PC).' +
      '</i></div>'
    )
  }
}
