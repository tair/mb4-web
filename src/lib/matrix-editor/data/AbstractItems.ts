/**
 * Defines the abstract model set for the taxa and the characters. This provides common method
 * calls across both of the object models sets.
 */
export abstract class AbstractItems<T extends AbstractItem> {
  /**
   * Items defined by their ordering within the matrix.
   */
  protected items: T[]

  /**
   * A mapping of items ids to the index within the item object.
   */
  protected itemsIds: Map<number, number>

  constructor() {
    this.items = []
    this.itemsIds = new Map()
  }

  /**  Clears the items */
  clear() {
    this.items = []
    this.itemsIds.clear()
  }

  /** Gets the items */
  getAll() {
    return this.items
  }

  /** @return the items in matrix */
  getIds(): number[] {
    return Array.from(this.itemsIds.keys())
  }

  /**
   * Creates an item based from the json.
   *
   * @param obj The json representation of the item
   * @return T The item object
   */
  abstract createItem(obj: Object): T

  /**
   * Sets the items
   * @param objs the array of items objects.
   */
  set(objs: Object[]) {
    this.clear()
    for (let x = 0, l = objs.length; x < l; ++x) {
      const item = this.createItem(objs[x])
      this.items.push(item)
      this.itemsIds.set(item.getId(), x)
    }
  }

  /** @return returns the number of item */
  size(): number {
    return this.items.length
  }

  /**
   * Get the item at the given index.
   * @param index the index to get the item at.
   * @return the item at the given index.
   */
  getAt(index: number): T {
    return this.items[index]
  }

  /**
   * Adds items to this collection.
   * @param items The items to add to the map.
   */
  add(items: T[]) {
    for (let x = 0; x < items.length; x++) {
      const item = items[x]
      const index = this.getIndexById(item.getId())
      if (index === -1) {
        this.items.push(item)
      } else {
        this.items[index] = item
      }
    }
    this.renumber()
  }

  /**
   * Adds the item at the given index.
   *
   * This invalidates the items id mapping therefore that must be reordered
   * after this call.
   *
   * @param item the item to add
   * @param index the index to get the item at.
   */
  private addAtInternal(item: T, index: number) {
    this.items.splice(index, 0, item)
  }

  /**
   * Remove the item at the given index.
   *
   * This invalidates the items id mapping therefore that must be reordered
   * after this call.
   *
   * @param index the index to get the item at.
   * @return the item at the given index.
   */
  private removeAt(index: number): T {
    if (index < 0 && index >= this.size()) {
      throw 'The index is off'
    }
    return this.items.splice(index, 1)[0]
  }

  /**
   * @param id the item's id
   * @return the item object that matches the id
   */
  getById(id: number): T | null {
    const index = this.itemsIds.get(id)
    if (index === undefined) {
      return null
    }
    return this.getAt(index)
  }

  /**
   * Returns the index of the item given its id or -1 if not found.
   * @param id The id of the item
   * @return The index of the item
   */
  getIndexById(id: number): number {
    const index = this.itemsIds.get(id)
    return index === undefined ? -1 : index
  }

  /**
   * Returns the index of the item given its id or -1 if not found.
   * @param id The id of the item
   * @return the index of the item
   */
  findIndexById(id: number): number {
    for (let x = 0; x < this.items.length; x++) {
      const item = this.items[x]
      if (item.getId() === id) {
        return x
      }
    }
    return -1
  }

  /**
   * Returns the items with given ids.
   * @param ids the ids of the items.
   * @return the items that matches the given id.
   */
  getByIds(ids: number[]): T[] {
    const items: T[] = []
    for (let x = 0; x < ids.length; ++x) {
      const index = this.itemsIds.get(ids[x])
      if (index !== undefined) {
        items.push(this.getAt(index))
      }
    }

    // sort the items so that it's order by their rank before returning
    items.sort(AbstractItems.sortNumberComparator)
    return items
  }

  /**
   * Remove items by their ids
   *
   * @param itemsIds The item ids to reorder
   * @return the items that match the ids
   */
  removeByIds(itemsIds: number[]): T[] {
    const item: T[] = []
    for (let x = 0, l = itemsIds.length; x < l; ++x) {
      const index = this.findIndexById(itemsIds[x])
      item.push(this.removeAt(index))
    }
    this.renumber()
    return item
  }

  /**
   * Reorders the items
   *
   * @param items The item ids to reorder
   * @param position The position to move them to.
   */
  addAt(items: T[], position: number) {
    const args: any[] = [position, 0]
    this.items.splice.apply(this.items, args.concat(items))

    // now fix the numbering
    this.renumber()
  }

  /**
   * Reorders the items in the matrix.
   *
   * @param itemsIds The item ids to reorder
   * @param position The position to move them to.
   */
  reorder(itemsIds: number[], position: number) {
    // remove the items from the matrix since they will be reordered.
    for (let x = 0; x < itemsIds.length; x++) {
      const itemId = itemsIds[x]

      // we can't use getTaxonIndexById since it uses a mapping that is changed by this method.
      const index = this.findIndexById(itemId)
      if (index < position) {
        position--
      } else {
        if (index === position) {
          position++
          continue
        }
      }
      const item = this.removeAt(index)
      this.addAtInternal(item, position++)
    }

    // now fix the numberings
    this.renumber()
  }

  /**
   * Renumber the items
   */
  renumber() {
    this.itemsIds.clear()
    for (let x = 0; x < this.items.length; x++) {
      const item = this.items[x]
      item.setNumber(x + 1)
      this.itemsIds.set(item.getId(), x)
    }
  }

  /**
   * Sort the items alphabetically. Mainly for available items.
   */
  sortAlphabetically() {
    this.items.sort(AbstractItems.sortAlphabeticallyComparator)
    this.renumber()
  }

  /**
   * Sort the items ids in order of their number
   * @param itemsIds The item Ids to sort
   */
  sortIds(itemsIds: number[]) {
    itemsIds.sort((a, b) => {
      const itemA = this.getById(a)
      if (!itemA) {
        throw 'Failed to fetch'
      }

      const itemB = this.getById(b)
      if (!itemB) {
        throw 'Failed to fetch'
      }

      return AbstractItems.sortNumberComparator(itemA, itemB)
    })
  }

  /**
   * Name comparator
   * @return compared ordering
   */
  static sortAlphabeticallyComparator(
    a: AbstractItem,
    b: AbstractItem
  ): number {
    const aName = a.getName()
    const bName = b.getName()
    if (aName < bName) {
      return -1
    }
    if (aName > bName) {
      return 1
    }
    return 0
  }

  /**
   * Tame comparator
   * @return compared ordering
   */
  static sortNumberComparator(a: AbstractItem, b: AbstractItem): number {
    const aNumber = a.getNumber()
    const bNumber = b.getNumber()
    if (aNumber < bNumber) {
      return -1
    }
    if (aNumber > bNumber) {
      return 1
    }
    return 0
  }
}

/**
 * This interface is used to describe items within the Matrix Editor. This
 * includes a character, taxon, etc. These are common properties across the
 * ojects.
 */
export interface AbstractItem {
  /**
   * @return The unqiue identifier for this item.
   */
  getId(): number

  /**
   * 
   * @return the items's name.
   */
  getName(): string

  /**
   * Gets the position of the item in relation to other items in this matrix.
   * Currently, the 
   * @return A positive integer for this item.
   */
  getNumber(): number

  /**
   * Updates the position for this item. This solely sets the value. The caller
   * must reorder the items.
   * @param position The new position of this item.
   */
  setNumber(position: number): void
}
