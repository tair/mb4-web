import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

// Hit types mapping
const HIT_TYPES = {
  PROJECT: 'P',      // Project views
  MATRIX: 'X',       // Matrix views
  MEDIA: 'M',        // Media views
  DOCUMENT: 'D',     // Document views
  MEDIA_VIEW: 'V',   // Views for media
  FOLIO: 'F',        // Folio views
  SPECIMEN: 'S',     // Specimen views
  TAXA: 'T',         // Taxa views
  BIBLIOGRAPHY: 'B'  // Bibliography views
}

export async function logView({ project_id, hit_type, row_id = null }) {
  try {
    await axios.post(`${API_URL}/analytics/view`, { project_id, hit_type, row_id })
  } catch (e) {
    // Optionally log or ignore
    console.error('Failed to log view', e)
  }
}

export async function logDownload({ project_id, download_type, row_id = null }) {
  try {
    await axios.post(`${API_URL}/analytics/download`, { project_id, download_type, row_id })
  } catch (e) {
    // Optionally log or ignore
    console.error('Failed to log download', e)
  }
}

export { HIT_TYPES } 