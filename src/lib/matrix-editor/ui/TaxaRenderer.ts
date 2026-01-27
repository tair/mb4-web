import { ProjectProperties } from '../data/ProjectProperties'
import { Taxon } from '../data/Taxa'
import { ImageRenderer } from './ImageRenderer'
import * as mb from '../mb'

/**
 * The abstract class that defines how taxa table elements are rendered.
 * @abstract
 */
export abstract class TaxaRenderer {
  protected projectProperties: ProjectProperties
  protected readOnly: boolean
  protected projectId: number | null = null
  protected published: boolean = false

  protected TaxaRenderer() {
    this.readOnly = false
  }

  /**
   * Sets the taxa preferences which are based from the user's preferences. Needed to determine the taxon number starting
   * position.
   * @param properties the new one
   */
  setTaxaPreferences(properties: ProjectProperties) {
    this.projectProperties = properties
  }

  /**
   * Determines whether the matrix should be readonly.
   * @param readOnly whether the matrix should be readonly.
   */
  setReadonly(readOnly: boolean) {
    this.readOnly = readOnly
  }

  /**
   * Sets the project ID for proper media URL building
   * @param projectId The project ID
   */
  setProjectId(projectId: number) {
    this.projectId = projectId
  }

  /**
   * Sets whether this is a published project
   * @param published Whether the project is published
   */
  setPublished(published: boolean) {
    this.published = published
  }

  /**
   * Returns an HTML string representing an empty row.
   */
  createEmptyTaxon(): Element {
    const tr = document.createElement('tr')
    tr.classList.add('empty')
    const td = document.createElement('td')
    td.innerHTML = '&nbsp;'
    tr.appendChild(td)
    return tr
  }

  /**
   * Determine whether the project is published
   */
  isPublished(): boolean {
    return this.projectProperties!.getStatus() === 1
  }

  /**
   * Returns an HTML string representing the taxon row.
   * @abstract
   */
  abstract createTaxon(taxon: Taxon): HTMLElement

  /**
   * Taxon Name HTML
   */
  static NameContent(data: any): string {
    const compositeIcon = data.isComposite
      ? '<span class="composite-indicator" title="Composite taxon (combined from multiple source taxa)">&#x1F4E6;</span> '
      : ''
    return (
      '<span class="name"' +
      (data.title ? 'title="' + mb.htmlEscape(data.title) + '"' : '') +
      '>' +
      (data.access ? '&nbsp;' : '&#128274;') +
      compositeIcon +
      '[' +
      data.number +
      '] ' +
      data.name +
      '</span>'
    )
  }
}

/**
 * The render for taxa numbers.
 */
export class TaxaNameRenderer extends TaxaRenderer {
  constructor() {
    super()
  }

  override createTaxon(taxon: Taxon): HTMLElement {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.dataset['taxonId'] = String(taxon.getId())
    
    // Add composite class for styling
    if (taxon.isComposite()) {
      tr.classList.add('composite-taxon')
    }
    
    td.innerHTML = TaxaRenderer.NameContent({
      access: taxon.hasAccess(this.projectProperties) || this.isPublished(),
      number:
        taxon.getNumber() -
        this.projectProperties!.getUserPreferences().getDefaultNumberingMode(),
      name: taxon.getDisplayName(),
      title: taxon.getName() + '\n\n' + taxon.getNotes(),
      isComposite: taxon.isComposite(),
    })
    tr.appendChild(td)
    return tr
  }
}

/**
 * The render for taxa numbers.
 */
export class TaxaNameImageRenderer extends TaxaRenderer {
  constructor() {
    super()
  }

  override createTaxon(taxon: Taxon): HTMLElement {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.dataset['taxonId'] = String(taxon.getId())
    
    // Add composite class for styling
    if (taxon.isComposite()) {
      tr.classList.add('composite-taxon')
    }
    
    const hasAccess =
      taxon.hasAccess(this.projectProperties) || this.isPublished()
    td.innerHTML = TaxaRenderer.NameContent({
      access: hasAccess,
      number:
        taxon.getNumber() -
        this.projectProperties!.getUserPreferences().getDefaultNumberingMode(),
      name: taxon.getDisplayName(),
      title: taxon.getName() + '\n\n' + taxon.getNotes(),
      isComposite: taxon.isComposite(),
    })
    const media = taxon.getMedia()
    const images = new ImageRenderer('T')
    images.setReadOnly(!hasAccess || this.readOnly)
    
    // Set project ID if available
    if (this.projectId !== null) {
      images.setProjectId(this.projectId)
    }
    
    // Set published status
    images.setPublished(this.published)
    
    // Set cell ID for the first media item (like CellRenderer does)
    if (media.length > 0) {
      const cellId = media[0].getId() // getId() returns link_id for taxa media
      images.setCellId(cellId)
    }
    
    for (let x = 0; x < media.length; x++) {
      const medium = media[x]
      const tiny = medium.getTiny()
      if (tiny) {
        // Use getMediaId() to get actual media file ID, not getId() which returns link ID
        // Pass the full media object data for TIFF detection
        const mediaData = (medium as any).taxonMediaObj || {}
        images.addImage(medium.getMediaId(), tiny['url'], null, mediaData)
      }
    }
    images.render(td)
    tr.appendChild(td)
    return tr
  }
}
