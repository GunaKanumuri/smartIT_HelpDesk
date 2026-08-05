import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, formatDate, formatRelativeTime, capitalize, truncate } from './utils'

describe('cn', () => {
  it('merges tailwind classes correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4') // tailwind-merge handles overrides
    expect(cn('px-2', false && 'hidden', 'py-1')).toBe('px-2 py-1')
  })
})

describe('formatDate', () => {
  it('formats dates correctly', () => {
    const date = new Date('2026-08-01T10:00:00Z')
    // Result depends on timezone, but checking for core components
    const formatted = formatDate(date)
    expect(formatted).toContain('2026')
    expect(formatted).toContain('Aug 1')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns just now for very recent dates', () => {
    const now = new Date()
    vi.setSystemTime(now)
    expect(formatRelativeTime(now)).toBe('just now')
  })

  it('returns minutes ago', () => {
    const now = new Date()
    const fiveMinsAgo = new Date(now.getTime() - 5 * 60000)
    vi.setSystemTime(now)
    expect(formatRelativeTime(fiveMinsAgo)).toBe('5m ago')
  })

  it('returns hours ago', () => {
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600000)
    vi.setSystemTime(now)
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago')
  })

  it('returns days ago', () => {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)
    vi.setSystemTime(now)
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago')
  })
})

describe('capitalize', () => {
  it('capitalizes the first letter', () => {
    expect(capitalize('hello')).toBe('Hello')
    expect(capitalize('WORLD')).toBe('World')
    expect(capitalize('tEsT')).toBe('Test')
  })
})

describe('truncate', () => {
  it('truncates strings correctly', () => {
    expect(truncate('Hello World', 5)).toBe('Hello…')
    expect(truncate('Short', 10)).toBe('Short')
  })
})
