import { describe, expect, test } from '@jest/globals'

import { formatBytes } from '@/utils/format'

describe('FormatUtilTest', () => {
  test('Test formatBytes zero bytes', async () => {
    expect(formatBytes(0)).toBe('0 Bytes')
  })

  test('Test formatBytes one KB', async () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  test('Test formatBytes one MB', async () => {
    const size = Math.pow(1024, 2)
    expect(formatBytes(size)).toBe('1 MB')
  })

  test('Test formatBytes three GB', async () => {
    const size = Math.pow(1024, 3) * 3
    expect(formatBytes(size)).toBe('3 GB')
  })

  test('Test formatBytes TB with precision', async () => {
    const size = Math.pow(1024, 4) * 3.230123123
    expect(formatBytes(size)).toBe('3.23 TB')
  })
})
