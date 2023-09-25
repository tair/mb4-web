import { Taxon } from '../../data/Taxa'
import { SavingLabel } from '../SavingLabel'
import { Partitions } from '../../data/Partitions'
import { ProjectProperties } from '../../data/ProjectProperties'
import { MatrixModel } from '../../MatrixModel'
import { Checkbox } from '../Checkbox'
import { DataGridTable, DataRow } from '../DataGridTable'
import { Dialog } from '../Dialog'
import { Dropdown } from '../Dropdown'
import { MediaGrid, MediaGridItem, MediaGridItemEvent } from '../MediaGrid'
import { TabNavigator } from '../TabNavigator'
import { AddMediaDialog } from './AddMediaDialog'
import { ImageViewerDialog } from './ImageViewerDialog'
import {
  Component,
  EventType,
  KeyCodes,
  MobileFriendlyClickEventType,
} from '../Component'
import { ModalDefaultButtons } from '../Modal'

/**
 * The Taxon list dialog which adds and removes taxa within this matrix.
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxonId the id of the taxon to render for this dialog
 */
export class TaxonDialog extends Dialog {
  /**
   * The last selected tab index. Used to keep the tab the same across taxon dialogs.
   */
  private static LAST_SELECTED_TAB_INDEX: number = 0

  private readonly matrixModel: MatrixModel

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
    contentElement.innerHTML = TaxonDialog.htmlContent()
    this.redraw()
    this.tabNavigator.setHeight(325)
    this.tabNavigator.render(contentElement)
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler()
      .listen(this.tabNavigator, EventType.SELECT, () =>
        this.updateLastSelectedTabIndex()
      )
      .listen(this.getElement(), EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.onKeyDown(e)
      )
  }

  /**
   * Redraws the character dialog
   */
  redraw() {
    const taxon = this.matrixModel.getTaxa().getById(this.taxonId)
    if (taxon == null) {
      return
    }

    this.tabNavigator.clearTabs()
    this.tabNavigator.addTab(
      'Notes',
      new NotesPane(this.matrixModel, taxon, this.savingLabel)
    )
    this.tabNavigator.addTab(
      'Media',
      new MediaPane(this.matrixModel, taxon, this.savingLabel)
    )
    this.tabNavigator.addTab(
      'Partitions',
      new PartitionsPane(this.matrixModel, taxon, this.savingLabel)
    )
    this.tabNavigator.addTab(
      'Access',
      new AccessPane(this.matrixModel, taxon, this.savingLabel)
    )
    this.tabNavigator.setSelectedTabIndex(TaxonDialog.LAST_SELECTED_TAB_INDEX)
    this.updateTaxonName()
  }

  /**
   * Handles when the key down event is triggered on the dialog
   * @param e The event that triggerd this callback.
   */
  private onKeyDown(e: KeyboardEvent) {
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

  /**
   * Updates the last selected tab index.
   */
  updateLastSelectedTabIndex() {
    TaxonDialog.LAST_SELECTED_TAB_INDEX =
      this.tabNavigator.getSelectedTabIndex()
  }

  /** @return The HTML content of the dialog */
  static htmlContent(): string {
    return '<div class="taxonName "></div>'
  }

  /**
   * Update the taxon's name from the model
   */
  protected updateTaxonName() {
    const taxon = this.matrixModel.getTaxa().getById(this.taxonId)
    if (taxon == null) {
      return
    }

    const taxonNameElement = this.getElementByClass('taxonName ')
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const taxonName =
      '[' + (taxon.getNumber() - numberingMode) + '] ' + taxon.getDisplayName()
    taxonNameElement.innerHTML = '<b>Now Editing</b>: ' + taxonName
  }
}

/**
 * Notes pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxon the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 */
class NotesPane extends Component {
  private readonly matrixModel: MatrixModel
  private readonly taxon: Taxon
  private readonly savingLabel: SavingLabel

  constructor(
    matrixModel: MatrixModel,
    taxon: Taxon,
    savingLabel: SavingLabel
  ) {
    super()

    this.matrixModel = matrixModel
    this.taxon = taxon
    this.savingLabel = savingLabel
  }

  override createDom() {
    super.createDom()
    const textAreaElement = document.createElement('textarea')
    textAreaElement.classList.add('notesArea')
    textAreaElement.value = this.taxon.getNotes()
    const projectProperties = this.matrixModel.getProjectProperties()
    textAreaElement.disabled = !this.taxon.hasAccess(projectProperties)
    const element = this.getElement()
    element.appendChild(textAreaElement)
  }

  override enterDocument() {
    super.enterDocument()
    const textAreaElement = this.getElementByClass('notesArea')
    this.getHandler()
      .listen(textAreaElement, EventType.BLUR, () => this.saveNotes())
      .listen(textAreaElement, EventType.KEYDOWN, (e: KeyboardEvent) =>
        this.onHandleNotesKeyDown(e)
      )
  }

  /**
   * Save the notes if they were changed.
   */
  saveNotes() {
    const textAreaElement =
      this.getElementByClass<HTMLTextAreaElement>('notesArea')
    const newNotes = textAreaElement.value
    if (newNotes === this.taxon.getNotes()) {
      return
    }
    this.savingLabel.saving()
    const taxonId = this.taxon.getId()
    this.matrixModel
      .setTaxaNotes([taxonId], newNotes)
      .then(() => {
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * Handlers events when for user key down events on the textarea for taxa notes.
   *
   * @param e The event that triggerd this callback.
   */
  protected onHandleNotesKeyDown(e: Event) {
    // Don't propagate events and only stay in the text area.
    e.stopPropagation()
  }
}

/**
 * Media pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxon the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 */
class MediaPane extends Component {
  /**
   * Key to use to store in the user settings storage.
   */
  protected static AUTO_OPEN_MEDIA_WINDOW: string = 'autoOpenMediaWindow'

  private readonly matrixModel: MatrixModel
  private readonly taxon: Taxon
  private readonly savingLabel: SavingLabel

  private mediaGrid: MediaGrid
  private openMediaCheckbox: Checkbox

  constructor(
    matrixModel: MatrixModel,
    taxon: Taxon,
    savingLabel: SavingLabel
  ) {
    super()

    this.matrixModel = matrixModel
    this.taxon = taxon
    this.savingLabel = savingLabel

    this.mediaGrid = new MediaGrid()
    this.mediaGrid.setRemoveable(true)
    this.registerDisposable(this.mediaGrid)
    this.openMediaCheckbox = new Checkbox(1)
    this.registerDisposable(this.openMediaCheckbox)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = MediaPane.htmlContent()
    this.setMediaInGrid()
    const mediaPane = this.getElementByClass('mediaPane')
    this.mediaGrid.render(mediaPane)
    const openMediaElement = this.getElementByClass('openMediaWindowCheckbox')
    this.openMediaCheckbox.render(openMediaElement)
    const settingsStorage = this.matrixModel.getUserMatrixSettings()
    const isAutoOpenMediaWindowSelected = !!settingsStorage.get(
      MediaPane.AUTO_OPEN_MEDIA_WINDOW
    )
    this.openMediaCheckbox.setChecked(isAutoOpenMediaWindowSelected)
    if (isAutoOpenMediaWindowSelected) {
      setTimeout(() => this.handleAddTaxonMedia, 350)
    }
  }

  override enterDocument() {
    super.enterDocument()
    this.getHandler().listen(
      this.mediaGrid,
      MobileFriendlyClickEventType,
      (e: CustomEvent<MediaGridItemEvent>) =>
        this.handleDoubleClickTaxonMedia(e)
    )
    const addTaxonMediaElement = this.getElementByClass('addTaxonMedia')
    if (!this.taxon.hasAccess(this.matrixModel.getProjectProperties())) {
      addTaxonMediaElement.classList.add('disabled')
      this.openMediaCheckbox.setEnabled(false)
      return
    }
    this.getHandler()
      .listen(this.mediaGrid, EventType.CUT, (e: CustomEvent<any>) =>
        this.removeMedia(e)
      )
      .listen(this.openMediaCheckbox, EventType.CHANGE, () =>
        this.handleMediaCheckboxChange()
      )
      .listen(addTaxonMediaElement, EventType.CLICK, () =>
        this.handleAddTaxonMedia()
      )
  }

  /**
   * Handles events when media are selected.
   * @param e The event that triggerd this callback.
   */
  protected handleDoubleClickTaxonMedia(e: CustomEvent<MediaGridItemEvent>) {
    const item = e.detail.item
    const medium = this.taxon.getMediaById(item.id)
    if (medium) {
      ImageViewerDialog.show('T', medium.getId())
    }
  }

  /**
   * Handles when the cut event on the media grid. This is when the user wants to remove the media from the taxon.
   *
   * @param e The event that triggered this callback.
   */
  protected removeMedia(e: CustomEvent) {
    const mediaId = parseInt(e.detail.item.id, 10)
    const taxonId = this.taxon.getId()
    this.savingLabel.saving()
    this.matrixModel
      .removeTaxonMedia(taxonId, mediaId)
      .then(() => {
        this.setMediaInGrid()
        this.mediaGrid.redraw()
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /** Sets the media the in media grid */
  setMediaInGrid() {
    this.mediaGrid.clear()
    const taxonMedia = this.taxon.getMedia()
    for (let x = 0; x < taxonMedia.length; x++) {
      const taxonMedium = taxonMedia[x]
      const mediaItem = {
        id: taxonMedium.getMediaId(),
        image: taxonMedium.getTiny(),
      } as MediaGridItem
      this.mediaGrid.addItem(mediaItem)
    }
  }

  /**
   * Handles events when the open media automatically checkbox is changed.
   */
  protected handleMediaCheckboxChange() {
    const isChecked = this.openMediaCheckbox.isChecked()
    const settingStorage = this.matrixModel.getUserMatrixSettings()
    if (isChecked) {
      settingStorage.set(MediaPane.AUTO_OPEN_MEDIA_WINDOW, '1')
      this.handleAddTaxonMedia()
    } else {
      settingStorage.remove(MediaPane.AUTO_OPEN_MEDIA_WINDOW)
    }
  }

  /**
   * Handles the add media event on this taxon.
   */
  private handleAddTaxonMedia() {
    const addMediaDialog = new AddMediaDialog(
      () => this.getTaxonMediaItems(),
      (mediaIds) => this.saveTaxonMediaItems(mediaIds)
    )
    addMediaDialog.setVisible(true)
  }

  /**
   * @return The list of media items which are associated with this
   *		taxon.
   */
  private getTaxonMediaItems(): Promise<MediaGridItem[]> {
    const taxonId = this.taxon.getId()
    return this.matrixModel.loadTaxaMedia(taxonId).then((results) => {
      const mediaItems: MediaGridItem[] = []
      for (let x = 0; x < results.length; x++) {
        const result = results[x]
        const mediaId = parseInt(result['media_id'], 10)
        if (this.taxon.containsMediaId(mediaId)) {
          continue
        }
        const mediaItem = {
          id: mediaId,
          image: result['tiny'],
        } as MediaGridItem
        mediaItems.push(mediaItem)
      }
      return mediaItems
    })
  }

  /**
   * Saves the taxa media
   *
   * @param mediaIds the ids of the media to add to this taxon
   * @return The promise that the media taxa was saved
   */
  private saveTaxonMediaItems(mediaIds: number[]): Promise<void> {
    const taxonId = this.taxon.getId()
    return this.matrixModel.addTaxonMedia([taxonId], mediaIds).then(() => {
      this.setMediaInGrid()
      this.mediaGrid.redraw()
    })
  }

  /**
   * @return The HTML content
   */
  static htmlContent(): string {
    return (
      '<span class="addTaxonMedia">+ Add new</span>' +
      '<span class="openMediaWindow">' +
      '<span class="openMediaWindowCheckbox"></span>' +
      'Automatically open media browser when editing' +
      '</span>' +
      '<div class="mediaPane"></div>'
    )
  }
}

/**
 * Partitions pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxon the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 */
class PartitionsPane extends Component {
  private readonly matrixModel: MatrixModel
  private readonly taxon: Taxon
  private readonly savingLabel: SavingLabel

  private partitions: Partitions
  private partitionGridTable: DataGridTable
  private partitionCheckboxes: Checkbox[]

  constructor(
    matrixModel: MatrixModel,
    taxon: Taxon,
    savingLabel: SavingLabel
  ) {
    super()

    this.matrixModel = matrixModel
    this.taxon = taxon
    this.savingLabel = savingLabel

    this.partitions = this.matrixModel.getPartitions()
    this.partitionGridTable = new DataGridTable()
    this.registerDisposable(this.partitionGridTable)
    this.partitionCheckboxes = []
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('partitionPane')
    this.partitionGridTable.addColumn('&nbsp;')
    this.partitionGridTable.addColumn('Partition')
    this.partitionGridTable.render(element)
    this.setTaxonPartitions()
  }

  /** Render the taxon's partitions */
  setTaxonPartitions() {
    this.partitionGridTable.clearRows()

    // clear out the previous checkboxes
    for (let x = 0; x < this.partitionCheckboxes.length; x++) {
      const checkbox = this.partitionCheckboxes[x]
      checkbox.dispose()
    }
    const handler = this.getHandler()
    const taxonId = this.taxon.getId()
    const partitions = this.partitions.getPartitions()
    const rows: DataRow[] = []
    for (let x = 0; x < partitions.length; x++) {
      const partition = partitions[x]
      const checkbox = new Checkbox(taxonId)
      checkbox.setChecked(partition.containsTaxon(taxonId))
      this.partitionGridTable.registerDisposable(checkbox)
      this.partitionCheckboxes.push(checkbox)
      const row = {
        labels: [checkbox, partition.getName()],
        data: { partitionid: partition.getId() },
      } as DataRow
      rows.push(row)
    }
    this.partitionGridTable.addRows(rows)
    this.partitionGridTable.redraw()

    // Attach listeners after the checkboxes are rendered.
    for (let x = 0; x < partitions.length; x++) {
      const partition = partitions[x]
      const checkbox = this.partitionCheckboxes[x]
      handler.listen(checkbox, EventType.CHANGE, () =>
        this.onPartitionChange(partition.getId(), checkbox)
      )
    }
  }

  /**
   * Change the inclusion of this taxon in the specified partition.
   *
   * @param partitionId the id of the partition to change
   * @param targetCheckbox The echeckbox that was clicked.
   */
  onPartitionChange(partitionId: number, targetCheckbox: Checkbox) {
    // depending on whether the partition checkbox is checked, let's add or remove the taxa to or from the partition.
    const alterTaxaInPartition = targetCheckbox.isChecked()
      ? (partitionId: number, taxaIds: number[]) =>
          this.matrixModel.addTaxaToPartition(partitionId, taxaIds)
      : (partitionId: number, taxaIds: number[]) =>
          this.matrixModel.removeTaxaFromPartition(partitionId, taxaIds)
    const taxonId = this.taxon.getId()
    this.savingLabel.saving()
    alterTaxaInPartition(partitionId, [taxonId])
      .then(() => {
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }
}

/**
 * Access pane
 *
 * @param matrixModel the data associated with the matrix. This includes characters, taxon, and cells.
 * @param taxon the data associated with the matrix.
 * @param savingLabel the saving label associated with this dialog
 */
class AccessPane extends Component {
  private readonly matrixModel: MatrixModel
  private readonly taxon: Taxon
  private readonly savingLabel: SavingLabel

  private projectProperties: ProjectProperties
  private userSelect: Dropdown
  private groupSelect: Dropdown

  constructor(
    matrixModel: MatrixModel,
    taxon: Taxon,
    savingLabel: SavingLabel
  ) {
    super()

    this.matrixModel = matrixModel
    this.taxon = taxon
    this.savingLabel = savingLabel

    this.projectProperties = this.matrixModel.getProjectProperties()
    this.userSelect = new Dropdown()
    this.userSelect.setEnabled(this.projectProperties.getIsAdmin())
    this.registerDisposable(this.userSelect)
    this.groupSelect = new Dropdown()
    this.groupSelect.setEnabled(this.projectProperties.getIsAdmin())
    this.registerDisposable(this.groupSelect)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = AccessPane.htmlContent()
    element.classList.add('mb-access-pane')
    this.groupSelect.addItem({ text: 'None specified', value: 0 })
    this.groupSelect.setSelectedIndex(0)
    const selectedGroupId = this.taxon.getGroupId()
    const groups = this.projectProperties.getGroups()
    for (let x = 0; x < groups.length; x++) {
      const group = groups[x]
      this.groupSelect.addItem({ text: group.getName(), value: group.getId() })
      if (selectedGroupId === group.getId()) {
        this.groupSelect.setSelectedIndex(x + 1)
      }
    }
    const groupSelectElement = this.getElementByClass('group-select')
    this.groupSelect.render(groupSelectElement)
    this.userSelect.addItem({ text: 'All project members', value: 0 })
    this.userSelect.setSelectedIndex(0)
    const selectedUserId = this.taxon.getUserId()
    const members = this.projectProperties.getMembers()
    for (let x = 0; x < members.length; x++) {
      const member = members[x]
      const memberName =
        member.getFirstName() +
        ' ' +
        member.getLastName() +
        ' (' +
        member.getEmail() +
        ')'
      this.userSelect.addItem({ text: memberName, value: member.getId() })
      if (selectedUserId === member.getId()) {
        this.userSelect.setSelectedIndex(x + 1)
      }
    }
    const userSelectElement = this.getElementByClass('user-select')
    this.userSelect.render(userSelectElement)
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    handler
      .listen(this.groupSelect, EventType.CHANGE, () => this.onAccessChange())
      .listen(this.userSelect, EventType.CHANGE, () => this.onAccessChange())
  }

  /** Change the access of the taxon */
  onAccessChange() {
    const taxonId = this.taxon.getId()
    const selectedGroupId = parseInt(this.groupSelect.getSelectedValue(), 10)
    const selectedUserId = parseInt(this.userSelect.getSelectedValue(), 10)
    this.savingLabel.saving()
    this.matrixModel
      .setTaxaAccess([taxonId], selectedUserId, selectedGroupId)
      .then(() => {
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * @return The HTML content of the access pane
   */
  static htmlContent(): string {
    return (
      '' +
      '<div class="header">Limit editing access for a row (taxon) to an individual user or Member Group</div>' +
      '<div class="message">' +
      'To create a Member Group - the Project Administrator must do this from the Project Overview page,' +
      ' under Edit Member Groups' +
      '</div>' +
      '<div class="fields">' +
      '<div class="field">Member Group</div><div class="group-select"></div><br/>' +
      '<div class="field">User</div><div class="user-select"></div><br/>' +
      '</div>'
    )
  }
}
