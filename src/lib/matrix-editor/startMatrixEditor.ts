import { MatrixEditor } from './MatrixEditor'

/**
 * Start the matrix editor.
 * @param properties The properties used by this matrix.
 */
export default function startMatrixEditor(properties: {
  [key: string]: string
}) {
  const editor = new MatrixEditor(properties)
  editor.start()
}
