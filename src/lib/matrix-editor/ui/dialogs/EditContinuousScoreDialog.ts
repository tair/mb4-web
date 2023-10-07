import { Modal, ModalDefaultButtons, ModalDefaultButtonKeys } from '../Modal'
import { EventType } from '../Component'
import { CharacterType } from '../../data/Characters'

/**
 * Edit a values for a continuous character.
 *
 * @param selectCallback the callback when the user press save
 */
export class EditContinuousScoreDialog extends Modal {
  private readonly characterType: CharacterType
  private readonly selectCallback: (p1: number, p2: number) => Promise<void>

  constructor(
    characterType: CharacterType,
    selectCallback: (p1: number, p2: number) => Promise<void>
  ) {
    super()

    this.characterType = characterType
    this.selectCallback = selectCallback

    this.setTitle('Edit Continuous Data')
    this.setDisposeOnHide(true)
    this.setHasTitleCloseButton(false)
    this.addButton(ModalDefaultButtons.SAVE)
    this.addButton(ModalDefaultButtons.CANCEL)
  }

  override createDom() {
    super.createDom()
    const htmlContent =
      this.characterType === CharacterType.CONTINUOUS
        ? EditContinuousScoreDialog.htmlContinuousContent
        : EditContinuousScoreDialog.htmlMeristicContent
    const contentElement = this.getContentElement()
    contentElement.innerHTML = htmlContent()
    contentElement.classList.add('editScoreDialog')
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(this, EventType.SELECT, (e: CustomEvent<any>) =>
      this.onHandleSelect(e)
    )
  }

  /**
   * Handles when the users clicks one of the dialog buttons.
   *
   * @param e The event that triggered this callback.
   * @return Whether the event was processed.
   */
  private onHandleSelect(e: CustomEvent): boolean {
    if (e.detail.key === ModalDefaultButtonKeys.OK) {
      const startInputElement =
        this.getElementByClass<HTMLInputElement>('start-input')
      const startValue = parseInt(startInputElement.value, 10)
      let endValue: number = NaN
      if (this.characterType === CharacterType.CONTINUOUS) {
        const endInputElement =
          this.getElementByClass<HTMLInputElement>('end-input')
        endValue = parseInt(endInputElement.value, 10)
      }
      this.selectCallback(startValue, endValue).then(() => this.dispose())
      return false
    }
    return true
  }

  /**
   * @return The HTML content for continuous characters.
   */
  static htmlContinuousContent(): string {
    return (
      '<div class="value-control">' +
      '<div class="label">Start value: </div><input type="text" class="start-input" size="20"/>' +
      '</div>' +
      '<div class="value-control">' +
      '<div class="label">End value: </div><input type="text" class="end-input" size="20"/>' +
      '</div>'
    )
  }

  /**
   * @return The HTML content for meristic characters.
   */
  static htmlMeristicContent(): string {
    return (
      '<div class="value-control">' +
      '<div class="label">Value: </div><input type="text" class="start-input" size="20"/>' +
      '</div>'
    )
  }
}
