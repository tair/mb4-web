import { MatrixViewer } from './MatrixViewer'

/**
 * Start the matrix editor.
 * @param properties The properties used by this matrix.
 */
export function startMatrixViewer(properties: { [key: string]: string }) {
  const viewer = new MatrixViewer(properties)
  viewer.start()
}
