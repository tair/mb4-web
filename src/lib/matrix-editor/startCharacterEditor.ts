import { CharacterEditor } from './CharacterEditor'

/**
 * Start the character editor.
 * @param properties The properties used by this matrix.
 */
export default function startCharacterEditor(
  projectId: number,
  matrixId: number,
  location: string
) {
  const editor = new CharacterEditor(projectId, matrixId, location)
  editor.loadCharacterData()
}
