import * as mb from '../mb'

/**
 * MatrixOption class
 * @param optionsObj the json representation of the matrix object.
 * @struct
 */
export class MatrixOptions {
  private optionsObj: { [key: string]: any }

  constructor(optionsObj: { [key: string]: any }) {
    this.optionsObj = optionsObj
  }

  /**
   * @return Whether scores can be overwriten by rules.
   */
  getAllowOverwritingByRules(): number {
    return this.optionsObj['ALLOW_OVERWRITING_BY_RULES'] || 0
  }

  /**
   * @param b whether to have scores overwritten by rules.
   */
  setAllowOverwritingByRules(b: number) {
    if (this.getAllowOverwritingByRules() !== b) {
      this.optionsObj['ALLOW_OVERWRITING_BY_RULES'] = b
    }
  }

  /**
   * @return Whether characters can be applied while scoring.
   */
  getApplyCharacterRulesWhileScoring(): number {
    return this.optionsObj['APPLY_CHARACTERS_WHILE_SCORING'] || 0
  }

  /**
   * @param b set whether characters can be applied while scoring.
   */
  setApplyCharacterRulesWhileScoring(b: number) {
    if (this.getApplyCharacterRulesWhileScoring() !== b) {
      this.optionsObj['APPLY_CHARACTERS_WHILE_SCORING'] = b & 1
    }
  }

  /**
   * @return Gets the default numbering mode of the matrix.
   */
  getDefaultNumberingMode(): number {
    return this.optionsObj['DEFAULT_NUMBERING_MODE'] || 0
  }

  /**
   * @param b Sets the default numbering mode of the matrix.
   */
  setDefaultNumberingMode(b: number) {
    if (this.getDefaultNumberingMode() !== b) {
      this.optionsObj['DEFAULT_NUMBERING_MODE'] = b
    }
  }

  /**
   * @return Whether scoring is disabled.
   */
  getDisableScoring(): number {
    return this.optionsObj['DISABLE_SCORING'] || 0
  }

  /**
   * @param b Sets whether scoring is disabled.
   */
  setDisableScoring(b: number) {
    if (this.getDisableScoring() !== b) {
      this.optionsObj['DISABLE_SCORING'] = b
    }
  }

  /**
   * @return Whether cell media automation is enabled.
   */
  getEnableCellMediaAutomation(): number {
    return this.optionsObj['ENABLE_CELL_MEDIA_AUTOMATION'] || 0
  }

  /**
   * @param b Sets whether cell media automation is enabled.
   */
  setEnableCellMediaAutomation(b: number) {
    if (this.getEnableCellMediaAutomation() !== b) {
      this.optionsObj['ENABLE_CELL_MEDIA_AUTOMATION'] = b
    }
  }

  /**
   * @return Whether the default mult-state score is polymorphic or uncertain.
   */
  getDefaultMultiStateTaxaMode(): number {
    return this.optionsObj['DEFAULT_MULTISTATE_TAXA_MODE'] || 0
  }

  /**
   * @param b Sets whether the default mult-state score is polymorphic or uncertain.
   */
  setDefaultMultiStateTaxaMode(b: number) {
    if (this.getDefaultMultiStateTaxaMode() !== b) {
      this.optionsObj['DEFAULT_MULTISTATE_TAXA_MODE'] = b
    }
  }

  /**
   * @return serialized object of this instance as an javascript Object
   */
  serialize(): Object {
    return mb.clone(this.optionsObj)
  }
}
