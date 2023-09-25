/**
 * This class represents an HTML5 storage layer with a prefix.
 */
export class PrefixedStorage {
  private prefix: string

  constructor(private readonly storage: Storage, prefix: string) {
    this.prefix = prefix + '::'
  }

  /**
   * Set a value for a key.
   *
   * @param key The key to set.
   * @param value The string to save.
   */
  set(key: string, value: string) {
    this.storage.setItem(this.prefix + key, value)
  }

  /**
   * Get the value stored under a key.
   *
   * @param key The key to get.
   * @return The corresponding value, null if not found.
   */
  get(key: string): string | null {
    return this.storage.getItem(this.prefix + key)
  }

  /**
   * Remove the value stored under a key.
   *
   * @param key The key to remove.
   */
  remove(key: string) {
    return this.storage.removeItem(this.prefix + key)
  }
}
