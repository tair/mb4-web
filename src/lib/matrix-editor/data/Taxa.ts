import { ProjectProperties } from './ProjectProperties'
import { AbstractItems } from './AbstractItems'
import { AbstractItem } from './AbstractItems'
import { Media } from './Media'

/**
 * Defines the taxa model for the matrix.
 *
 * @final
 */
export class Taxa extends AbstractItems<Taxon> {
  constructor() {
    super()
  }

  override createItem(obj: Object) {
    return new Taxon(obj)
  }

  /**
   * Whether the user has access to at least one taxon in the matrix
   * @param projectProperties The properties of the project to validate
   * @return Whether the user has access to at least one taxon
   */
  hasAccessToAtleastOneTaxon(projectProperties: ProjectProperties): boolean {
    for (let x = 0; x < this.items.length; x++) {
      const taxon = this.items[x]
      if (taxon.hasAccess(projectProperties)) {
        return true
      }
    }
    return false
  }
}

/**
 * @param obj the json object notation representing the taxon.
 * @struct
 */
export class Taxon extends  AbstractItem {
  private taxonObject: { [key: string]: any }

  /**
   * Mapping of media ids to taxon media
   */
  private taxonMedia: Map<number, TaxonMedia> | null

  constructor(obj: Object) {
    super()

    this.taxonObject = obj
    this.taxonMedia = null
  }

  override getId():number {
    return this.taxonObject['id']
  }

  override getNumber():number {
    return this.taxonObject['r']
  }

  setNumber(position: number) {
    this.taxonObject['r'] = position
  }

  /**
   * Determins whether the user has access to this taxon.
   * @return Whether the user has access to this taxon.
   */
  hasAccess(projectProperties: ProjectProperties): boolean {
    const userId = this.getUserId()
    const groupId = this.getGroupId()
    return (
      !userId ||
      !groupId ||
      userId == projectProperties.getUserId() ||
      projectProperties.isInUserGroup(groupId)
    )
  }

  override getName():string {
    return this.taxonObject['on']
  }

  override getNormalizedName(): string {
    const name = this.getName().toLowerCase().trim()
    return name[0] == '†' ? name.substring(1).trim() : name
  }

  /**
   * @return the Taxon's display name.
   */
  getDisplayName(): string {
    return this.taxonObject['dn']
  }

  /**
   * @return the Taxon's notes.
   */
  getNotes(): string {
    return this.taxonObject['n']
  }

  /**
   * @param notes the new taxon's notes.
   */
  setNotes(notes: string) {
    this.taxonObject['n'] = notes
  }

  /**
   * @return the Taxon's group id
   */
  getGroupId(): number {
    return this.taxonObject['gid']
  }

  /**
   * Sets the taxon group
   * @param groupId the new Taxon's group id
   */
  setGroupId(groupId: number) {
    this.taxonObject['gid'] = groupId
  }

  /**
   * @return the Taxon's user id. This is the user id that has access to the taxa not the user who created the
   * taxa. We should rename this when we remove the Flash-based matrix editor.
   */
  getUserId(): number {
    return this.taxonObject['uid']
  }

  /**
   * @param userId the Taxon's user id. This is the user id that has access to the taxa not the user who created
   * the taxa. We should rename this when we remove the Flash-based matrix editor.
   */
  setUserId(userId: number) {
    this.taxonObject['uid'] = userId
  }

  /**
   * @return whether the taxon has media.
   */
  hasMedia(): boolean {
    return this.taxonMedia != null && this.taxonMedia.size > 0
  }

  /**
   * @return the Taxon's media.
   */
  getMedia(): TaxonMedia[] {
    this.initMedia()
    return Array.from(this.taxonMedia!.values())
  }

  /**
   * Adds a media to the taxon.
   * @param media the media to be affliated with the taxon.
   */
  addMedia(media: TaxonMedia[]) {
    this.initMedia()
    for (let x = 0; x < media.length; x++) {
      const medium = media[x]
      this.taxonMedia!.set(medium.getMediaId(), medium)
    }
  }

  /**
   * Removes a media to the taxon.
   * @param mediaIds the media ids to be unaffliated with the cell.
   */
  removeMedia(mediaIds: number[]) {
    this.initMedia()
    for (let x = 0; x < mediaIds.length; x++) {
      this.taxonMedia!.delete(mediaIds[x])
    }
  }

  /**
   * Gets a media based on its id
   * @param mediaId The id of the media to get
   * @return the one media associated by the media id
   */
  getMediaById(mediaId: number): TaxonMedia | undefined {
    this.initMedia()
    return this.taxonMedia!.get(mediaId)
  }

  /**
   * Checks whether a given media id is a part of the taxon's media
   * @param mediaId The id of the media to check
   * @return whether the taxon has the associated the media id
   */
  containsMediaId(mediaId: number): boolean {
    this.initMedia()
    return this.taxonMedia!.has(mediaId)
  }

  /** initialize the taxon media */
  initMedia() {
    if (this.taxonMedia === null) {
      this.taxonMedia = new Map()
      const media = this.taxonObject['m'] || []
      for (let x = 0; x < media.length; x++) {
        const taxonMedium = new TaxonMedia(media[x])
        this.taxonMedia.set(taxonMedium.getMediaId(), taxonMedium)
      }
    }
  }
}

/**
 * Taxon Media Class
 * @param taxonMediaObj the json representation of a taxon media.
 * @struct
 */
export class TaxonMedia {
  private taxonMediaObj: { [key: string]: any }

  constructor(taxonMediaObj: Object) {
    this.taxonMediaObj = taxonMediaObj || {}
  }

  /**
   * @return The id of the taxon media
   */
  getId(): number {
    return this.taxonMediaObj['link_id']
  }

  /**
   * @return The taxa id of the taxon media
   */
  getTaxonId(): number {
    return this.taxonMediaObj['taxon_id']
  }

  /**
   * @return The media id of the taxon media
   */
  getMediaId(): number {
    return this.taxonMediaObj['media_id']
  }

  /**
   * @return The tiny taxon media
   */
  getTiny(): Media {
    return this.taxonMediaObj['tiny']
  }
}
