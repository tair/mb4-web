import { countOccurences } from '@/utils/string'

export function arrayToCsv(a: any[]): string {
  const line = []
  for (let i = 0; i < a.length; ++i) {
    const row = a[i]
    const values = []
    for (let j = 0; j < row.length; ++j) {
      values.push(prepField(row[j]))
    }
    line.push(values.join(','))
  }

  return line.join('\n')
}

export function csvToArray(content: string): string[][] {
  let inQuote = false
  let rows = []
  let row = []
  let field = ''
  let fieldQuoted = false

  const delimiter =
    countOccurences(content, /\t/) > countOccurences(content, /\,/) ? '\t' : ','

  for (let i = 0; i < content.length; ++i) {
    const character = content.charAt(i)

    // If we are at a EOF or EOR
    if (inQuote === false && (character === delimiter || character === '\n')) {
      // Add the current field to the current row
      row.push(processField(field.trim(), fieldQuoted))
      // If this is EOR append row to output and flush row
      if (character === '\n') {
        rows.push(row)
        row = []
      }
      // Flush the field buffer
      field = ''
      fieldQuoted = false
    } else {
      // If it's not a ", add it to the field buffer
      if (character !== '"') {
        field += character
      } else {
        if (!inQuote) {
          // We are not in a quote, start a quote
          inQuote = true
          fieldQuoted = true
        } else {
          // Next char is ", this is an escaped "
          if (content.charAt(i + 1) === '"') {
            field += '"'
            ++i
          } else {
            // It's not escaping, so end quote
            inQuote = false
          }
        }
      }
    }
  }

  // Add the last field
  row.push(processField(field.trim(), fieldQuoted))
  rows.push(row)

  return rows
}

function prepField(field: any): string {
  const isInt = /^\d+$/
  const isFloat = /^\d*\.\d+$|^\d+\.\d*$/
  const needsQuoting = /^\s|\s$|,|"|\n/
  if (typeof field == 'string') {
    // Escape any " with double " ("")
    field = field.replace(/"/g, '""')
    // If the field starts or ends with whitespace, contains " or , or a newline or
    // is a string representing a number, quote it.
    if (needsQuoting.test(field) || isInt.test(field) || isFloat.test(field)) {
      field = '"' + field + '"'
    } else if (field === '') {
      field = '""'
    }
  } else if (typeof field == 'number') {
    field = field.toString(10)
  } else if (field === null || field === undefined) {
    field = ''
  } else {
    field = field.toString()
  }
  return field
}

function processField(field: string, fieldQuoted: boolean): any {
  const isInt = /^\d+$/
  const isFloat = /^\d*\.\d+$|^\d+\.\d*$/
  if (fieldQuoted !== true) {
    if (field === '') {
      field = null
    }

    // Convert unquoted numbers to numbers
    if (isInt.test(field) || isFloat.test(field)) {
      return +field
    }
  }
  return field
}
