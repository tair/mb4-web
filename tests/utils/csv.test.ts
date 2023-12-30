import { describe, expect, test } from '@jest/globals'

import * as csv from '@/utils/csv'

describe('CSVTests', () => {
  test('Test arrayToCsv', () => {
    const books = [
      ['JavaScript: The Good Parts', 'Crockford, Douglas', 2008],
      ['Object-Oriented JavaScript', 'Stefanov, Stoyan', 2008],
      ['Effective JavaScript', 'Herman, David', 2012],
    ]
    const output =
      'JavaScript: The Good Parts,"Crockford, Douglas",2008\n' +
      'Object-Oriented JavaScript,"Stefanov, Stoyan",2008\n' +
      'Effective JavaScript,"Herman, David",2012'
    expect(csv.arrayToCsv(books)).toBe(output)
  })
  test('Test csvToArray', () => {
    const books = [
      ['JavaScript: The Good Parts', 'Crockford, Douglas', 2008],
      ['Object-Oriented JavaScript', 'Stefanov, Stoyan', 2008],
      ['Effective JavaScript', 'Herman, David', 2012],
    ]
    const content =
      'JavaScript: The Good Parts,"Crockford, Douglas",2008\n' +
      'Object-Oriented JavaScript,"Stefanov, Stoyan",2008\n' +
      'Effective JavaScript,"Herman, David",2012'
    expect(csv.csvToArray(content)).toStrictEqual(books)
  })
})
