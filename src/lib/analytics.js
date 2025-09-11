import { apiService } from '@/services/apiService.js'

// Hit types mapping
const HIT_TYPES = {
  PROJECT: 'P', // Project views
  MATRIX: 'X', // Matrix views
  MEDIA: 'M', // Media views
  DOCUMENT: 'D', // Document views
  MEDIA_VIEW: 'V', // Views for media
  FOLIO: 'F', // Folio views
  SPECIMEN: 'S', // Specimen views
  TAXA: 'T', // Taxa views
  BIBLIOGRAPHY: 'B', // Bibliography views
}

// Download types mapping
const DOWNLOAD_TYPES = {
  PROJECT: 'P', // Project downloads
  MATRIX: 'X', // Matrix downloads
  MEDIA: 'M', // Media downloads
  DOCUMENT: 'D', // Document downloads
  CIPRES: 'C', // CIPRES downloads
}

export async function logView({ project_id, hit_type, row_id = null }) {
  try {
    await apiService.post('/analytics/view', {
      project_id,
      hit_type,
      row_id,
    })
  } catch (e) {
    // Optionally log or ignore
    console.error('Failed to log view', e)
  }
}

export async function logDownload({
  project_id,
  download_type,
  row_id = null,
}) {
  try {
    await apiService.post('/analytics/download', {
      project_id,
      download_type,
      row_id,
    })
  } catch (e) {
    // Optionally log or ignore
    console.error('Failed to log download', e)
  }
}

export { HIT_TYPES, DOWNLOAD_TYPES }
