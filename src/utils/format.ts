export function formatBytes(bytes: number, precision: number = 2): string {
  if (!bytes) {
    return '0 Bytes'
  }
  const k = 1024
  precision = precision < 0 ? 0 : precision
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(precision)) +
    ' ' +
    BYTE_SIZES[i]
  )
}

const BYTE_SIZES = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
