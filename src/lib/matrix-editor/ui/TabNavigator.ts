import { Component, EventType } from './Component'
import { Tab } from 'bootstrap'

/**
 * This is tabbed view of a container.
 */
export class TabNavigator extends Component {
  /**
   * The keys used to identify standard buttons in events.
   */
  private static readonly EventType = {
    SHOW: 'show.bs.tab',
    SHOWN: 'shown.bs.tab',
  }

  private names: string[]
  private tabs: Tab[]
  private tabComponents: Map<string, Component>
  private selectedTabIndex: number

  constructor() {
    super()
    this.names = []
    this.tabs = []
    this.tabComponents = new Map()
    this.selectedTabIndex = 0
  }

  override dispose() {
    this.clearTabs()
    super.dispose()
  }

  override createDom() {
    super.createDom()
    const element = this.getElement()
    element.innerHTML = this.htmlContent()
  }

  override enterDocument() {
    super.enterDocument()
    const handler = this.getHandler()
    const element = this.getElement()
    const tabButtonElements = element.querySelectorAll('button')
    tabButtonElements.forEach((tabButtonElement) => {
      const tab = new Tab(tabButtonElement)
      this.tabs.push(tab)
      handler.listen(tabButtonElement, EventType.CLICK, (event) => {
        event.preventDefault()
        tab.show()
      })
      handler.listen(tabButtonElement, TabNavigator.EventType.SHOW, (event) => {
        const button = event.target
        const key = button.dataset['mbKey']
        const paneId = button.dataset['bsTarget']
        const component = this.tabComponents.get(key)
        const paneElement = element.querySelector(paneId)
        if (component && !component.isInDocument()) {
          // For some reason, bootstrap is not setting class names when the component is rendering.
          paneElement.classList.add('show', 'active')
          component.render(paneElement)
        }
      })
      handler.listen(
        tabButtonElement,
        TabNavigator.EventType.SHOWN,
        (event) => {
          const button = event.target
          const key = button.dataset['mbKey']
          this.handleTabSelect(key)
        }
      )
    })
  }

  protected override finalizeDom() {
    this.updateSelectedTab()
  }

  /**
   * Adds a tab.
   *
   * @param tabName the name of the tab
   * @param tabComponent the component of the tab
   */
  addTab(tabName: string, tabComponent: Component) {
    this.names.push(tabName)
    this.tabComponents.set(tabName, tabComponent)
  }

  /**
   * Clears the tabs and it's content
   */
  clearTabs() {
    // Dispose and clear tab contents
    for (const component of Array.from(this.tabComponents.values())) {
      component.dispose()
    }

    // Clear tabs objects.
    for (const tab of this.tabs) {
      tab.dispose()
    }
    this.tabs = []
    this.tabComponents.clear()
    this.names = []
    const handler = this.getHandler()
    handler.removeAll()
  }

  /**
   * @return Index of the currently selected tab (-1 if none).
   */
  getSelectedTabIndex(): number {
    return this.selectedTabIndex
  }

  /**
   * Selects the tab at the given index.
   * @param index Index of the tab to select (-1 to select none).
   */
  setSelectedTabIndex(index: number) {
    // Ensure that the selected tab is always available.
    const tabCount = this.getTabCount()
    if (tabCount <= index) {
      index = tabCount - 1
    }
    this.selectedTabIndex = index
    this.updateSelectedTab()
  }

  /**
   * @return Number of available tabs.
   */
  private getTabCount(): number {
    return this.names.length
  }

  /**
   * @return Index of the currently selected tab or null if none is selected.
   */
  getSelectedTabComponent<T extends Component>(): T {
    const name = this.names[this.selectedTabIndex]
    return this.tabComponents.get(name) as T
  }

  /**
   * Visually update the selected tab based on the stored selected index.
   */
  private updateSelectedTab() {
    if (this.selectedTabIndex < this.tabs.length) {
      const selectedTab = this.tabs[this.selectedTabIndex]
      selectedTab.show()
    }
  }

  /**
   * Handles when a tab is selected.
   *
   * @param name The name of the tab.
   * @return whether the handler handled this event.
   */
  private handleTabSelect(name: string): boolean {
    const index = this.names.indexOf(name)
    this.setSelectedTabIndex(index)
    this.dispatchEvent(new Event(EventType.SELECT))
    return true
  }

  /**
   * @return The HTML content of the container
   */
  private htmlContent(): string {
    const tabButtons: string[] = []
    const tabPanes: string[] = []
    for (const key of this.names) {
      const id = Component.makeNewId()
      tabButtons.push(
        `<button class="nav-link" id="${id}-tab" data-mb-key="${key}" data-bs-toggle="tab" data-bs-target="#${id}-pane" type="button" role="tab" aria-controls="${id}-pane">${key}</button>`
      )
      tabPanes.push(
        `<div class="tab-pane" id="${id}-pane" role="tabpanel" aria-labelledby="${id}-tab" tabindex="0"></div>`
      )
    }

    let html = '<nav><div class="nav nav-tabs" role="tablist">'
    html += tabButtons.join('')
    html += '</div></nav>'
    html += '<div class="tab-content" id="nav-tab-content">'
    html += tabPanes.join('')
    html += '</div>'
    return html
  }
}
