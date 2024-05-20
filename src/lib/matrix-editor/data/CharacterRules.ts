import * as mb from '../mb'

/**
 * Defines the character rules model.
 * @struct
 */
export class CharacterRules {
  public static readonly SET_STATE = 'SET_STATE'
  public static readonly ADD_MEDIA = 'ADD_MEDIA'

  /**
   * Types of sets
   */
  public static ACTIONS: string[] = [
    CharacterRules.SET_STATE,
    CharacterRules.ADD_MEDIA,
  ]

  /**
   * A mapping from action ids to rules.
   */
  private actionIds: Map<number, CharacterRule>

  /**
   * A mapping from character ids to rules ids.
   */
  private characterIds: Map<number, number[]>

  /**
   * A mapping from daughter character ids to rules ids.
   */
  private actionCharacterIds: Map<number, number[]>

  constructor() {
    this.actionIds = new Map()
    this.characterIds = new Map()
    this.actionCharacterIds = new Map()
  }

  /**
   * @return Gets all the rules within the matrix.
   */
  getRules(): CharacterRule[] {
    return Array.from(this.actionIds.values())
  }

  /**
   * Sets the characters rules
   * @param ruleObjs an array of character objects.
   */
  setRules(ruleObjs: Object[]) {
    this.actionIds.clear()
    this.characterIds.clear()
    this.actionCharacterIds.clear()
    const length = ruleObjs ? ruleObjs.length : 0
    for (let x = 0; x < length; x++) {
      const rule = new CharacterRule(ruleObjs[x])
      this.addRuleAction(rule)
    }
  }

  /**
   * Gets the state rules of all of the characters
   * @return The rules for this character
   */
  getCharacterStateRulesMapping(): Map<number, Map<number, CharacterRule[]>> {
    // A mapping from mother character ids to character states to daugther character ids, character states
    const motherToDaughterMappings = new Map()
    const rules = this.getRules()
    for (let x = 0; x < rules.length; x++) {
      const rule = rules[x]
      if (!rule.isAction('SET_STATE')) {
        continue
      }
      const characterId = rule.getCharacterId()
      const characterStateId = rule.getStateId()
      let characterMappings = motherToDaughterMappings.get(characterId)
      if (!characterMappings) {
        characterMappings = new Map()
        motherToDaughterMappings.set(characterId, characterMappings)
      }
      const characterStateMappings = characterMappings.get(characterStateId)
      if (!characterStateMappings) {
        characterMappings.set(characterStateId, [rule])
      } else {
        characterStateMappings.push(rule)
      }
    }
    return motherToDaughterMappings
  }

  /**
   * Gets the media rules of all of the characters
   * @return The rules for this character
   */
  getCharacterMediaRulesMapping(): Map<number, CharacterRule[]> {
    // A mapping from mother character ids to character states to daugther character ids, character states
    const motherToDaughterMappings = new Map()
    const rules = this.getRules()
    for (let x = 0; x < rules.length; x++) {
      const rule = rules[x]
      if (!rule.isAction('ADD_MEDIA')) {
        continue
      }
      const characterId = rule.getCharacterId()
      const characterMappings = motherToDaughterMappings.get(characterId)
      if (!characterMappings) {
        motherToDaughterMappings.set(characterId, [rule])
      } else {
        characterMappings.push(rule)
      }
    }
    return motherToDaughterMappings
  }

  /**
   * Gets the rules by the action
   * @param id The action id
   * @return The rules for this character
   */
  getRulesForActionId(id: number): CharacterRule | undefined {
    return this.actionIds.get(id)
  }

  /**
   * Gets the daughter rules of a character
   * @param id The character id
   * @return The daughter rules for this character
   */
  getDaughterRulesForCharacterId(id: number): CharacterRule[] {
    const rules: CharacterRule[] = []

    const characterRuleIds = this.actionCharacterIds.get(id)
    if (characterRuleIds == undefined) {
      return rules
    }

    for (let x = 0; x < characterRuleIds.length; x++) {
      const characterRuleId = characterRuleIds[x]
      const characterRule = this.actionIds.get(characterRuleId)
      if (characterRule) {
        rules.push(characterRule)
      }
    }

    return rules
  }

  /**
   * Gets the rules of a character
   * @param id The character id
   * @return The rules for this character
   */
  getRulesForCharacterId(id: number): CharacterRule[] {
    const rules: CharacterRule[] = []

    const characterRuleIds = this.characterIds.get(id)
    if (!characterRuleIds) {
      return rules
    }

    for (let x = 0; x < characterRuleIds.length; x++) {
      const characterRuleId = characterRuleIds[x]
      const characterRule = this.actionIds.get(characterRuleId)
      if (characterRule) {
        rules.push(characterRule)
      }
    }
    return rules
  }

  /**
   * Determines whether the character has rules
   * @param id The character id
   * @return boolean indicating whether this character has rules
   */
  hasRulesForCharacterId(id: number): boolean {
    return this.characterIds.has(id)
  }

  /**
   * Determines whether the character has rules
   * @param id The character id
   * @return boolean indicating whether this character has rules
   */
  hasParentRulesForCharacterId(id: number): boolean {
    return this.actionCharacterIds.has(id)
  }

  /**
   * Delete rules for a given character ids.
   * @param characterIds The character ids to delete from.
   */
  deleteRulesForCharacterIds(characterIds: number[]) {
    for (let x = 0; x < characterIds.length; ++x) {
      const characterId: number = characterIds[x]
      const ruleCharacterIds: number[] =
        this.characterIds.get(characterId) || []
      const actionCharacterIds: number[] =
        this.actionCharacterIds.get(characterId) || []
      const rulesToDelete = [...ruleCharacterIds, ...actionCharacterIds]
      for (let x = 0; x < rulesToDelete.length; x++) {
        this.removeRuleAction(rulesToDelete[x])
      }
    }
  }

  /**
   * Delete rules with character and state
   * @param characterId The character id to delete from
   * @param stateIds The state id to delete
   */
  deleteRulesForCharacterState(characterId: number, stateIds: number[]) {
    const characterIds: number[] = this.characterIds.get(characterId) || []
    const actionCharacterIds: number[] =
      this.actionCharacterIds.get(characterId) || []
    const characterRules = [...characterIds, ...actionCharacterIds]

    const actionIds = this.actionIds
    const rulesToDelete = characterRules.filter(function (value) {
      const rule = actionIds.get(value)
      return (
        stateIds.indexOf(rule!.getStateId()) !== -1 ||
        stateIds.indexOf(rule!.getActionStateId()) !== -1
      )
    })
    for (let x = 0; x < rulesToDelete.length; x++) {
      this.removeRuleAction(rulesToDelete[x])
    }
  }

  /**
   * Adds a rules to a character
   * @param rule The rule for specified character
   */
  addRuleAction(rule: CharacterRule) {
    const actionId = rule.getActionId()
    this.removeRuleAction(actionId)
    this.actionIds.set(actionId, rule)
    const characterId = rule.getCharacterId()
    if (this.hasRulesForCharacterId(characterId)) {
      const rules = this.characterIds.get(characterId)
      rules!.push(actionId)
    } else {
      this.characterIds.set(characterId, [actionId])
    }
    const actionCharacterId = rule.getActionCharacterId()
    if (this.hasParentRulesForCharacterId(actionCharacterId)) {
      const rules = this.actionCharacterIds.get(actionCharacterId)
      rules!.push(actionId)
    } else {
      this.actionCharacterIds.set(actionCharacterId, [actionId])
    }
  }

  /**
   * Deletes a rule
   * @param actionId The id of the action to remove
   */
  removeRuleAction(actionId: number) {
    const rule = this.actionIds.get(actionId)
    if (!rule) {
      return false
    }
    this.actionIds.delete(actionId)
    const characterId = rule.getCharacterId()
    const rulesForCharacter = this.characterIds.get(characterId) || []
    mb.remove(rulesForCharacter, actionId)
    if (rulesForCharacter.length == 0) {
      this.characterIds.delete(characterId)
    }
    const actionCharacterId = rule.getActionCharacterId()
    const rulesByForActionCharacter =
      this.actionCharacterIds.get(actionCharacterId) || []
    mb.remove(rulesByForActionCharacter, actionId)
    if (rulesByForActionCharacter.length == 0) {
      this.actionCharacterIds.delete(actionCharacterId)
    }
    return true
  }
}

/**
 * Wrapper to the character object.
 * @param obj the json object notation representing the character.
 * @struct
 */
export class CharacterRule {
  private readonly ruleObject: { [key: string]: any }

  constructor(obj: Object) {
    this.ruleObject = obj
  }

  /**
   * @return The action id of the rule
   */
  getActionId(): number {
    return this.ruleObject['ad']
  }

  /**
   * @return The action of the rule
   */
  getAction(): string {
    return this.ruleObject['a']
  }

  /**
   * @param action the type of action that this rule should perform
   * @return true if the action of this character rule is the action given
   */
  isAction(action: string): boolean {
    return this.ruleObject['a'] === action
  }

  /**
   * @return The action character id of the rule
   */
  getActionCharacterId(): number {
    return this.ruleObject['acd']
  }

  /**
   * @return The action state id of the rule
   */
  getActionStateId(): number {
    return this.ruleObject['asd']
  }

  /**
   * @return The owning character id of the rule
   */
  getCharacterId(): number {
    return this.ruleObject['cd']
  }

  /**
   * @return The owning state id of the rule
   */
  getStateId(): number {
    return this.ruleObject['sd']
  }
}
