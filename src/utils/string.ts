export function capitalizeFirstLetter(text: any): string {
  if (text === null || text === undefined) {
    return ''
  }

  if (typeof text !== 'string') {
    try {
      text = String(text)
    } catch (_e) {
      return ''
    }
  }

  if (text.length === 0) {
    return ''
  }

  const firstChar = text[0]
  const rest = text.substring(1)

  const upper = firstChar?.toLocaleUpperCase?.() ?? ''
  const lower = rest?.toLocaleLowerCase?.() ?? ''
  return upper + lower
}

export function countOccurences(text: string, reg: RegExp): number {
  return text.match(reg)?.length || 0
}
