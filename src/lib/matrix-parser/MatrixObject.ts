export class MatrixObject {
  private readonly title: Map<string, string>
  private readonly dimensions: Map<string, number>

  // Note that Map and Set maintain insertion order.
  private readonly characters: Map<string, Character>
  private readonly taxa: Map<string, Taxon>
  private readonly cells: Map<string, Cell[]>
  private readonly blocks: Map<string, string>
  private readonly parameters: Map<string, string>

  private dataType: DataType

  constructor() {
    this.title = new Map()
    this.dimensions = new Map()
    this.characters = new Map()
    this.taxa = new Map()
    this.cells = new Map()
    this.blocks = new Map()
    this.parameters = new Map()
    this.dataType = DataType.REGULAR
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
    this.dimensions.set(key, value)
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

  addCharacter(characterNumber: number, characterName: string): void {
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
    // The current implementation doesn't support fully support CCODEs. It only supports ordering
    // and unordered characters. So let's just set the ordering if the the characters are marked
    // as active.
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

  setCharacterParameter(parameter: string, value: any): void {
    this.parameters.set(parameter, value)
  }

  isMeristic(): boolean {
    return this.dataType == DataType.MERISTIC
  }

  addBlock(name: string, content: string) {
    this.blocks.set(name, content)
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
  maxScoredStatePosition?: number

  constructor(characterNumber: number, name: string) {
    this.characterNumber = characterNumber
    this.name = name
    this.type = CharacterType.DISCRETE
    this.states = []
  }

  addState(stateName: string) {
    const state = new CharacterState(stateName)
    this.states.push(state)
  }
}

export class Cell {
  value: string
  uncertain?: boolean
  note?: string

  constructor(value: string, uncertain: boolean = false) {
    this.value = value
    this.uncertain = uncertain
  }
}

export class Taxon {
  name: string
  note?: string
  isExtinct?: boolean
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

export enum CharacterStateIncompleteType {
  UNKNOWN,
  CREATED_STATE,
  INCORRECT_NUMBER_OF_SCORES,
  EMPTY_NAME,
  GENERIC_STATE,
}

export enum CharacterType {
  DISCRETE,
  CONTINUOUS,
  MERISTIC,
}

export enum CharacterOrdering {
  ORDERING,
  UNORDERING,
}

export enum DataType {
  REGULAR,
  DNA,
  MERISTIC,
}
