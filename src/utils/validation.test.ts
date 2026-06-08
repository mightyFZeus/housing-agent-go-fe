import { describe, expect, it } from 'vitest'
import { validateQuery } from '@/utils/validation'

describe('validateQuery', () => {
  it('trims whitespace', () => {
    const v = validateQuery('  hello  ')
    expect(v.value).toBe('hello')
    expect(v.isValid).toBe(true)
  })

  it('rejects too-short queries', () => {
    const v = validateQuery('a')
    expect(v.isValid).toBe(false)
    expect(v.error).toMatch(/at least 2/i)
  })

  it('rejects too-long queries', () => {
    const long = 'a'.repeat(501)
    const v = validateQuery(long)
    expect(v.isValid).toBe(false)
    expect(v.error).toMatch(/under 500/i)
  })

  it('treats empty input as invalid without an error message', () => {
    const v = validateQuery('   ')
    expect(v.isValid).toBe(false)
    expect(v.error).toBeNull()
  })
})
