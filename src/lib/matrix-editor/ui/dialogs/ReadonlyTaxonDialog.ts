import { TabNavigator } from '../TabNavigator'
import { MediaGrid, MediaGridItemEvent } from '../MediaGrid'
import { MatrixModel } from '../../MatrixModel'
import { Taxon } from '../../data/Taxa'
import { Component } from '../Component'
import { Dialog } from '../Dialog'
import { ModalDefaultButtons } from '../Modal'
import { EventType, KeyCodes, MobileFriendlyClickEventType } from '../Component'
import { ImageViewerDialog } from './ImageViewerDialog'

/**
 * The readonly taxon dialog used to display taxon information in the Matrix editor
 *
 * @param matrixModel The data associated with the matrix
 * @param taxonId the id of the taxon to render for this dialog
 */
export class ReadonlyTaxonDialog extends Dialog {
  private matrixModel: MatrixModel
  private taxonId: number
  private tabNavigator: TabNavigator

  constructor(matrixModel: MatrixModel, taxonId: number) {
    super()

    this.matrixModel = matrixModel
    this.taxonId = taxonId

    this.tabNavigator = new TabNavigator()
    this.registerDisposable(this.tabNavigator)

    this.setTitle('Taxon Editor')
    this.setDisposeOnHide(true)
    this.addButton(ModalDefaultButtons.DONE)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('taxaDialog', 'modal-lg')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = ReadonlyTaxonDialog.htmlContent()
    this.redraw()

    this.tabNavigator.render(contentElement)
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(
      this.getElement(),
      EventType.KEYDOWN,
      this.onHandleKeyDown
    )
  }

  /**
   * Redraws the character dialog
   */
  redraw() {
    const taxon = this.matrixModel.getTaxa().getById(this.taxonId)
    if (taxon == null) {
      throw 'Taxon does not exist'
    }

    let selectedTabIndex = this.tabNavigator.getSelectedTabIndex()
    this.tabNavigator.clearTabs()

    this.tabNavigator.addTab('Notes', new NotesPane(taxon))
    if (taxon.hasMedia()) {
      this.tabNavigator.addTab('Media', new MediaPane(taxon, this.matrixModel))
    }

    this.tabNavigator.setSelectedTabIndex(selectedTabIndex)
    const taxonNameElement = this.getElementByClass('taxonName ')
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const taxonName =
      '[' + (taxon.getNumber() - numberingMode) + '] ' + taxon.getDisplayName()
    taxonNameElement.innerHTML = '<b>Now Viewing taxon</b>: ' + taxonName
  }

  /**
   * Handles when the key down event is triggered on the dialog
   * @param e The event that triggerd this callback.
   */
  protected onHandleKeyDown(e: KeyboardEvent) {
    if (e.code === KeyCodes.UP || e.code === KeyCodes.DOWN) {
      const pos = e.code === KeyCodes.UP ? -1 : 1
      const nextTaxonIndex =
        this.matrixModel.getTaxonIndexById(this.taxonId) + pos
      const partitionTaxa = this.matrixModel.getPartitionTaxa()
      const nextTaxon = partitionTaxa[nextTaxonIndex]
      if (nextTaxon) {
        this.taxonId = nextTaxon.getId()
        this.redraw()
        return true
      }
    }
  }

  /** @return The HTML content of the dialog */
  static htmlContent(): string {
    return '<div class="taxonName "></div>'
  }
}

/**
 * Taxon Notes pane
 */
class NotesPane extends Component {
  private readonly taxon: Taxon

  constructor(taxon: Taxon) {
    super()

    this.taxon = taxon
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('notesPane')
    element.innerHTML = this.htmlContent()
  }

  /**
   * @return The HTML content for the comments pane
   */
  htmlContent(): string {
    return (
      '<textarea class="notesArea" readonly>' +
      this.taxon.getNotes() +
      '</textarea>'
    )
  }
}

/**
 * Taxon Media pane
 */
class MediaPane extends Component {
  private readonly taxon: Taxon
  private readonly matrixModel: MatrixModel
  private readonly mediaGrid: MediaGrid

  constructor(taxon: Taxon, matrixModel: MatrixModel) {
    super()

    this.taxon = taxon
    this.matrixModel = matrixModel

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
    this.getHandler().listen(
      this.mediaGrid,
      MobileFriendlyClickEventType,
      (e: CustomEvent<MediaGridItemEvent>) =>
        this.onHandleDoubleClickCellMedia(e)
    )
  }

  /**
   * Sets the media the in media grid
   */
  setMediaInGrid() {
    this.mediaGrid.clear()
    const media = this.taxon.getMedia()
    for (let x = 0; x < media.length; x++) {
      const medium = media[x]
      this.mediaGrid.addItem({ id: medium.getId(), image: medium.getTiny() })
    }
  }

  /**
   * Handles events when media are selected.
   * @param e The event that triggerd this callback.
   */
  protected onHandleDoubleClickCellMedia(e: CustomEvent<MediaGridItemEvent>) {
    const item = e.detail.item
    if (item) {
      // Use new signature with project ID and published state from matrix model
      const projectId = this.matrixModel.getProjectId()
      const published = this.matrixModel.isPublished()
      ImageViewerDialog.show('T', item.id, projectId, {}, true, null, published)
    }
  }
}
