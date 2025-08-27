import * as mb from '../../mb'
import { MatrixModel } from '../../MatrixModel'
import { Partition } from '../../data/Partitions'
import * as CharacterChangedEvents from '../../events/CharacterChangedEvent'
import * as TaxaChangedEvents from '../../events/TaxaChangedEvent'
import * as PartitionRefreshedEvent from '../../events/PartitionRefreshedEvent'
import { Dialog } from '../Dialog'
import { DraggableSelect } from '../DraggableSelect'
import { Dropdown } from '../Dropdown'
import { Select } from '../Select'
import { ConfirmDialog } from './ConfirmDialog'
import { ModalDefaultButtons } from '../Modal'
import { EventType, MobileFriendlyClickEventType } from '../Component'
import { EnterNameDescriptionDialog } from './EnterNameDescriptionDialog'

/**
 * Partitions dialog.
 *
 * @param matrixModel the data associated with the matrix.
 */
export class PartitionsDialog extends Dialog {
  /**
   * The confirmation text
   */
  private static readonly textConfirmText =
    'Are you sure you want to remove this partition? This will permanently remove the partition and cannot ' +
    'be undone. Note that deleting a partition does not delete the taxa or characters from the matrix or the ' +
    'database. Only the partition is deleted.'

  protected readonly matrixModel: MatrixModel

  private partitionSelect: Select
  private taxaInPartitionSelect: DraggableSelect
  private charactersInPartitionSelect: DraggableSelect
  private taxaNotInPartitionSelect: DraggableSelect
  private charactersNotInPartitionSelect: DraggableSelect
  private partitionDropdown: Dropdown
  protected selectedPartition: Partition

  constructor(matrixModel: MatrixModel) {
    super()

    this.matrixModel = matrixModel

    this.partitionSelect = new Select()
    this.partitionSelect.setIsRemovable(true)
    this.registerDisposable(this.partitionSelect)

    this.taxaInPartitionSelect = new DraggableSelect()
    this.registerDisposable(this.taxaInPartitionSelect)

    this.charactersInPartitionSelect = new DraggableSelect()
    this.registerDisposable(this.charactersInPartitionSelect)

    this.taxaNotInPartitionSelect = new DraggableSelect()
    this.registerDisposable(this.taxaNotInPartitionSelect)

    this.charactersNotInPartitionSelect = new DraggableSelect()
    this.registerDisposable(this.charactersNotInPartitionSelect)

    this.partitionDropdown = new Dropdown()
    this.registerDisposable(this.partitionDropdown)
  }

  protected override initialize(): void {
    this.setTitle('Partitions')
    this.setContent(PartitionsDialog.htmlContent())
    this.addButton(ModalDefaultButtons.DONE)
  }

  protected override createDom() {
    super.createDom()

    const element = this.getElement()
    element.classList.add('partitionDialog', 'modal-lg')

    const taxaInPartitionElement = this.getElementByClass('partitionTaxaSelect')
    this.taxaInPartitionSelect.render(taxaInPartitionElement)
    const characterInPartitionElement = this.getElementByClass(
      'partitionCharactersSelect'
    )
    this.charactersInPartitionSelect.render(characterInPartitionElement)
    const taxaNotInPartitionElement = this.getElementByClass(
      'availableTaxaSelect'
    )
    this.taxaNotInPartitionSelect.render(taxaNotInPartitionElement)
    const charactersNotInPartition = this.getElementByClass(
      'availableCharactersSelect'
    )
    this.charactersNotInPartitionSelect.render(charactersNotInPartition)

    this.taxaInPartitionSelect.allowFrom(this.taxaNotInPartitionSelect)
    this.charactersInPartitionSelect.allowFrom(
      this.charactersNotInPartitionSelect
    )
    this.taxaNotInPartitionSelect.allowFrom(this.taxaInPartitionSelect)
    this.charactersNotInPartitionSelect.allowFrom(
      this.charactersInPartitionSelect
    )

    const changePartitionElement = this.getElementByClass('changePartition')
    this.partitionDropdown.render(changePartitionElement)

    this.setPartitionSelect()

    const partitionElement = this.getElementByClass('selectPartition')
    this.partitionSelect.render(partitionElement)
  }

  protected override enterDocument() {
    super.enterDocument()

    const addPartitionElement = this.getElementByClass('addPartition')
    const copyPartitonElement = this.getElementByClass('copyPartition')
    this.getHandler()
      .listen(
        this.matrixModel,
        [CharacterChangedEvents.TYPE, TaxaChangedEvents.TYPE],
        () => this.updatePartitionsUI()
      )
      .listen(
        this.taxaInPartitionSelect,
        DraggableSelect.DroppedEventType,
        () => this.handleAddTaxaToPartition()
      )
      .listen(
        this.taxaNotInPartitionSelect,
        DraggableSelect.DroppedEventType,
        () => this.handleRemoveTaxaFromPartition()
      )
      .listen(
        this.charactersInPartitionSelect,
        DraggableSelect.DroppedEventType,
        () => this.handleAddCharactersToPartition()
      )
      .listen(
        this.charactersNotInPartitionSelect,
        DraggableSelect.DroppedEventType,
        () => this.handleRemoveCharactersFromPartition()
      )
      .listen(this.partitionSelect, EventType.CUT, () =>
        this.handlePartitionCut()
      )
      .listen(this.partitionSelect, EventType.SELECT, () =>
        this.handlePartitionSelect()
      )
      .listen(this.partitionSelect, MobileFriendlyClickEventType, () =>
        this.handlePartitionDoubleClick()
      )
      .listen(this.partitionDropdown, EventType.CHANGE, () =>
        this.handlePartitionSet()
      )
      .listen(addPartitionElement, EventType.CLICK, () =>
        this.handleAddPartition()
      )
      .listen(copyPartitonElement, EventType.CLICK, () =>
        this.handleCopyPartition()
      )
      .listen(this.matrixModel, PartitionRefreshedEvent.TYPE, () =>
        this.handlePartitionRefresh()
      )
  }

  /**
   * Gets a selected partition.
   * @return The selected partition.
   */
  private getSelectedPartition(): Partition | undefined {
    const partitionSeletectedValue = this.partitionSelect.getSelectedValue()
    if (partitionSeletectedValue == null) {
      return undefined
    }

    const partitionId = parseInt(partitionSeletectedValue, 10)
    const partitions = this.matrixModel.getPartitions()
    return partitions.getPartition(partitionId)
  }

  /**
   * Sets the selected Partition in the UI.
   */
  private setPartitionSelect() {
    const partitions = this.matrixModel.getPartitions()
    const partitionArrays = partitions.getPartitions()
    this.partitionSelect.clearItems()
    this.partitionDropdown.removeAllItems()
    this.partitionDropdown.addItem({ text: 'No partition, show all', value: 0 })
    const partitionId = this.matrixModel.getCurrentPartitionId()
    let selectedIndex = 0
    for (let x = 0; x < partitionArrays.length; x++) {
      const partition = partitionArrays[x]
      this.partitionSelect.addItem(
        partition.getName(),
        String(partition.getId())
      )
      this.partitionDropdown.addItem({
        text: partition.getName(),
        value: partition.getId(),
      })
      if (partitionId === partition.getId()) {
        selectedIndex = x + 1
      }
    }

    this.partitionDropdown.redraw()
    this.partitionDropdown.setSelectedIndex(selectedIndex)
  }

  /**
   * Handles the add event on the partition.
   */
  private handleAddPartition() {
    const addPartitionDialog = new EnterNameDescriptionDialog(
      'Add Partition',
      (name, description) => this.addPartition(name, description)
    )
    addPartitionDialog.setVisible(true)
  }

  /**
   * Adds a partition.
   * @param name the name of the partition
   * @param description the description of the partition
   */
  private addPartition(name: string, description: string): Promise<void> {
    this.savingLabel.saving()
    return this.matrixModel
      .addPartition(name, description)
      .then(() => {
        this.setPartitionSelect()
        this.partitionSelect.redraw()
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
        throw e
      })
  }

  /**
   * Handles the copy event on the partition.
   */
  private handleCopyPartition() {
    const selectedPartition = this.getSelectedPartition()

    // Check to see if the user has selected a partition to copy
    if (!selectedPartition) {
      alert('Please select a partition to copy.')
      return
    }

    const copyPartitionDialog = new EnterNameDescriptionDialog(
      'Copy Partition',
      (name, description) =>
        this.copyPartition(selectedPartition.getId(), name, description)
    )
    copyPartitionDialog.setVisible(true)
  }

  /**
   * Copies a partition.
   * @param partitionId the id of the partition
   * @param name the name of the partition
   * @param description the description of the partition
   */
  private copyPartition(
    partitionId: number,
    name: string,
    description: string
  ): Promise<void> {
    this.savingLabel.saving()
    return this.matrixModel
      .copyPartition(partitionId, name, description)
      .then(() => {
        this.setPartitionSelect()
        this.partitionSelect.redraw()
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
        throw e
      })
  }

  /**
   * Handles the double click event on the partition.
   */
  private handlePartitionDoubleClick() {
    const selectedPartition = this.getSelectedPartition()
    if (selectedPartition == null) {
      throw 'No Partition Seletected'
    }

    const editPartitionDialog = new EnterNameDescriptionDialog(
      'Edit Partition',
      (name, description) =>
        this.editPartition(selectedPartition.getId(), name, description)
    )
    editPartitionDialog.setVisible(true)
    editPartitionDialog.setName(selectedPartition.getName())
    editPartitionDialog.setDescription(selectedPartition.getDescription())
  }

  /**
   * Edits a partition.
   * @param name the name of the partition
   * @param description the description of the partition
   */
  private editPartition(
    partitionId: number,
    name: string,
    description: string
  ): Promise<void> {
    this.savingLabel.saving()
    return this.matrixModel
      .editPartition(partitionId, name, description)
      .then(() => {
        this.setPartitionSelect()
        this.partitionSelect.redraw()
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
        throw e
      })
  }

  /**
   * Handles the cut event on the partition.
   */
  private handlePartitionCut() {
    const selctedPartitionValue = this.partitionSelect.getSelectedValue()
    if (selctedPartitionValue == null) {
      throw 'Partition no longer exists'
    }

    const partitionId = parseInt(selctedPartitionValue, 10)
    const confirmDialog = new ConfirmDialog(
      'Confirm',
      PartitionsDialog.textConfirmText,
      () => this.deletePartition(partitionId)
    )
    confirmDialog.setVisible(true)
  }

  /**
   * Deletes a partition.
   * @param partitionId the partition to delete
   */
  private deletePartition(partitionId: number) {
    this.savingLabel.saving()
    this.matrixModel
      .removePartition(partitionId)
      .then(() => {
        this.setPartitionSelect()
        this.partitionSelect.redraw()
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * Handles the select event on the partitions.
   */
  private handlePartitionSelect() {
    const selctedPartitionValue = this.partitionSelect.getSelectedValue()
    if (selctedPartitionValue == null) {
      throw 'Partition no longer exists'
    }

    const partitionId = parseInt(selctedPartitionValue, 10)
    const partitions = this.matrixModel.getPartitions()
    const selectedPartition = partitions.getPartition(partitionId)
    if (selectedPartition && selectedPartition !== this.selectedPartition) {
      this.selectedPartition = selectedPartition
      this.updatePartitionsUI()
    }
  }

  /** Updates the partitions UI */
  private updatePartitionsUI() {
    // Nothing to do if none of the partitions is selected
    if (!this.selectedPartition) {
      return
    }
    const userPreferences = this.matrixModel.getUserPreferences()
    const numberingMode = userPreferences.getDefaultNumberingMode()
    const partitionCharacterIds = this.selectedPartition.getCharacterIds()
    const characters = this.matrixModel.getCharacters()

    // clear character items
    this.charactersInPartitionSelect.clearItems()
    this.charactersNotInPartitionSelect.clearItems()

    // set up character items
    for (let x = 0; x < characters.size(); x++) {
      const character = characters.getAt(x)
      const characterId = character.getId()
      const characterName =
        '[' +
        (character.getNumber() - numberingMode) +
        '] ' +
        mb.htmlEscape(character.getName())
      if (mb.contains(partitionCharacterIds, characterId)) {
        this.charactersInPartitionSelect.addItem(characterName, characterId)
      } else {
        this.charactersNotInPartitionSelect.addItem(characterName, characterId)
      }
    }

    // redraw character items
    this.charactersInPartitionSelect.redraw()
    this.charactersNotInPartitionSelect.redraw()
    const partitionTaxaIds = this.selectedPartition.getTaxaIds()
    const taxa = this.matrixModel.getTaxa()

    // Clear taxa items
    this.taxaInPartitionSelect.clearItems()
    this.taxaNotInPartitionSelect.clearItems()

    // set up taxa items
    for (let x = 0; x < taxa.size(); x++) {
      const taxon = taxa.getAt(x)
      const taxonId = taxon.getId()
      const taxonName =
        '[' +
        (taxon.getNumber() - numberingMode) +
        '] ' +
        mb.decodeHTMLEntities(taxon.getName())
      if (mb.contains(partitionTaxaIds, taxonId)) {
        this.taxaInPartitionSelect.addItem(taxonName, taxonId)
      } else {
        this.taxaNotInPartitionSelect.addItem(taxonName, taxonId)
      }
    }

    // redraw taxa items
    this.taxaInPartitionSelect.redraw()
    this.taxaNotInPartitionSelect.redraw()
  }

  /** Refreshes the partitions UI */
  private handlePartitionRefresh() {
    // Select and redraw fetched partition
    this.setPartitionSelect()
    this.partitionSelect.redraw()
  }

  /**
   * Handles the add taxa drop event.
   */
  private handleAddTaxaToPartition() {
    const taxaIdsToAdd = mb.convertToNumberArray(
      this.taxaNotInPartitionSelect.getSelectedValues()
    )
    const partitionId = this.selectedPartition.getId()
    this.savingLabel.saving()
    this.matrixModel
      .addTaxaToPartition(partitionId, taxaIdsToAdd)
      .then(() => {
        this.updatePartitionsUI()
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * Handles the remove taxa drop event.
   */
  private handleRemoveTaxaFromPartition() {
    const taxaIdsToRemove = mb.convertToNumberArray(
      this.taxaInPartitionSelect.getSelectedValues()
    )
    const partitionId = this.selectedPartition.getId()
    this.savingLabel.saving()
    this.matrixModel
      .removeTaxaFromPartition(partitionId, taxaIdsToRemove)
      .then(() => {
        this.updatePartitionsUI()
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * Handles the add taxa drop event.
   */
  private handleAddCharactersToPartition() {
    const charactersIdsToAdd = mb.convertToNumberArray(
      this.charactersNotInPartitionSelect.getSelectedValues()
    )
    const partitionId = this.selectedPartition.getId()
    this.savingLabel.saving()
    this.matrixModel
      .addCharactersToPartition(partitionId, charactersIdsToAdd)
      .then(() => {
        this.updatePartitionsUI()
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * Handles the remove taxa drop event.
   */
  private handleRemoveCharactersFromPartition() {
    const charactersIdsToRemove = mb.convertToNumberArray(
      this.charactersInPartitionSelect.getSelectedValues()
    )
    const partitionId = this.selectedPartition.getId()
    this.savingLabel.saving()
    this.matrixModel
      .removeCharactersFromPartition(partitionId, charactersIdsToRemove)
      .then(() => {
        this.updatePartitionsUI()
        this.savingLabel.saved()
      })
      .catch((e) => {
        alert(e)
        this.savingLabel.failed()
      })
  }

  /**
   * Handles the select taxa combobox event.
   *
   */
  private handlePartitionSet() {
    const partitionId = parseInt(this.partitionDropdown.getSelectedValue(), 10)
    this.matrixModel.setPartitionId(partitionId > 0 ? partitionId : null)
  }

  /**
   * @return The HTML Content
   */
  private static htmlContent(): string {
    return `
      <div class="editPartition">
        <div class="selectPartition">
          <div class="selectPartitionBar">
            <span class="selectPartitionLabel">Partitions</span>
            <span class="addPartition">Add</span>
            <span class="copyPartition">Copy</span>
          </div>
        </div>
        <div class="availableCharactersSelect">
          Characters not in partition</div>
        <div class="partitionCharactersSelect">
          Characters in partition
        </div>
        <div class="availableTaxaSelect">
          Taxa not in partition
        </div>
        <div class="partitionTaxaSelect">
          Taxa in partition
        </div>
        <i>
          Drag and drop characters and taxa to add or remove them from
          partitions.
        </i>
      </div>
      <div class="changePartition">
        <div class="switchParitionLabel">
          Show partition in matrix editor
        </div>
      </div>`
  }
}
