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

export function toDMYDate(epochTimeSecs: number): string {
  var a = new Date(epochTimeSecs * 1000)
  var months = [
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
  var year = a.getFullYear()
  var month = months[a.getMonth()]
  var date = a.getDate()
  var time = date + ' ' + month + ' ' + year
  return time
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
