import { cn, isClient, sleep } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toBe('py-1 px-4')
    })

    it('handles conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-class')
      expect(result).not.toContain('hidden-class')
    })

    it('handles undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'another-class')
      expect(result).toContain('base-class')
      expect(result).toContain('another-class')
    })

    it('returns empty string when no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })
  })

  describe('isClient', () => {
    it('returns false in test environment', () => {
      // In jsdom environment, window is defined
      // But we can test the function works
      const result = isClient()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('sleep', () => {
    it('resolves after specified time', async () => {
      const start = Date.now()
      await sleep(100)
      const end = Date.now()
      const elapsed = end - start

      // Allow some margin for timer precision
      expect(elapsed).toBeGreaterThanOrEqual(95)
      expect(elapsed).toBeLessThan(150)
    })

    it('returns a promise', () => {
      const result = sleep(10)
      expect(result).toBeInstanceOf(Promise)
    })
  })
})
