import { Modal } from './Modal'
import { SavingLabel } from './SavingLabel'

/**
 * The base of a Morphobank Dialog
 */
export class Dialog extends Modal {
  protected readonly savingLabel: SavingLabel

  constructor() {
    super()

    this.savingLabel = new SavingLabel()
    this.registerDisposable(this.savingLabel)

    this.setHasTitleCloseButton(false)
  }

  protected override createDom() {
    super.createDom()
    const buttonsElement = this.getButtonsElement()
    buttonsElement.classList.add('dialogButtons')

    // nothing should be highlightable
    const element = this.getElement()
    element.classList.add('nonSelectable')
    const titleElement = this.getHeaderElement()
    this.savingLabel.render(titleElement)
  }
}
