import { MatrixModel } from '../../MatrixModel'
import { AbstractItem } from '../../data/AbstractItems'
import { EventType } from '../Component'
import { Modal, ModalDefaultButtons } from '../Modal'
import * as GoToCellEvents from '../../events/GoToCellEvent'

/**
 * Dialog that moves the matrix editor to a particular character and taxon.
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
  }

  protected override initialize(): void {
    this.setTitle('Go To')
    this.setHasBackdrop(false)
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.setContent(GoToDialog.htmlContent())
    this.addButton(GoToDialog.Buttons.GO)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  protected override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('goToDialog', 'modal-sm')
  }

  protected override enterDocument() {
    super.enterDocument()

    const characterNumberElement = this.getElementByClass('characterNumber')
    const taxonNumberElement = this.getElementByClass('taxonNumber')

    this.getHandler()
      .listen(characterNumberElement, EventType.KEYUP, () => this.updateUI())
      .listen(taxonNumberElement, EventType.KEYUP, () => this.updateUI())
      .listen(this, EventType.SELECT, (e: CustomEvent<any>) =>
        this.onHandleSelect(e)
      )
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   */
  private onHandleSelect(e: CustomEvent) {
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
  private updateUI() {
    if (!this.isInDocument()) {
      return
    }

    const characterNumberElement =
      this.getElementByClass<HTMLInputElement>('characterNumber')
    if (characterNumberElement.value) {
      const characterNumber = this.convertNumber(characterNumberElement.value)
      const valid = characterNumber <= this.matrixModel.getNumberOfCharacters()
      characterNumberElement.classList.toggle('error', !valid)
    }

    const taxonNumberElement =
      this.getElementByClass<HTMLInputElement>('taxonNumber')
    if (taxonNumberElement.value) {
      const taxonNumber = this.convertNumber(taxonNumberElement.value)
      const valid = taxonNumber <= this.matrixModel.getNumberOfTaxa()
      taxonNumberElement.classList.toggle('error', !valid)
    }

    const valid =
      !characterNumberElement.classList.contains('error') &&
      !taxonNumberElement.classList.contains('error')
    this.setButtonEnabled(GoToDialog.Buttons.GO, valid)
  }

  /**
   * The dialog's HTML Content
   */
  private static htmlContent() {
    return (
      '<div class="label">Character Number</div>' +
      '<input class="characterNumber form-control" type="text" />' +
      '<div class="label">Taxon Number</div>' +
      '<input class="taxonNumber form-control" type="text" />'
    )
  }

  /**
   * Convert and validate the user-specified input.
   * @param value The user-specified number.
   * @returns The converted number.
   */
  private convertNumber(value: string): number {
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    return parseInt(value, 10) + numberingMode
  }

  /**
   * Get the closest index for a given item number.
   * @param number The targeted number.
   * @returns The closest number from the array of items.
   */
  private static getClosestIndexFromNumber(
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
