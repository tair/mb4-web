/**
 * Defines the paritions model.
 * @struct
 */
export class Partitions {
  /**
   * A mapping from parition ids to the Parition
   */
  private readonly partitions: Map<number, Partition>

  constructor() {
    this.partitions = new Map()
  }

  /**
   * Sets the partitions.
   * @param partitionObjs an array of partition objects.
   */
  setPartitions(partitionObjs: Object[]) {
    this.partitions.clear()
    for (let x = 0; x < partitionObjs.length; x++) {
      const partition = new Partition(partitionObjs[x])
      this.partitions.set(partition.getId(), partition)
    }
  }

  /**
   * Gets the partitions.
   * @return an array of partitions
   */
  getPartitions(): Partition[] {
    return Array.from(this.partitions.values()).sort((a, b) => a.getName().localeCompare(b.getName()))
  }

  /**
   * Returns the partition with the given id.
   * @param id the id of the partition.
   * @return the partition that matches the given id.
   */
  getPartition(id: number): Partition | undefined {
    return this.partitions.get(id)
  }

  /**
   * Add a partition.
   * @param partition the partition to add
   */
  addPartition(partition: Partition) {
    return this.partitions.set(partition.getId(), partition)
  }

  /**
   * Remove a partition with the given id.
   * @param id the id of the partition.
   */
  removePartition(id: number) {
    return this.partitions.delete(id)
  }
}

/**
 * Defines the parition model.
 * @param partitionObj the json object notation representing the partition.
 * @struct
 */
export class Partition {
  private readonly partitionObj: { [key: string]: any }

  constructor(partitionObj: Object) {
    this.partitionObj = partitionObj

    // ensure that the characters and taxa are set.
    if (!this.partitionObj['character_ids']) {
      this.partitionObj['character_ids'] = []
    }
    if (!this.partitionObj['taxa_ids']) {
      this.partitionObj['taxa_ids'] = []
    }
  }

  /**
   * @return the id of the partition.
   */
  getId(): number {
    return this.partitionObj['id']
  }

  /**
   * @return the name of the partition.
   */
  getName(): string {
    return this.partitionObj['name']
  }

  /**
   * @param name the name of the partition.
   */
  setName(name: string) {
    this.partitionObj['name'] = name
  }

  /**
   * @return the description of the partition.
   */
  getDescription(): string {
    return this.partitionObj['description']
  }

  /**
   * @param description the description of the partition.
   */
  setDescription(description: string) {
    this.partitionObj['description'] = description
  }

  /**
   * @return the id of the user.
   */
  getUserId(): number {
    return this.partitionObj['user_id']
  }

  /**
   * @return the id of the partition.
   */
  getProjectId(): number {
    return this.partitionObj['project_id']
  }

  /**
   * @return the character ids in the parition
   */
  getCharacterIds(): number[] {
    return this.partitionObj['character_ids']
  }

  /**
   * @param characterIds the character ids in the parition
   */
  setCharacterIds(characterIds: number[]) {
    this.partitionObj['character_ids'] = characterIds
  }

  /**
   * @return the taxa ids in the parition
   */
  getTaxaIds(): number[] {
    return this.partitionObj['taxa_ids']
  }

  /**
   * @param taxaIds the taxa ids in the parition
   */
  setTaxaIds(taxaIds: number[]) {
    this.partitionObj['taxa_ids'] = taxaIds
  }

  /**
   * Determine whether a taxon id is in this partition
   * @param taxonId The taxon id to determine if it is contained in this partition
   * @return Whether the taxon id is in this partition
   */
  containsTaxon(taxonId: number): boolean {
    return this.getTaxaIds().includes(taxonId)
  }

  /**
   * Determine whether a character id is in this partition
   * @param characterId The character id to determine if it is contained in this partition
   * @return Whether the character id is in this partition
   */
  containsCharacter(characterId: number): boolean {
    return this.getCharacterIds().includes(characterId)
  }

  /**
   * Adds characters to the partition
   * @param characterIds ids to add
   */
  addCharactersIds(characterIds: number[]) {
    const currentCharacterIds = this.getCharacterIds()
    for (let x = 0; x < characterIds.length; ++x) {
      const characterId = characterIds[x]
      if (!currentCharacterIds.includes(characterId)) {
        currentCharacterIds.push(characterId)
      }
    }
  }

  /**
   * Remove characters to the partition
   * @param characterIds ids to remove
   */
  removeCharactersIds(characterIds: number[]) {
    const currentCharacterIds = this.getCharacterIds()
    const newCharacterIds: number[] = []
    for (let x = 0; x < currentCharacterIds.length; ++x) {
      const characterId = currentCharacterIds[x]
      if (!characterIds.includes(characterId)) {
        newCharacterIds.push(characterId)
      }
    }
    this.setCharacterIds(newCharacterIds)
  }

  /**
   * Adds taxa to the partition
   * @param taxaIds ids to add
   */
  addTaxaIds(taxaIds: number[]) {
    const currentTaxaIds = this.getTaxaIds()
    for (let x = 0; x < taxaIds.length; ++x) {
      const taxaId = taxaIds[x]
      if (!currentTaxaIds.includes(taxaId)) {
        currentTaxaIds.push(taxaId)
      }
    }
  }

  /**
   * Remove taxa to the partition
   * @param taxaIds ids to remove
   */
  removeTaxaIds(taxaIds: number[]) {
    const currentTaxaIds = this.getTaxaIds()
    const newTaxaIds: number[] = []
    for (let x = 0; x < currentTaxaIds.length; ++x) {
      const taxonId = currentTaxaIds[x]
      if (!taxaIds.includes(taxonId)) {
        newTaxaIds.push(taxonId)
      }
    }
    this.setTaxaIds(newTaxaIds)
  }
}
