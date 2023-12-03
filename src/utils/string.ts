export function capitalizeFirstLetter(text: string): string {
  if (text.length == 0) {
    return ''
  }
  return text[0].toLocaleUpperCase() + text.substring(1).toLocaleLowerCase()
}

export function countOccurences(text: string, reg: RegExp): number {
  return text.match(reg)?.length || 0
}
