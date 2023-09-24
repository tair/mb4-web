import { CharacterEditor } from './CharacterEditor'

/**
 * Start the character editor.
 * @param properties The properties used by this matrix.
 */
export function startCharacterEditor(properties: { [key: string]: string }) {
  const editor = new CharacterEditor(properties)
  editor.loadCharacterData()
}
