import { MatrixViewer } from './MatrixViewer'

/**
 * Start the matrix editor.
 * @param properties The properties used by this matrix.
 */
export default function startMatrixViewer(projectId: number, matrixId: number, streaming: boolean, location: string) {
  const viewer = new MatrixViewer(projectId, matrixId, streaming, location)
  viewer.start()
}
