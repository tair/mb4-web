/**
 *  Citation Class
 * @param citationObj The json representation of a citation.
 */
export class Citation {
  private citationObj: { [key: string]: any }

  constructor(citationObj: Object) {
    this.citationObj = citationObj
  }

  /**
   * @return The id of the cell citation
   */
  getId(): number {
    return this.citationObj['link_id']
  }

  /**
   * @return The id of the citation
   */
  getCitationId(): number {
    return this.citationObj['citation_id']
  }

  /**
   * @return The name of the citation
   */
  getName(): string {
    return this.citationObj['name']
  }

  /**
   * @return The notes of the citation
   */
  getNotes(): string {
    return this.citationObj['notes']
  }

  /**
   * Sets the new notes
   * @param notes The notes of the citation
   */
  setNotes(notes: string) {
    this.citationObj['notes'] = notes
  }

  /**
   * @return The pages of the citation
   */
  getPages(): string {
    return this.citationObj['pp']
  }

  /**
   * Sets a new series of pages
   * @param pp The pages of the citation
   */
  setPages(pp: string) {
    this.citationObj['pp'] = pp
  }
}
