import { MatrixModel, type CellObject } from '../MatrixModel'

/**
 * The tooltip for cells within the matrix grid.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 */
export class CellTooltip {
  protected matrixModel: MatrixModel
  protected showTimer: number | null

  constructor(matrixModel: MatrixModel) {
    this.matrixModel = matrixModel
  }

  /**
   * Shows the tooltip for the cell element.
   *
   * @param cell The cell to show the tooltip for
   */
  showForCell(cell: HTMLElement) {
    const characterIdValue = cell.dataset['characterId']
    if (characterIdValue == null) {
      return
    }

    const taxonIdValue = cell.dataset['taxonId']
    if (taxonIdValue == null) {
      return
    }

    const characterId = parseInt(characterIdValue, 10)
    const taxonId = parseInt(taxonIdValue, 10)

    let cellTooltipText = this.getCellTooltip(taxonId, characterId)

    const editingUserIdValue = cell.dataset['editingUserId']
    if (editingUserIdValue) {
      const editingUserId = parseInt(editingUserIdValue, 10)
      cellTooltipText += this.getCurrentEditors(editingUserId)
    }

    this.hideForCell(cell)
    this.showTimer = window.setTimeout(() => {
      cell.title = cellTooltipText
    }, 0)
  }

  /**
   * Hide the tooltip for the cell element.
   *
   * @param cell The cell to show the tooltip for
   */
  hideForCell(cell: HTMLElement) {
    cell.title = ''
    if (this.showTimer) {
      clearTimeout(this.showTimer)
      this.showTimer = null
    }
  }

  /**
   * Generates the tooltip for the cell.
   *
   * Currently, this is used in the title attribute therefore we do not need to escape the user-supplied strings. In the
   * event that this uses a custom DIV, we would need to escape the state name and cell note to ensure that it does not
   * contain invalid input.
   *
   * @param taxonId The taxon id for the tooltop
   * @param characterId The character id for the tooltop
   * @return The tooltip for the cell
   */
  protected getCellTooltip(taxonId: number, characterId: number): string {
    const statusDisplayText = { 0: 'New', 50: 'In-progress', 100: 'Complete' }
    const cellInfo: CellObject = this.matrixModel.getCell(taxonId, characterId)
    let tooltip = 'Status: ' + statusDisplayText[cellInfo.status] + '\n\n'
    for (let x = 0; x < cellInfo.states.length; x++) {
      const state = cellInfo.states[x]
      if (state.state_number) {
        switch (state.state_number) {
          case 'NPA':
            tooltip += 'NPA - not presently available\n'
            break
          case '-':
            tooltip += 'Inapplicable\n'
            break
          case '?':
            tooltip += '? - Not scored\n'
            break
          default:
            tooltip += state.state_number + ' - ' + state.state_name + '\n'
            break
        }
      } else {
        if (state.start_value) {
          tooltip += state.start_value
          if (state.end_value) {
            tooltip += ' - ' + state.end_value + '\n'
          }
        }
      }
    }
    if (cellInfo.notes) {
      tooltip += '\n\n' + cellInfo.notes
    }
    const publishable = this.matrixModel
      .getProjectProperties()
      .getAllowedPublish()
    if (publishable && publishable['publish_cell_comments'] === '1') {
      const citation_count = cellInfo.citation_count
      if (citation_count > 0) {
        tooltip +=
          '\n\nThis cell has ' + citation_count + ' associated citation'
        if (citation_count !== 1) {
          tooltip += 's'
        }
      }
      const comment_count = cellInfo.comment_count
      if (comment_count > 0) {
        tooltip += '\nThis cell has ' + comment_count + ' associated comment'
        if (comment_count !== 1) {
          tooltip += 's'
        }
      }
      const unread_comment_count = cellInfo.unread_comment_count
      if (unread_comment_count > 0) {
        tooltip +=
          '\nThis cell has ' +
          unread_comment_count +
          ' associated unread comment'
        if (unread_comment_count !== 1) {
          tooltip += 's'
        }
      }
    }
    return tooltip
  }

  /**
   * Generates the user id portion of the tooltip for the cell.
   *
   * @return The text indicating who is editing the cell
   */
  protected getCurrentEditors(userId: number): string {
    const projectProperties = this.matrixModel.getProjectProperties()
    const editor = projectProperties.getMember(userId)
    if (editor) {
      return (
        '\n\n Currently Editing: ' +
        editor.getFirstName() +
        ' ' +
        editor.getLastName()
      )
    }
    return ''
  }
}
