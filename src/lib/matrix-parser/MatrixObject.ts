export class MatrixObject {
  private dataType: DataType
  private readonly format: string
  private readonly title: Map<string, string>
  private readonly dimensions: { [key: string]: number }
  private readonly parameters: { [key: string]: string }
  private readonly blocks: Block[]

  // Map is used since they maintain insertion order. The key is the character
  // name and taxon name for the character and taxa & cells, respectively.
  private readonly characters: Map<string, Character>
  private readonly taxa: Map<string, Taxon>
  private readonly cells: Map<string, Cell[]>

  constructor(format: string) {
    this.dataType = DataType.REGULAR
    this.format = format
    this.title = new Map()
    this.dimensions = {}
    this.parameters = {}
    this.blocks = []
    this.characters = new Map()
    this.taxa = new Map()
    this.cells = new Map()
  }

  getFormat(): string {
    return this.format
  }

  setDataType(dataType: DataType): void {
    this.dataType = dataType
  }

  setTitle(key: string, title: string): void {
    this.title.set(key, title)
  }

  getTitle(key: string): string | undefined {
    return this.title.get(key)
  }

  setDimensions(key: string, value: number): void {
    this.dimensions[key] = value
  }

  addTaxon(taxonName: string) {
    const isDuplicateTaxon = this.taxa.has(taxonName)
    const serializedTaxonName = this.generateNameWithPostfix(
      taxonName,
      (name: string): boolean => this.taxa.has(name)
    )
    const taxon = new Taxon(serializedTaxonName)
    if (isDuplicateTaxon) {
      taxon.duplicateTaxon = taxonName
    }
    this.taxa.set(serializedTaxonName, taxon)
  }

  getTaxonCount(): number {
    return this.taxa.size
  }

  getCharacterCount(): number {
    return this.characters.size
  }

  getCells(taxonName: string): Cell[] {
    if (!this.cells.has(taxonName)) {
      const cells: Cell[] = []
      this.cells.set(taxonName, cells)
    }
    return this.cells.get(taxonName) as Cell[]
  }

  getCharacters(): Character[] {
    return Array.from(this.characters.values())
  }

  /**
   * Adds a character to the matrix.
   *
   * In order to support duplicate characters, the name may be updated with a
   * postfix. For example, duplicate names of "Homo Sapien" will be renamed to
   * "Homo Sapien - 1" and "Homo Sapien 2".
   *
   * @param characterNumber The number of the character.
   * @param characterName The name of the character.
   * @returns A string indicating the name was was inserted.
   */
  addCharacter(characterNumber: number, characterName: string): string {
    if (characterNumber == null) {
      characterNumber = this.getCharacterCount()
    }
    const isDuplicateCharacter = this.characters.has(characterName)
    const serializedCharacterName = this.generateNameWithPostfix(
      characterName,
      (name: string): boolean => this.characters.has(name)
    )

    const character = new Character(characterNumber, serializedCharacterName)
    character.type = this.determineCharacterType(characterNumber)
    if (isDuplicateCharacter) {
      character.duplicateCharacter = characterName
    }
    this.characters.set(serializedCharacterName, character)
    return serializedCharacterName
  }

  getCharacterNames(): string[] {
    return Array.from(this.characters.values()).map((c) => c.name)
  }

  getTaxaNames(): string[] {
    return Array.from(this.taxa.values()).map((t) => t.name)
  }

  addCharacterState(characterName: string, stateName: string): void {
    const character = this.characters.get(characterName)
    character?.addState(stateName)
  }

  setCharacterOrdering(
    startNumber: number,
    endNumber: number,
    ordering: CharacterOrdering
  ): void {
    const characters = Array.from(this.characters.values())

    if (characters.length < endNumber) {
      setTimeout(
        () => this.setCharacterOrdering(startNumber, endNumber, ordering),
        1000
      )
      return
    }

    for (let x = startNumber; x <= endNumber; x++) {
      const character = characters[x]
      character.ordering = ordering
    }
  }

  setCharacterCostCodes(
    startNumber: number,
    endNumber: number,
    isActive: boolean,
    isAdditive: boolean,
    isSankoff: boolean,
    weight: number
  ) {
    // The current implementation doesn't support fully support CCODEs. It only
    // supports ordering and unordered characters. So let's just set the
    // ordering if the the characters are marked as active.
    const ordering = isActive
      ? CharacterOrdering.ORDERING
      : CharacterOrdering.UNORDERING
    this.setCharacterOrdering(startNumber, endNumber, ordering)
  }

  setCellNote(taxonName: string, characterName: string, note: string): void {
    const row = this.cells.get(taxonName)
    const character = this.characters.get(characterName)
    if (!row || !character) {
      throw 'failed to get row or character'
    }
    const cell = row[character.characterNumber]
    if (!cell) {
      throw 'failed to get cell'
    }
    cell.note = note
  }

  setCharacterStateNote(
    characterName: string,
    stateNumber: number,
    note: string
  ): void {
    const character = this.characters.get(characterName)
    if (character) {
      const state = character.states[stateNumber]
      state.note = note
    }
  }

  setCharacterNote(characterName: string, note: string): void {
    const character = this.characters.get(characterName)
    if (character) {
      character.note = note
    }
  }

  setTaxonNote(taxonName: string, note: string): void {
    const taxon = this.taxa.get(taxonName)
    if (taxon) {
      taxon.note = note
    }
  }

  getParameter(parameter: string): any {
    return this.parameters[parameter]
  }

  setCharacterParameter(parameter: string, value: any): void {
    this.parameters[parameter] = value
  }

  isMeristic(): boolean {
    return this.dataType == DataType.MERISTIC
  }

  addBlock(name: string, content: string) {
    this.blocks.push({
      name: name,
      content: content,
    })
  }

  private generateNameWithPostfix(
    name: string,
    isNameTaken: (name: string) => boolean
  ): string {
    let serializedName = name
    for (let i = 1; isNameTaken(serializedName); i++) {
      serializedName = `${name} - ${i}`
    }
    return serializedName
  }

  private determineCharacterType(characterNumber: number): CharacterType {
    return CharacterType.DISCRETE
  }
}

export class Character {
  characterNumber: number
  name: string
  type: CharacterType
  states: CharacterState[]
  note?: string
  ordering?: CharacterOrdering
  duplicateCharacter?: string
  maxScoredStatePosition: number

  constructor(characterNumber: number, name: string) {
    this.characterNumber = characterNumber
    this.name = name
    this.type = CharacterType.DISCRETE
    this.states = []
    this.maxScoredStatePosition = 0
  }

  addState(stateName: string): CharacterState {
    const state = new CharacterState(stateName)
    this.states.push(state)
    return state
  }

  maybeSetMaxScoreStateIndex(stateIndex: number) {
    if (
      !this.maxScoredStatePosition ||
      this.maxScoredStatePosition < stateIndex
    ) {
      this.maxScoredStatePosition = stateIndex
    }
  }
}

export class Cell {
  // This is the value of the cell. This can be a single value or multiple
  // values.
  score: string
  uncertain?: boolean
  note?: string

  constructor(score: string) {
    if (score == '') {
      debugger
    }
    this.score = score
  }

  toJson(): any {
    if (this.uncertain == undefined || this.note == undefined) {
      return this.score
    }
    const obj: any = {
      score: this.score,
    }
    if (this.uncertain) {
      obj.uncertain = this.uncertain
    }
    if (this.note) {
      obj.note = this.note
    }
    return obj
  }
}

export class Taxon {
  name: string
  note?: string
  extinct: boolean
  duplicateTaxon?: string

  constructor(name: string) {
    this.name = name
  }
}

export class CharacterState {
  readonly name: string
  note?: string
  incompleteType?: CharacterStateIncompleteType

  constructor(name: string) {
    this.name = name
  }
}

export class Block {
  readonly name: string
  readonly content: string

  constructor(name: string, content: string) {
    this.name = name
    this.content = content
  }
}

export enum CharacterStateIncompleteType {
  UNKNOWN,
  CREATED_STATE,
  INCORRECT_NUMBER_OF_SCORES,
  EMPTY_NAME,
  GENERIC_STATE,
}

export enum CharacterType {
  DISCRETE = 0,
  CONTINUOUS = 1,
  MERISTIC = 2,
}

export enum CharacterOrdering {
  ORDERING,
  UNORDERING,
}

export enum DataType {
  REGULAR = 0,
  MERISTIC = 1,
  DNA = 2,
}
