import * as mb from '../mb'
import { AbstractItem, AbstractItems } from './AbstractItems'
import { Citation } from './Citation'
import { Media } from './Media'

/**
 * Defines the character model.
 * @struct
 * @final
 */
export class Characters extends AbstractItems<Character> {
  constructor() {
    super()
  }

  override createItem(obj: { [key: string]: any }) {
    return new Character(obj)
  }
}

/**
 * Wrapper to the character object.
 * @param obj the json object notation representing the character.
 * @struct
 */
export class Character extends AbstractItem {
  private characterObject: { [key: string]: any }
  private characterState: Map<number, CharacterState>

  /**
   * Mapping of link ids to cell citations. Initially, a state of undefined means that the citations were never
   * loaded.
   */
  private citations: Map<number, Citation> | null

  /** Mapping of media ids to character media. */
  private characterMedia: Map<number, CharacterMedia> | null

  constructor(obj: { [key: string]: any }) {
    super()

    this.characterObject = obj
    this.characterState = new Map()
    this.citations = null
    this.characterMedia = null

    const states = this.characterObject['s'] || ([] as Object[])
    for (let x = 0; x < states.length; x++) {
      const characterState = new CharacterState(states[x])
      this.characterState.set(characterState.getId(), characterState)
    }
  }

  override getId(): number {
    return this.characterObject['id']
  }

  override getName(): string {
    return this.characterObject['n']
  }

  /**
   * Sets the character's name
   * @param name the character's name.
   */
  setName(name: string) {
    this.characterObject['n'] = name
  }

  override getNumber(): number {
    return this.characterObject['r']
  }

  setNumber(num: number) {
    this.characterObject['r'] = num
  }

  /**
   * @return the character's description.
   */
  getDescription(): string {
    return this.characterObject['d'] || ''
  }

  /**
   * Sets the character's description
   * @param description the character's description.
   */
  setDescription(description: string) {
    this.characterObject['d'] = description
  }

  /**
   * @return the character's ordering.
   */
  getOrdering(): number {
    return this.characterObject['o'] || 0
  }

  /**
   * Sets the character's ordering
   * @param ordering the character's ordering.
   */
  setOrdering(ordering: number) {
    this.characterObject['o'] = ordering
  }

  /**
   * @return the character's type.
   */
  getType(): CharacterType {
    return this.characterObject['t'] || CharacterType.DISCRETE
  }

  /**
   * Sets the character's type
   * @param type the character's type.
   */
  setType(type: CharacterType) {
    this.characterObject['t'] = type
  }

  /**
   * @return the character's last changed on timestamp as an integer.
   */
  getLastChangedOn(): number {
    return this.characterObject['lco'] || 0
  }

  /**
   * Updates the last changed on timestamp
   * @param timestamp the character's last changed on timestamp as an integer.
   */
  setLastChangedOn(timestamp: number) {
    this.characterObject['lco'] = timestamp
  }

  /**
   * @return the character's last scored on timestamp as an integer.
   */
  getLastScoredOn(): number {
    return this.characterObject['lso'] || Number.MAX_VALUE
  }

  /**
   * Updates the last scored on timestamp
   * @param timestamp the character's last scored on timestamp as an integer.
   */
  setLastScoredOn(timestamp: number) {
    this.characterObject['lso'] = timestamp
  }

  /**
   * @return the character's citation count
   */
  getCitationCount(): number {
    return this.characterObject['bc'] || 0
  }

  /**
   * Updates the character's citation count
   * @param count the character's citation count
   */
  setCitationCount(count: number) {
    this.characterObject['bc'] = count
  }

  /**
   * @return the character's comment count.
   */
  getCommentCount(): number {
    return this.characterObject['cc'] || 0
  }

  /**
   * Updates the character's comment count
   * @param count the character's comment count.
   */
  setCommentCount(count: number) {
    this.characterObject['cc'] = count
  }

  /**
   * @return the character's number.
   */
  getUnreadCommentCount(): number {
    return this.characterObject['ucc'] || 0
  }

  /**
   * Updates the unread commend count
   * @param count the character's number.
   */
  setUnreadCommentCount(count: number) {
    this.characterObject['ucc'] = count
  }

  /**
   * Add states to the character
   * @param states The new states of the charater
   */
  setStates(states: CharacterState[]) {
    this.characterState = new Map()
    for (let x = 0; x < states.length; x++) {
      const state = states[x]
      this.characterState.set(state.getId(), state)
    }
  }

  /**
   * @return whether the character has media.
   */
  hasMedia(): boolean {
    return this.characterMedia != null && this.characterMedia.size > 0
  }

  /**
   * @return the character's media.
   */
  getMedia(): CharacterMedia[] {
    this.initMedia()
    return Array.from(this.characterMedia!.values())
  }

  /**
   * Adds a media to the character.
   * @param media the media to be affliated with the character.
   */
  addMedia(media: CharacterMedia[]) {
    this.initMedia()
    for (let x = 0; x < media.length; x++) {
      const medium = media[x]
      this.characterMedia!.set(medium.getMediaId(), medium)
    }
  }

  /**
   * Removes a media to the character.
   * @param mediaIds the media ids to be unaffliated with the character.
   */
  removeMedia(mediaIds: number[]) {
    this.initMedia()
    for (let x = 0; x < mediaIds.length; x++) {
      this.characterMedia!.delete(mediaIds[x])
    }
  }

  /**
   * Gets a media based on its id
   * @param mediaIds the media ids to be unaffliated with the character.
   * @return the one media associated by the media id
   */
  getMediaByIds(mediaIds: number[]): CharacterMedia[] {
    this.initMedia()
    const characterMedia: CharacterMedia[] = []
    for (let x = 0; x < mediaIds.length; x++) {
      const mediaId = mediaIds[x]
      const media = this.characterMedia!.get(mediaId)
      if (media) {
        characterMedia.push(media)
      }
    }
    return characterMedia
  }

  /**
   * Checks whether a given media id is a part of the character's media
   * @param mediaId The id of the media to check
   * @return whether the character has the associated the media id
   */
  containsMediaId(mediaId: number): boolean {
    this.initMedia()
    return this.characterMedia!.has(mediaId)
  }

  /** initialize the character media */
  initMedia() {
    if (this.characterMedia === null) {
      this.characterMedia = new Map()
      const media = this.characterObject['m'] || []
      for (let x = 0; x < media.length; x++) {
        const characterMedium = new CharacterMedia(media[x])
        this.characterMedia.set(characterMedium.getMediaId(), characterMedium)
      }
    }
  }

  /**
   * Returns a copy of the character's states. Changes to the array does not reflect
   * on the character.
   * @return the character's state
   */
  getStates(): CharacterState[] {
    const characterStates: CharacterState[] = []
    this.characterState.forEach(function (characterState) {
      characterStates.push(new CharacterState(characterState.serialize()))
    })
    return characterStates
  }

  /**
   * @param stateId the character state id
   * @return the character state corresponding to the state id.
   */
  getCharacterStateById(stateId: number): CharacterState | null {
    return this.characterState.get(stateId) || null
  }

  /**
   * Sets citations to in the character.
   * @param citations the citations that will be affliated with the character.
   */
  setCitations(citations: Citation[]) {
    this.citations = new Map()
    this.addCitations(citations)
  }

  /**
   * Adds citations to in the character.
   * @param citations the citations that will be affliated with the character.
   */
  addCitations(citations: Citation[]) {
    for (let x = 0; x < citations.length; x++) {
      const citation = citations[x]
      this.citations!.set(citation.getId(), citation)
    }
  }

  /**
   * Clears the citations within a character. This is used to invalidate the cache so that it can be recomputed next time.
   */
  clearCitations() {
    this.citations = null
  }

  /**
   * Removes citations from the character.
   * @param citationIds the ids of the citations affliated with the cell.
   */
  removeCitationById(citationIds: number[]) {
    const length = this.citations ? citationIds.length : 0
    for (let x = 0; x < length; x++) {
      this.citations!.delete(citationIds[x])
    }
  }

  /**
   * @return whether the citations are loaded.
   */
  isCitationsLoaded(): boolean {
    return this.citations !== null
  }

  /**
   * @return the citation affliated with the character.
   */
  getCitations(): Citation[] {
    return this.citations ? Array.from(this.citations.values()) : []
  }

  /**
   * Gets a citation based on its id
   * @param id The id of the citation to get
   * @return the one citation associated by the id
   */
  getCitationById(id: number): Citation | undefined {
    return this.citations ? this.citations.get(id) : undefined
  }

  /**
   * Gets a citation based on the citation id
   * @param citationId The id of the citation to get
   * @return the one citation associated by the citation id
   */
  getCitationsByCitationId(citationId: number): Citation[] {
    const matchingCitations: Citation[] = []
    const citations = this.getCitations()
    for (let x = 0; x < citations.length; x++) {
      const citation = citations[x]
      if (citation.getCitationId() === citationId) {
        matchingCitations.push(citation)
      }
    }
    return matchingCitations
  }
}

/** The type of the character. */
export enum CharacterType {
  DISCRETE = 0,
  CONTINUOUS = 1,
  MERISTIC = 2,
}

/**
 * Wrapper to the character state object.
 * @param stateObj the json object notation representing the character.
 * @struct
 */
export class CharacterState extends AbstractItem {
  private readonly stateObj: {[key:string]: any }

  constructor(stateObj: Object) {
    super()

    this.stateObj = stateObj
  }

  override getId(): number {
    return this.stateObj['id']
  }

  override getNumber(): number {
    return this.stateObj['r']
  }

  setNumber(num: number): void {
    this.stateObj['r'] = num
  }

  override getName(): string {
    return this.stateObj['n']
  }

  /**
   * Sets the character state name
   * @param name the new name of the character state.
   */
  setName(name: string) {
    this.stateObj['n'] = name
  }

  /**
   * @return the character states as a serialized json.
   */
  serialize(): Object {
    return mb.clone(this.stateObj)
  }
}

/**
 * Character Media Class
 * @param characterMediaObj the json representation of a cell.
 * @struct
 */
export class CharacterMedia {
  private readonly characterMediaObj: { [key: string]: any }

  constructor(characterMediaObj: Object) {
    this.characterMediaObj = characterMediaObj
  }

  /**
   * @return The id of the cell media
   */
  getId(): number {
    return this.characterMediaObj['link_id']
  }

  /**
   * @return The character id of the cell media
   */
  getCharacterId(): number {
    return this.characterMediaObj['character_id']
  }

  /**
   * @return The state id of the character media
   */
  getStateId(): number | null {
    return this.characterMediaObj['state_id']
  }

  /**
   * Sets the state id of a character media
   * @param stateId The new state id of the character media
   */
  setStateId(stateId: number | null) {
    this.characterMediaObj['state_id'] = stateId
  }

  /**
   * @return The media id of the character media
   */
  getMediaId(): number {
    return this.characterMediaObj['media_id']
  }

  /**
   * @return The icon tag of the media
   */
  getIcon(): Media {
    return this.characterMediaObj['icon']
  }

  /**
   * @return The tiny url of the media
   */
  getTiny(): Media {
    return this.characterMediaObj['tiny']
  }

  /**
   * @return The small tag of the media
   */
  getSmall(): Media {
    return this.characterMediaObj['small']
  }

  /**
   * @return The large tag of the media
   */
  getMedium(): Media {
    return this.characterMediaObj['large']
  }


}
