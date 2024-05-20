import { Character } from '../../data/Characters'
import { AddNoteDialog } from './AddNoteDialog'
import type { CellInfoStatus } from '../../data/Cells'

/**
 * Add comment dialog.
 *
 * @param character the data associated with the matrix.
 * @param selectCallback the callback when the user press save
 */
export class AddCharacterCommentDialog extends AddNoteDialog {
  private readonly character: Character

  constructor(
    character: Character,
    selectCallback: (status: CellInfoStatus, note: string) => Promise<void>
  ) {
    super(selectCallback)

    this.character = character
    this.setTitle('Add comment')
  }

  override setSelectMenuItems() {
    this.select.addItem({ text: 'character', value: 0 })
    const characterStates = this.character.getStates()
    for (let x = 0; x < characterStates.length; x++) {
      const characterState = characterStates[x]
      this.select.addItem({
        text: characterState.getName(),
        value: characterState.getId(),
      })
    }
  }

  override htmlContent() {
    return (
      '<textarea class="comment"></textarea>' +
      '<div class="control character-control">' +
      '<div class="field">Comment is about</div>' +
      '</div>'
    )
  }
}
