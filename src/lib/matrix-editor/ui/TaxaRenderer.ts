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
    return (
      '<span class="name"' +
      (data.title ? 'title="' + mb.htmlEscape(data.title) + '"' : '') +
      '>' +
      (data.access ? '&nbsp;' : '&#128274;') +
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
    td.innerHTML = TaxaRenderer.NameContent({
      access: taxon.hasAccess(this.projectProperties) || this.isPublished(),
      number:
        taxon.getNumber() -
        this.projectProperties!.getUserPreferences().getDefaultNumberingMode(),
      name: taxon.getDisplayName(),
      title: taxon.getName() + '\n\n' + taxon.getNotes(),
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
    const hasAccess =
      taxon.hasAccess(this.projectProperties) || this.isPublished()
    td.innerHTML = TaxaRenderer.NameContent({
      access: hasAccess,
      number:
        taxon.getNumber() -
        this.projectProperties!.getUserPreferences().getDefaultNumberingMode(),
      name: taxon.getDisplayName(),
      title: taxon.getName() + '\n\n' + taxon.getNotes(),
    })
    const media = taxon.getMedia()
    const images = new ImageRenderer('T')
    images.setReadOnly(!hasAccess || this.readOnly)
    for (let x = 0; x < media.length; x++) {
      const medium = media[x]
      const tiny = medium.getTiny()
      if (tiny) {
        images.addImage(medium.getId(), tiny['url'])
      }
    }
    images.render(td)
    tr.appendChild(td)
    return tr
  }
}
