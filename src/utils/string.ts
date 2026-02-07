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

  // Find the first alphabetic character
  let firstAlphaIndex = -1
  for (let i = 0; i < text.length; i++) {
    if (/[a-zA-Z]/.test(text[i])) {
      firstAlphaIndex = i
      break
    }
  }

  // If no alphabetic characters, return the original text
  if (firstAlphaIndex === -1) {
    return text
  }

  // Build the result: prefix + capitalized first alpha + lowercase rest
  const prefix = text.substring(0, firstAlphaIndex)
  const firstAlpha = text[firstAlphaIndex].toLocaleUpperCase()
  const rest = text.substring(firstAlphaIndex + 1).toLocaleLowerCase()

  return prefix + firstAlpha + rest
}

export function countOccurences(text: string, reg: RegExp): number {
  return text.match(reg)?.length || 0
}
