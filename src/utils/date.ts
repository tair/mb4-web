const DATE_OPTIONS = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
} as const

export function toDateString(epochTimeSecs: number): string {
  const event = new Date(epochTimeSecs * 1000)
  return event.toLocaleString(undefined, DATE_OPTIONS)
}

export function toDMYDateFromTimestamp(timestamp: string): string {
  const date = new Date(Date.parse(timestamp))
  return toDMYDateFromDate(date)
}

export function toDMYDate(epochTimeSecs: number): string {
  const date = new Date(epochTimeSecs * 1000)
  return toDMYDateFromDate(date)
}

export function toISODate(epochTimeSecs: number): string {
  const date = new Date(epochTimeSecs * 1000)

  // Get the year, month, and day components
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  // Assemble the date components into ISO 8601 format (YYYY-MM-DD)
  const isoDate = `${year}-${month}-${day}`

  return isoDate
}

function toDMYDateFromDate(date: Date): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const year = date.getFullYear()
  const month = months[date.getMonth()]
  const day = date.getDate()
  const time = day + ' ' + month + ' ' + year
  return time
}
