import { Character, CharacterType } from '../../data/Characters'
import { MediaGrid, MediaGridItemEvent } from '../MediaGrid'
import { Citation } from '../../data/Citation'
import { MatrixModel } from '../../MatrixModel'
import { Component, MobileFriendlyClickEventType, EventType } from '../Component'
import { DataGridTable, DataRow } from '../DataGridTable'
import { Dialog } from '../Dialog'
import { TabNavigator } from '../TabNavigator'
import { ModalDefaultButtons } from '../Modal'
import * as mb from '../../mb'
import { ImageViewerDialog } from './ImageViewerDialog'

/**
 * The readonly character dialog used to display character information in the Matrix editor
 *
 * @param matrixModel The data associated with the matrix
 * @param characterId the id of the character to render for this dialog
 */
export class ReadonlyCharacterDialog extends Dialog {
  private readonly matrixModel: MatrixModel
  private readonly characterId: number
  private tabNavigator: TabNavigator

  constructor(matrixModel: MatrixModel, characterId: number) {
    super()

    this.matrixModel = matrixModel
    this.characterId = characterId
    this.tabNavigator = new TabNavigator()
    this.registerDisposable(this.tabNavigator)
    this.setDisposeOnHide(true)
    this.addButton(ModalDefaultButtons.DONE)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('characterDialog')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = ReadonlyCharacterDialog.htmlContent()
    this.redraw()

    this.tabNavigator.render(contentElement)
  }

  /**
   * Redraws the character dialog
   */
  redraw() {
    const character = this.matrixModel.getCharacters().getById(this.characterId)
    if (character == null) {
      throw 'Error fetching the character'
    }

    this.tabNavigator.clearTabs()
    this.tabNavigator.addTab('Character', new CharacterPane(character))
    if (character!.hasMedia()) {
    this.tabNavigator.addTab('Media', new MediaPane(this.matrixModel, character))
    }
    if (character!.getCitationCount()) {
      this.tabNavigator.addTab(
        'Citations',
        new CitationsPane(this.matrixModel, character)
      )
    }
    this.tabNavigator.redraw()
    this.updateCharacterName()
  }

  /**
   * Update the character's name from the model
   */
  protected updateCharacterName() {
    const character = this.matrixModel.getCharacters().getById(this.characterId)
    if (character == null) {
      return
    }

    const characterNameElement = this.getElementByClass('characterName')
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const characterName =
      '[' +
      (character.getNumber() - numberingMode) +
      '] ' +
      mb.htmlEscape(character.getName())
    characterNameElement.innerHTML =
      '<b>Now viewing character</b>: ' + characterName
  }

  /** @return The HTML content of the dialog */
  static htmlContent(): string {
    return '<div class="characterName"></div>'
  }
}

/**
 * Character  pane
 */
class CharacterPane extends Component {
  private readonly character: Character
  private readonly statesGridTable: DataGridTable

  constructor(character: Character) {
    super()

    this.character = character

    this.statesGridTable = new DataGridTable()
    this.registerDisposable(this.statesGridTable)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = this.htmlContent()
    const statesPaneElement = this.getElementByClass('statesPane')
    const type = this.character.getType()
    if (type === CharacterType.DISCRETE) {
      this.statesGridTable.addColumn('#')
      this.statesGridTable.addColumn('State')
      this.statesGridTable.render(statesPaneElement)
      this.redrawCharacterStates()
    } else {
      const text = type === CharacterType.CONTINUOUS ? 'Continuous' : 'Meristic'
      const textNode = document.createTextNode(text)
      statesPaneElement.appendChild(textNode)
      const statesLabelElement = this.getElementByClass('states-label')
      statesLabelElement.textContent = 'Type'
    }
  }

  /**
   * Redraws the character states in the grid.
   */
  private redrawCharacterStates() {
    const rows: DataRow[] = []
    const characterStates = this.character.getStates()
    for (let x = 0; x < characterStates.length; x++) {
      const characterState = characterStates[x]
      const row = {
        labels: [
          characterState.getNumber().toString(),
          characterState.getName(),
        ],
      }
      rows.push(row)
    }
    this.statesGridTable.clearRows()
    this.statesGridTable.addRows(rows)
    this.statesGridTable.redraw()
  }

  /**
   * @return The HTML content for the comments pane
   */
  htmlContent(): string {
    return (
      '<div class="characterPane">' +
      '<div class="label">Name</div>' +
      '<input class="nameInput" value="' +
      this.character.getName() +
      '" readonly/>' +
      '<p></p>' +
      '<div class="label states-label">States</div>' +
      '<div class="statesPane"></div>' +
      '<p></p>' +
      '<div class="label">Notes</div>' +
      '<textarea class="descriptionInput" readonly>' +
      this.character.getDescription() +
      '</textarea>' +
      '</div>'
    )
  }
}

/**
 * Character Media pane
 */

class MediaPane extends Component {
  private readonly matrixModel: MatrixModel
  private readonly character: Character
  private readonly mediaGrid: MediaGrid

  constructor(matrixModel: MatrixModel, character: Character) {
    super()

    this.matrixModel = matrixModel
    this.character = character

    this.mediaGrid = new MediaGrid()
    this.mediaGrid.setRemoveable(false)
    this.registerDisposable(this.mediaGrid)
  }

  /**
   * @return The HTML content of the cell media grid
   */
  static htmlContent(): string {
    return '<div class="mediaPane"><div>'
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = MediaPane.htmlContent()
    this.setMediaInGrid()
    const mediaPane = this.getElementByClass('mediaPane')
    this.mediaGrid.render(mediaPane)
  }

  override enterDocument() {
    super.enterDocument()
    // Listen for the custom double-click event dispatched by MediaGrid
    // Use arrow function to preserve `this` context
    this.getHandler().listen(
      this.mediaGrid,
      EventType.DBLCLICK,
      (e: CustomEvent<MediaGridItemEvent>) => this.onHandleDoubleClickCellMedia(e)
    )
  }

  /**
   * Sets the media the in media grid
   */
  setMediaInGrid() {
    this.mediaGrid.clear()
    const characterMedia = this.character.getMedia()
    for (let x = 0; x < characterMedia.length; x++) {
      const characterMedium = characterMedia[x]
      const characterState = this.character.getCharacterStateById(
        characterMedium.getStateId() || 0
      )
      const characterStateName = characterState ? characterState.getName() : ''
      const mediaItem = {
        // Use the actual media_id so the viewer can load the right media
        id: characterMedium.getMediaId(),
        image: characterMedium.getTiny(),
        caption: characterStateName,
      }
      this.mediaGrid.addItem(mediaItem)
    }
  }

  /**
   * Handles events when media are selected.
   * @param e The event that triggerd this callback.
   */
  protected onHandleDoubleClickCellMedia(e: CustomEvent<MediaGridItemEvent>) {
    const item = e.detail.item
    // Use new signature with project ID and published state from matrix model
    const projectId = this.matrixModel.getProjectId()
    const published = this.matrixModel.isPublished()
    // Find the corresponding character media object for the clicked media_id
    const characterMedium = this.character.getMediaByIds([item.id])?.[0]
    const mediaData = characterMedium
      ? ((characterMedium as any).characterMediaObj || {})
      : {}

    // Pass link_id when available so the details API can return character_display for labels
    const linkId = (mediaData && (mediaData.link_id || mediaData.linkId)) || null
    
    // Get character and state information for annotation context
    const characterId = characterMedium ? characterMedium.getCharacterId() : null
    const stateId = characterMedium ? characterMedium.getStateId() : null
    
    // Get character and state names for display in metadata
    const characterName = this.character.getName()
    const characterState = stateId ? this.character.getCharacterStateById(stateId) : null
    const stateName = characterState ? characterState.getName() : null
    const stateNumber = characterState ? characterState.getNumber() : null
    
    // Open in readonly mode in published context
    ImageViewerDialog.show('C', item.id, projectId, mediaData, true, linkId, published, characterId, stateId, characterName, stateName, stateNumber)
  }
}

/**
 * Citations pane
 *
 * @param matrixModel the data associated with the matrix.
 */
class CitationsPane extends Component {
  private readonly matrixModel: MatrixModel
  private readonly character: Character
  private readonly loadingElement: Element
  private readonly citationsGridTable: DataGridTable

  constructor(matrixModel: MatrixModel, character: Character) {
    super()

    this.matrixModel = matrixModel
    this.character = character

    this.loadingElement = this.getLoadingElement()
    this.citationsGridTable = new DataGridTable()
    this.registerDisposable(this.citationsGridTable)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = CitationsPane.htmlContent()
    this.citationsGridTable.addColumn('Reference')
    this.citationsGridTable.addColumn('Pages')
    this.citationsGridTable.addColumn('Notes')
    const citationsPane = this.getElementByClass('citationsPane')
    this.citationsGridTable.render(citationsPane)
    this.loadCitations()
  }

  /**
   * @return an element which shows a loading indicator.
   */
  getLoadingElement(): Element {
    const loadingElement = document.createElement('div')
    loadingElement.classList.add('loadingCitation')
    const messageElement = document.createElement('div')
    messageElement.textContent = 'Loading citations...'
    loadingElement.appendChild(messageElement)
    return loadingElement
  }

  /**
   * Loads the cell citations from the server
   */
  loadCitations() {
    const element = this.getElement()
    element.appendChild(this.loadingElement)
    const characterId = this.character.getId()
    this.matrixModel
      .getCharacterCitations(characterId)
      .then((citations) => {
        if (this.isInDocument()) {
          this.redrawCitations(citations)
        }
      })
      .catch(() => alert('Failed to load character citations'))
      .finally(() => element.removeChild(this.loadingElement))
  }

  /**
   * Redraws the cell citations within the citation grid.
   * @param citations the citations that will be used to redraw the grid
   */
  redrawCitations(citations: Citation[]) {
    const rows: DataRow[] = []
    for (let x = 0; x < citations.length; x++) {
      const citation = citations[x]
      const row = {
        labels: [
          mb.htmlEscape(citation.getName()),
          mb.htmlEscape(citation.getPages()),
          mb.htmlEscape(citation.getNotes()),
        ],
        removeable: false,
      }
      rows.push(row)
    }
    this.citationsGridTable.clearRows()
    this.citationsGridTable.addRows(rows)
    this.citationsGridTable.redraw()
  }

  /**
   * @return The HTML content for the citations pane
   */
  static htmlContent(): string {
    return '<div class="citationsPane"></div>'
  }
}
