import * as mb from '../mb'

/**
 * This class encompass users and project information such as the current user, members within the project, groups
 * within the project, actions allowed by the user, the user's preference and other user-specific information.
 *
 * @param userObj the json representation of the user's information.
 */
export class ProjectProperties {
  private readonly userObj: { [key: string]: any }

  /** The user preferences. */
  private preferences: UserPreferences

  /**
   * A mapping of user ids to the member object.
   */
  private members: Map<number, Member>

  /**
   * A mapping of user ids to the group object.
   */
  private groups: Map<number, Group>

  constructor(userObj: { [key: string]: any }) {
    this.userObj = userObj
    this.preferences = new UserPreferences(this.userObj['preferences'])
    this.members = new Map()
    this.groups = new Map()

    // initialize the members field
    const membersObj = this.userObj['members'] || []
    for (let x = 0; x < membersObj.length; x++) {
      const memberObj = membersObj[x]
      const member = new Member(memberObj)
      this.members.set(member.getId(), member)
    }

    // initialize the groups field
    const groupsObj = this.userObj['available_groups'] || []
    for (let x = 0; x < groupsObj.length; x++) {
      const groupObj = groupsObj[x]
      const group = new Group(groupObj)
      this.groups.set(group.getId(), group)
    }
  }

  /**
   * @return the user's id.
   */
  getUserId(): number {
    return this.userObj['user_id']
  }

  /**
   * @return the user's last login time in seconds.
   */
  getLastLogin(): number {
    return this.userObj['last_login']
  }

  /**
   * @return the project's publish status
   */
  getStatus(): number {
    return this.userObj['status']
  }

  /**
   * @return the user id of the creator of the matrix.
   */
  getCreatorId(): number {
    return this.userObj['creator_id']
  }

  /**
   * @return the creation time of the matrix as epoch time.
   */
  getCreationTime(): number {
    return this.userObj['created_on']
  }

  /**
   * @return whether the matrix was uploaded
   */
  wasMatrixUploaded(): boolean {
    const uploadTimes = this.userObj['upload_times'] || []
    return uploadTimes.length > 0
  }

  /**
   * @return the user's id.
   */
  getIsAdmin(): boolean {
    return !!this.userObj['is_admin']
  }

  /**
   * @return the published settings
   */
  getAllowedPublish(): { [key: string]: string | null } {
    return this.userObj['allowable_publish']
  }

  /**
   * @param action type of action to check
   * @return whether the action was allowed
   */
  isActionAllowed(action: string): boolean {
    return (
      this.userObj['allowable_actions'] &&
      mb.contains(this.userObj['allowable_actions'], action)
    )
  }

  /**
   * Set the Users Preferences
   * @param preferences  the user's matrix preferences
   */
  setUserPreferences(preferences: UserPreferences) {
    this.preferences = preferences
  }

  /**
   * @return  the user's matrix preferences
   */
  getUserPreferences(): UserPreferences {
    return this.preferences
  }

  /**
   * Returns the member given his/her id
   * @param id The id of the member
   * @return The member or null
   */
  getMember(id: number): Member | undefined {
    return this.members.get(id)
  }

  /**
   * @return  members of this matrix's project
   */
  getMembers(): Member[] {
    return Array.from(this.members.values())
  }

  /**
   * @return groups within this project
   */
  getGroups(): Group[] {
    return Array.from(this.groups.values())
  }

  /**
   * @return Whether the given group id is a part of the user's group
   */
  isInUserGroup(groupId: number): boolean {
    const userGroups = this.userObj['user_groups'] || []
    return userGroups.includes(groupId)
  }
}

/**
 * MatrixPreferences class
 * @param prefObj the json representation of a user's preference.
 * @struct
 */
export class UserPreferences {
  private prefObj: { [key: string]: any }

  constructor(prefObj: { [key: string]: any }) {
    this.prefObj = prefObj || {}
  }

  /**
   * @return Gets the default numbering mode of the matrix.
   */
  getDefaultNumberingMode(): number {
    return this.prefObj['DEFAULT_NUMBERING_MODE'] || 0
  }

  /**
   * @param b Sets the default numbering mode of the matrix.
   */
  setDefaultNumberingMode(b: number) {
    if (this.getDefaultNumberingMode() !== b) {
      this.prefObj['DEFAULT_NUMBERING_MODE'] = b
    }
  }

  /**
   * @return Gets the view mode of the matrix.
   */
  getMatrixViewMode(): number {
    return this.prefObj['MATRIX_VIEW_MODE'] || 0
  }

  /**
   * @param b Sets the view mode of the matrix.
   */
  setMatrixViewMode(b: number) {
    if (this.getMatrixViewMode() !== b) {
      this.prefObj['MATRIX_VIEW_MODE'] = b
    }
  }

  /**
   * @return Gets the character name display mode of the matrix.
   */
  getCharacterNameDisplayMode(): number {
    return this.prefObj['MATRIX_VIEW_MODE'] || 0
  }

  /**
   * @param b Sets the character name display mode of the matrix.
   */
  setCharacterNameDisplayMode(b: number) {
    if (this.getCharacterNameDisplayMode() !== b) {
      this.prefObj['MATRIX_VIEW_MODE'] = b
    }
  }

  /**
   * @return Gets whether streaming is enabled
   */
  getEnableStreaming(): boolean {
    return !!this.prefObj['ENABLE_STREAMING']
  }

  /**
   * @param b Sets whether streaming should be enabled.
   */
  setEnableStreaming(b: boolean) {
    if (this.getEnableStreaming() !== b) {
      this.prefObj['ENABLE_STREAMING'] = b
    }
  }

  /**
   * @return Gets whether we should load the previous view state.
   */
  getEnableLoadSavedViewState(): boolean {
    return !this.prefObj['DISABLE_LOAD_SAVED_VIEW_STATE']
  }

  /**
   * @param b Sets whether we should load the previous view state.
   */
  setEnableLoadSavedViewState(b: boolean) {
    if (this.getEnableLoadSavedViewState() !== b) {
      this.prefObj['DISABLE_LOAD_SAVED_VIEW_STATE'] = !b
    }
  }

  /**
   * @return serialized object of this instance as an javascript Object
   */
  serialize(): Object {
    return mb.clone(this.prefObj)
  }
}

/**
 * Members class
 * @param memberObj the json representation of the project members.
 * @struct
 */
export class Member {
  private readonly memberObj: {[key:string]:any}

  constructor(memberObj: Object) {
    this.memberObj = memberObj || {}
  }

  /**
   * returns {string} the first name of the member
   */
  getFirstName(): string {
    return this.memberObj['fname']
  }

  /**
   * returns {string} the last name of the member
   */
  getLastName():string {
    return this.memberObj['lname']
  }

  /**
   * returns {string} the email of the member
   */
  getEmail():string {
    return this.memberObj['email']
  }

  /**
   * returns {number} the id of the member
   */
  getId():number {
    return this.memberObj['user_id']
  }
}

/**
 * Group class
 * @param groupObj the json representation of the project group.
 */
class Group {
  private readonly groupObj: {[key:string]:any}

  constructor(groupObj: Object) {
    this.groupObj = groupObj || {}
  }

  /**
   * @return the name of the group
   */
  getName(): string {
    return this.groupObj['group_name']
  }

  /**
   * @return the description of the group
   */
  getDescription(): string {
    return this.groupObj['description']
  }

  /**
   * @return The id of the group
   */
  getId(): number {
    return this.groupObj['group_id']
  }
}
