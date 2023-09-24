import { Character } from '../../data/Characters'
import { Dropdown } from '../Dropdown'
import { Dialog } from '../Dialog'
import { MediaGrid, MediaGridItem } from '../MediaGrid'
import { ModalDefaultButtons } from '../Modal'
import { Component, EventType, KeyCodes } from '../Component'

/**
 * The add media dialog which adds media to a given source
 * @param character the character in which to add the media
 * @param mediaFindFunction function to invoke when searching for a media
 * @param mediaSelectFunction function to invoke with selected media
 * @param characterStateId The id of the character state
 */
export class AddCharacterMediaDialog extends Dialog {
  /**
   * The keys used to identify additional buttons in events.
   */
  private static readonly ButtonKeys = { ADD: 'Add', REFRESH: 'Refresh' }

  /**
   * The keys used to identify additional buttons in events.
   */
  private static readonly ButtonLabels = { ADD: 'Add', REFRESH: 'Refresh' }

  /**
   * The standard buttons (keys associated with captions).
   */
  private static readonly Buttons = {
    ADD: {
      text: AddCharacterMediaDialog.ButtonLabels.ADD,
      key: AddCharacterMediaDialog.ButtonKeys.ADD,
      dismissable: false,
    },
    REFRESH: {
      text: AddCharacterMediaDialog.ButtonLabels.REFRESH,
      key: AddCharacterMediaDialog.ButtonKeys.REFRESH,
      dismissable: false,
    },
  }

  /**
   * The last searched text
   */
  private static lastSearchText: string = ''

  /**
   * The most recent cached search results as json.
   */
  private static mediaItems: { [key: string]: any }[] = []
  private characterStateSelect: Dropdown
  private mediaGrid: MediaGrid
  private loadingElement: Element

  constructor(
    private readonly character: Character,
    private readonly mediaFindFunction: (p1: string) => Promise<Object[]>,
    private readonly mediaSelectFunction: (
      p1: number | null,
      p2: number[]
    ) => Promise<void>,
    private readonly characterStateId: number | null
  ) {
    super()
    this.characterStateSelect = new Dropdown()
    this.registerDisposable(this.characterStateSelect)
    this.mediaGrid = new MediaGrid()
    this.mediaGrid.setEmptyMediaLabel('No media available')
    this.mediaGrid.setSelectable(true)
    this.registerDisposable(this.mediaGrid)
    this.loadingElement = this.getLoadingElement()
    this.setTitle('Add Character Media')
    this.setDisposeOnHide(true)
    this.addButton(ModalDefaultButtons.DONE)
    this.addButton(AddCharacterMediaDialog.Buttons.ADD)
    this.addButton(AddCharacterMediaDialog.Buttons.REFRESH)
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.classList.add('addMediaDialog')
    const contentElement = this.getContentElement()
    contentElement.innerHTML = AddCharacterMediaDialog.htmlContent()
    const mediaInputElement =
      this.getElementByClass<HTMLInputElement>('mediaInput')
    mediaInputElement.value = AddCharacterMediaDialog.lastSearchText
    const mediaPane = this.getElementByClass('addMedia')
    this.mediaGrid.render(mediaPane)
    this.redrawMatrixGrid()
    this.characterStateSelect.addItem({ text: 'character', value: 0 })
    const characterStates = this.character.getStates()
    for (let x = 0; x < characterStates.length; x++) {
      const characterState = characterStates[x]
      const characterStateId = characterState.getId()
      this.characterStateSelect.addItem({
        text: characterState.getName(),
        value: characterStateId,
      })
      if (characterStateId === this.characterStateId) {
        this.characterStateSelect.setSelectedIndex(x)
      }
    }
    const buttonBarElement = this.getElementByClass('mb-characterSelect')
    const textElement = document.createElement('div')
    textElement.classList.add('attachMediaLabel')
    textElement.textContent = 'Attach media to '
    buttonBarElement.appendChild(textElement)
    this.characterStateSelect.render(buttonBarElement)
    this.onGridSelectChange()
    this.onSearchInputKeyUp()
  }

  override enterDocument() {
    super.enterDocument()
    const searchInputElement = this.getElementByClass('mediaInput')
    const findButtonElement = this.getElementByClass('media-find-button')
    this.getHandler()
      .listen(this, EventType.SELECT, (e: CustomEvent<any>) => this.onHandleSelect(e))
      .listen(
        searchInputElement,
        EventType.KEYDOWN,
        (e: KeyboardEvent) => this.onSearchInputKeyDown(e)
      )
      .listen(
        searchInputElement,
        EventType.KEYUP,
        () => this.onSearchInputKeyUp()
      )
      .listen(
        findButtonElement,
        EventType.CLICK,
        () => this.handleFindClick()
      )
      .listen(
        this.mediaGrid,
        EventType.SELECT,
        () => this.onGridSelectChange()
      )
  }

  /**
   * Handles when the users clicks one of the buttons.
   *
   * @param e The event that triggered this callback.
   * @return Whether the event was handled by this method.
   */
  private onHandleSelect(e: CustomEvent): boolean {
    switch (e.detail.key) {
      case AddCharacterMediaDialog.ButtonKeys.ADD:
        this.savingLabel.saving()
        const selectedStateId =
          parseInt(this.characterStateSelect.getSelectedValue(), 10) || null
        const selectedMediaIds = this.mediaGrid.getSelectedIds()
        this.mediaSelectFunction(selectedStateId, selectedMediaIds)
          .then(() => {
            this.savingLabel.saved()
            this.dispose()
          })
          .catch((e) => {
            this.savingLabel.failed()
            alert(e)
          })
        return false
      case AddCharacterMediaDialog.ButtonKeys.REFRESH:
        this.refreshGrid()
        return false
      default:
        return true
    }
  }

  /**
   * Handlers events when for user key down events for the search input field
   * @param e The event that triggerd this callback.
   * @return Whether the event was handled by this method.
   */
  protected onSearchInputKeyDown(e: KeyboardEvent): boolean {
    // Prevent the dialog from receiving the enter keycode which will close it and instead call the given function.
    if (e && e.code === KeyCodes.ENTER) {
      e.preventDefault()
      this.handleFindClick()
      return true
    }
    return false
  }

  /**
   * Handlers events when for user key down events for the search input field.
   * @return Always true, that the event was handled by this method.
   */
  protected onSearchInputKeyUp(): boolean {
    const mediaInputElement =
      this.getElementByClass<HTMLInputElement>('mediaInput')
    const searchInputValue = mediaInputElement.value
    const findButtonElement =
      this.getElementByClass<HTMLButtonElement>('media-find-button')
    findButtonElement.disabled = !searchInputValue.length
    return true
  }

  /**
   * Handles the find button click event.
   *
   */
  protected handleFindClick() {
    const mediaInputElement =
      this.getElementByClass<HTMLInputElement>('mediaInput')
    AddCharacterMediaDialog.lastSearchText = mediaInputElement.value
    this.refreshGrid()
  }

  /**
   * Handles when the grid selection was changed
   */
  protected onGridSelectChange() {
    const shouldEnable = !!this.mediaGrid.getSelectedIds().length
    this.setButtonEnabled(AddCharacterMediaDialog.Buttons.ADD, shouldEnable)
  }

  /** Refresh the media grid */
  refreshGrid() {
    // if the text is empty, don't search for anything
    if (!AddCharacterMediaDialog.lastSearchText) {
      return
    }
    this.mediaGrid.clear()
    this.mediaGrid.redraw(false)
    const contentElement = this.getContentElement()
    contentElement.appendChild(this.loadingElement)
    this.mediaFindFunction(AddCharacterMediaDialog.lastSearchText)
      .then((mediaItems) => {
        AddCharacterMediaDialog.mediaItems = mediaItems
        this.redrawMatrixGrid()
      })
      .catch((e) => alert(e))
      .finally(() => contentElement.removeChild(this.loadingElement))
  }

  /**
   * @return an element which shows a loading indicator.
   */
  getLoadingElement(): Element {
    const loadingElement = document.createElement('div')
    loadingElement.classList.add('loadingMedia')
    const messageElement = document.createElement('div')
    messageElement.textContent = 'Loading media...'
    loadingElement.appendChild(messageElement)
    return loadingElement
  }

  /**
   * Redraws the matrix grid.
   */
  protected redrawMatrixGrid() {
    const mediaItems = AddCharacterMediaDialog.mediaItems
    for (let x = 0; x < mediaItems.length; x++) {
      const mediaItem = mediaItems[x]
      const mediaItemId = parseInt(mediaItem['id'], 10)

      // skip media which are already in the character
      if (this.character.containsMediaId(mediaItemId)) {
        continue
      }
      const characterMediaItem = {
        id: mediaItemId,
        caption: mediaItem['specimen_name'],
        image: mediaItem['icon'],
      } as MediaGridItem
      this.mediaGrid.addItem(characterMediaItem)
    }
    this.mediaGrid.redraw(true)
  }

  /**
   * @return The HTML content of the add media dialog
   */
  static htmlContent(): string {
    return (
      '' +
      '<div class="searchControls">' +
      'Search for ' +
      '<input type="text" class="mediaInput" />' +
      '<button class="media-find-button">Find</button>' +
      '</div>' +
      '<div class="addMedia"></div>' +
      '<div class="mb-characterSelect"></div>'
    )
  }
}
