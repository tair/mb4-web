import { MatrixEditor } from './MatrixEditor'

/**
 * Start the matrix editor.
 * @param properties The properties used by this matrix.
 */
export default function startMatrixEditor(
  projectId: number,
  matrixId: number,
  streaming: boolean,
  location: string
) {
  const editor = new MatrixEditor(projectId, matrixId, streaming, location)
  editor.start()
}
