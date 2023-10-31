export function capitalizeFirstLetter(text: string): string {
  if (text.length == 0) {
    return ''
  }
  return text[0].toLocaleUpperCase() + text.substring(1).toLocaleLowerCase()
}