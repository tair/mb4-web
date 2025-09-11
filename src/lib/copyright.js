import { apiService } from '@/services/apiService.js'

export async function setCopyRight(projectId, copyright) {
  const response = await apiService.post(`/projects/${projectId}/copyright`, copyright)
  if (!response.ok) {
    const responseData = await response.json()
    throw new Error(responseData?.message || 'Failed to set copyright')
  }
}
