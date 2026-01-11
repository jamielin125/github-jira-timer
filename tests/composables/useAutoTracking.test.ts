import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('useAutoTracking', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should start with tracking disabled', async () => {
      const { useAutoTracking } = await import('@/composables/useAutoTracking')
      const { state } = useAutoTracking()

      expect(state.value.enabled).toBe(false)
      expect(state.value.isTracking).toBe(false)
      expect(state.value.segments).toEqual([])
      expect(state.value.totalActiveMs).toBe(0)
    })
  })

  describe('enable/disable', () => {
    it('should start tracking when enabled', async () => {
      const { useAutoTracking } = await import('@/composables/useAutoTracking')
      const { state, enable } = useAutoTracking()

      enable()

      expect(state.value.enabled).toBe(true)
      expect(state.value.isTracking).toBe(true)
    })

    it('should stop tracking when disabled', async () => {
      const { useAutoTracking } = await import('@/composables/useAutoTracking')
      const { state, enable, disable } = useAutoTracking()

      enable()
      disable()

      expect(state.value.enabled).toBe(false)
      expect(state.value.isTracking).toBe(false)
    })
  })

  describe('idle detection', () => {
    it('should mark as idle after 60 seconds of inactivity', async () => {
      const { useAutoTracking } = await import('@/composables/useAutoTracking')
      const { state, enable } = useAutoTracking()

      enable()

      // Simulate user activity
      document.dispatchEvent(new MouseEvent('mousemove'))

      // Fast forward 60 seconds
      vi.advanceTimersByTime(60000)

      expect(state.value.isTracking).toBe(false)
    })

    it('should reset idle timer on user activity', async () => {
      const { useAutoTracking } = await import('@/composables/useAutoTracking')
      const { state, enable } = useAutoTracking()

      enable()

      // Wait 50 seconds
      vi.advanceTimersByTime(50000)

      // User activity resets timer
      document.dispatchEvent(new MouseEvent('mousemove'))

      // Wait another 50 seconds (total 100s, but timer was reset)
      vi.advanceTimersByTime(50000)

      // Should still be tracking because timer was reset
      expect(state.value.isTracking).toBe(true)
    })
  })

  describe('time segments', () => {
    it('should record active segment when tracking', async () => {
      const { useAutoTracking } = await import('@/composables/useAutoTracking')
      const { state, enable, disable } = useAutoTracking()

      enable()

      // Simulate some time passing with activity
      document.dispatchEvent(new MouseEvent('mousemove'))
      vi.advanceTimersByTime(5000)

      disable()

      expect(state.value.segments.length).toBeGreaterThan(0)
      expect(state.value.segments[0].type).toBe('active')
    })
  })

  describe('visibility change', () => {
    it('should pause tracking when page becomes hidden', async () => {
      const { useAutoTracking } = await import('@/composables/useAutoTracking')
      const { state, enable } = useAutoTracking()

      enable()

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', { value: true, writable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      expect(state.value.isTracking).toBe(false)
    })

    it('should add idle segment when returning from hidden tab', async () => {
      const { useAutoTracking } = await import('@/composables/useAutoTracking')
      const { state, enable } = useAutoTracking()

      enable()

      // Simulate some active time
      document.dispatchEvent(new MouseEvent('mousemove'))
      vi.advanceTimersByTime(5000)

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', { value: true, writable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      // Record the time when hidden
      const hiddenTime = Date.now()

      // Simulate time passing while hidden (e.g., 30 seconds)
      vi.advanceTimersByTime(30000)

      // Simulate page becoming visible again
      Object.defineProperty(document, 'hidden', { value: false, writable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      // Should have segments: [active, idle, active]
      // At least 2 segments (active before hide, could have idle)
      expect(state.value.segments.length).toBeGreaterThanOrEqual(1)

      // Find idle segment
      const idleSegments = state.value.segments.filter(s => s.type === 'idle')

      // Should have at least one idle segment from the tab switch
      expect(idleSegments.length).toBeGreaterThanOrEqual(1)

      // Should be tracking again
      expect(state.value.isTracking).toBe(true)
    })

    it('should create separate active segments after returning from hidden tab', async () => {
      const { useAutoTracking } = await import('@/composables/useAutoTracking')
      const { state, enable } = useAutoTracking()

      enable()

      // First active period
      document.dispatchEvent(new MouseEvent('mousemove'))
      vi.advanceTimersByTime(5000)

      // Hide tab
      Object.defineProperty(document, 'hidden', { value: true, writable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      // Time passes
      vi.advanceTimersByTime(10000)

      // Show tab again
      Object.defineProperty(document, 'hidden', { value: false, writable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      // Second active period
      document.dispatchEvent(new MouseEvent('mousemove'))
      vi.advanceTimersByTime(5000)

      // Hide again to end the segment
      Object.defineProperty(document, 'hidden', { value: true, writable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      // Count active segments - should be at least 2 separate ones
      const activeSegments = state.value.segments.filter(s => s.type === 'active')
      expect(activeSegments.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('total time calculation', () => {
    it('should calculate total active time correctly', async () => {
      const { useAutoTracking } = await import('@/composables/useAutoTracking')
      const { state, enable } = useAutoTracking()

      enable()

      // Simulate 10 seconds of activity
      document.dispatchEvent(new MouseEvent('mousemove'))
      vi.advanceTimersByTime(10000)

      expect(state.value.totalActiveMs).toBeGreaterThanOrEqual(10000)
    })
  })

  describe('reset', () => {
    it('should reset all state', async () => {
      const { useAutoTracking } = await import('@/composables/useAutoTracking')
      const { state, enable, reset } = useAutoTracking()

      enable()
      vi.advanceTimersByTime(5000)

      reset()

      expect(state.value.segments).toEqual([])
      expect(state.value.totalActiveMs).toBe(0)
      expect(state.value.isTracking).toBe(false)
    })
  })
})
