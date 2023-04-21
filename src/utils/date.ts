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
