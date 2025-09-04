import axios from 'axios'

export async function setCopyRight(projectId, copyright) {
  const url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/copyright`
  const response = await axios.post(url, copyright)
  if (response.status != 200) {
    throw new Error(response.data?.message || 'Failed to set copyright')
  }
}
