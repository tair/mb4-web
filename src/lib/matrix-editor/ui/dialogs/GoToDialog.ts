import { MatrixModel } from '../../MatrixModel'
import { AbstractItem } from '../../data/AbstractItems'
import { EventType } from '../Component'
import { Modal, ModalDefaultButtons } from '../Modal'
import * as GoToCellEvents from '../../events/GoToCellEvent'

/**
 * The Go To dialog which moves the matrix editor to a particular point.
 * @param matrixModel The data associated with the matrix.
 */
export class GoToDialog extends Modal {
  private static readonly ButtonLabels = { GO: 'Go' }
  private static readonly ButtonKeys = { GO: 'go' }

  /**
   * Buttons for this dialog.
   */
  private static readonly Buttons = {
    GO: {
      text: GoToDialog.ButtonLabels.GO,
      key: GoToDialog.ButtonKeys.GO,
      dismissable: true,
    },
  }

  private readonly matrixModel: MatrixModel

  constructor(matrixModel: MatrixModel) {
    super()

    this.matrixModel = matrixModel

    this.setTitle('Go To')
    this.setHasBackdrop(false)
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.setContent(GoToDialog.htmlContent())
    this.addButton(GoToDialog.Buttons.GO)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('goToDialog')
  }

  override enterDocument() {
    super.enterDocument()
    const characterNumberElement = this.getElementByClass('characterNumber')
    const taxonNumberElement = this.getElementByClass('taxonNumber')
    this.getHandler()
      .listen(characterNumberElement, EventType.KEYUP, () => this.updateUI())
      .listen(taxonNumberElement, EventType.KEYUP, () => this.updateUI())
      .listen(this, EventType.SELECT, (e: CustomEvent<any>) => this.onHandleSelect(e))
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  protected onHandleSelect(e: CustomEvent) {
    switch (e.detail.key) {
      case GoToDialog.ButtonKeys.GO:
        const characterNumberElement =
          this.getElementByClass<HTMLInputElement>('characterNumber')
        const taxonNumberElement =
          this.getElementByClass<HTMLInputElement>('taxonNumber')
        const characterNumber = this.convertNumber(characterNumberElement.value)
        const taxonNumber = this.convertNumber(taxonNumberElement.value)
        const taxonIndex = GoToDialog.getClosestIndexFromNumber(
          this.matrixModel.getPartitionTaxa(),
          taxonNumber
        )
        const characterIndex = GoToDialog.getClosestIndexFromNumber(
          this.matrixModel.getPartitionCharacters(),
          characterNumber
        )
        window.dispatchEvent(GoToCellEvents.create(taxonIndex, characterIndex))
        break
      default:
        break
    }
    return true
  }

  /**
   * Update the UI based on user's input.
   */
  protected updateUI() {
    if (!this.isInDocument()) {
      return
    }
    const characterNumberElement =
      this.getElementByClass<HTMLInputElement>('characterNumber')
    const taxonNumberElement =
      this.getElementByClass<HTMLInputElement>('taxonNumber')
    const characterNumber = this.convertNumber(characterNumberElement.value)
    const taxonNumber = this.convertNumber(taxonNumberElement.value)
    const characterValid =
      characterNumber <= this.matrixModel.getNumberOfCharacters()
    const taxonValid = taxonNumber <= this.matrixModel.getNumberOfTaxa()
    if (characterValid) {
      characterNumberElement.classList.remove('error')
    } else {
      characterNumberElement.classList.add('error')
    }
    if (taxonValid) {
      taxonNumberElement.classList.remove('error')
    } else {
      taxonNumberElement.classList.add('error')
    }
    this.setButtonEnabled(GoToDialog.Buttons.GO, characterValid && taxonValid)
  }

  /**
   * The dialog's HTML Content
   */
  static htmlContent() {
    return (
      '<div class="label">Character Number</div>' +
      '<input class="characterNumber" type="text" />' +
      '<div class="label">Taxon Number</div>' +
      '<input class="taxonNumber type="text" />'
    )
  }

  /**
   * Convert and validate the user-specified input.
   * @param value The user-specified number.
   * @returns The converted number.
   */
  convertNumber(value: string): number {
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    return parseInt(value, 10) + numberingMode
  }

  /**
   * Get the closest index for a given item number.
   * @param number The targeted number.
   * @returns The closest number from the array of items.
   */
  static getClosestIndexFromNumber(
    items: AbstractItem[],
    number: number
  ): number {
    for (let index = items.length - 1; index >= 0; index--) {
      const item = items[index]
      if (number >= item.getNumber()) {
        return index
      }
    }
    return -1
  }
}
