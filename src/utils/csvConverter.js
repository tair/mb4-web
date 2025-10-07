/**
 * CSV/Excel to NEXUS/TNT Converter Utility
 * 
 * Handles conversion of CSV/Excel files to NEXUS or TNT format
 * by calling the mb4-service backend API (which proxies to mb4-curator).
 */

import { apiService } from '@/services/apiService.js'

/**
 * Convert a CSV or Excel file to NEXUS/TNT format via the backend API
 * 
 * @param {File} file - The CSV or Excel file to convert
 * @param {number} projectId - The project ID for the API endpoint
 * @param {Function} showError - Function to display error notifications
 * @returns {Promise<Object>} The parsed matrix object and conversion result
 * @throws {Error} If conversion or parsing fails
 */
export async function convertCsvToMatrix(file, projectId, showError) {
  try {
    // Call the mb4-service API to convert CSV/Excel to NEX/TNT
    // The backend will proxy this to the curator service
    const formData = new FormData()
    formData.append('csv_file', file)

    const response = await apiService.post(
      `/projects/${projectId}/matrices/convert-csv`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.detail || 'Failed to convert CSV/Excel file')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'CSV/Excel conversion failed')
    }

    // Show any warnings from the conversion
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.warn('CSV conversion warning:', warning)
      })
    }

    // Log conversion details
    console.log(`Converted ${file.name} to ${result.format.toUpperCase()} format`)
    console.log(`Mode: ${result.mode}, Taxa: ${result.ntax}, Characters: ${result.nchar}`)

    // Parse the converted content
    const parser = await import('@/lib/matrix-parser/parseMatrix.ts')
    try {
      const matrixObject = parser.parseMatrix(result.content)
      return {
        matrixObject,
        result
      }
    } catch (parseError) {
      console.error('Parse error details:', parseError)
      console.error('Full content being parsed:', result.content)
      throw new Error(`Failed to parse converted file: ${parseError.message}. The CSV/Excel file may have formatting issues.`)
    }
  } catch (error) {
    console.error('Error converting CSV/Excel:', error)
    if (showError) {
      showError(error.message || 'Failed to convert CSV/Excel file. Please check the file format and try again.')
    }
    throw error
  }
}
