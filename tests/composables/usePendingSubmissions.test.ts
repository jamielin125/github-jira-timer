import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePendingSubmissions } from '@/composables/usePendingSubmissions'
import type { PendingSubmission, TimeSegment } from '@/types'

describe('usePendingSubmissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('load', () => {
    it('should load pending submissions from chrome.storage.local', async () => {
      const mockPending: Record<string, PendingSubmission> = {
        'JIRA-123': {
          jiraKey: 'JIRA-123',
          totalActiveMs: 300000, // 5 minutes
          segments: [],
          lastUpdated: Date.now()
        }
      }
      vi.mocked(chrome.storage.local.get).mockResolvedValue({ pendingSubmissions: mockPending })

      const { pending, load } = usePendingSubmissions()
      await load()

      expect(chrome.storage.local.get).toHaveBeenCalledWith('pendingSubmissions')
      expect(pending.value).toEqual(mockPending)
    })

    it('should handle empty storage', async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({})

      const { pending, load, loaded } = usePendingSubmissions()
      await load()

      expect(pending.value).toEqual({})
      expect(loaded.value).toBe(true)
    })
  })

  describe('setPending', () => {
    it('should add a new pending submission', async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({})
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined)

      const { setPending, pending, load } = usePendingSubmissions()
      await load()

      const segments: TimeSegment[] = [
        { start: 1000, end: 2000, type: 'active' }
      ]
      await setPending('JIRA-456', 60000, segments)

      expect(pending.value['JIRA-456']).toBeDefined()
      expect(pending.value['JIRA-456'].jiraKey).toBe('JIRA-456')
      expect(pending.value['JIRA-456'].totalActiveMs).toBe(60000)
      expect(pending.value['JIRA-456'].segments).toEqual(segments)
      expect(chrome.storage.local.set).toHaveBeenCalled()
    })

    it('should update an existing pending submission', async () => {
      const existingPending: Record<string, PendingSubmission> = {
        'JIRA-123': {
          jiraKey: 'JIRA-123',
          totalActiveMs: 60000,
          segments: [],
          lastUpdated: Date.now() - 10000
        }
      }
      vi.mocked(chrome.storage.local.get).mockResolvedValue({ pendingSubmissions: existingPending })
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined)

      const { setPending, pending, load } = usePendingSubmissions()
      await load()

      await setPending('JIRA-123', 120000, [])

      expect(pending.value['JIRA-123'].totalActiveMs).toBe(120000)
    })

    it('should skip if totalActiveMs is 0', async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({})
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined)

      const { setPending, pending, load } = usePendingSubmissions()
      await load()

      await setPending('JIRA-789', 0, [])

      expect(pending.value['JIRA-789']).toBeUndefined()
    })
  })

  describe('removePending', () => {
    it('should remove a pending submission', async () => {
      const existingPending: Record<string, PendingSubmission> = {
        'JIRA-123': {
          jiraKey: 'JIRA-123',
          totalActiveMs: 60000,
          segments: [],
          lastUpdated: Date.now()
        },
        'JIRA-456': {
          jiraKey: 'JIRA-456',
          totalActiveMs: 120000,
          segments: [],
          lastUpdated: Date.now()
        }
      }
      vi.mocked(chrome.storage.local.get).mockResolvedValue({ pendingSubmissions: existingPending })
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined)

      const { removePending, pending, load } = usePendingSubmissions()
      await load()

      await removePending('JIRA-123')

      expect(pending.value['JIRA-123']).toBeUndefined()
      expect(pending.value['JIRA-456']).toBeDefined()
      expect(chrome.storage.local.set).toHaveBeenCalled()
    })
  })

  describe('getPending', () => {
    it('should return pending submission for a specific key', async () => {
      const existingPending: Record<string, PendingSubmission> = {
        'JIRA-123': {
          jiraKey: 'JIRA-123',
          totalActiveMs: 60000,
          segments: [],
          lastUpdated: Date.now()
        }
      }
      vi.mocked(chrome.storage.local.get).mockResolvedValue({ pendingSubmissions: existingPending })

      const { getPending, load } = usePendingSubmissions()
      await load()

      const result = getPending('JIRA-123')

      expect(result).toEqual(existingPending['JIRA-123'])
    })

    it('should return null for non-existent key', async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({})

      const { getPending, load } = usePendingSubmissions()
      await load()

      const result = getPending('JIRA-999')

      expect(result).toBeNull()
    })
  })

  describe('getOtherPending', () => {
    it('should return pending submissions except current jiraKey', async () => {
      const existingPending: Record<string, PendingSubmission> = {
        'JIRA-123': {
          jiraKey: 'JIRA-123',
          totalActiveMs: 60000,
          segments: [],
          lastUpdated: Date.now()
        },
        'JIRA-456': {
          jiraKey: 'JIRA-456',
          totalActiveMs: 120000,
          segments: [],
          lastUpdated: Date.now()
        },
        'JIRA-789': {
          jiraKey: 'JIRA-789',
          totalActiveMs: 180000,
          segments: [],
          lastUpdated: Date.now()
        }
      }
      vi.mocked(chrome.storage.local.get).mockResolvedValue({ pendingSubmissions: existingPending })

      const { getOtherPending, load } = usePendingSubmissions()
      await load()

      const result = getOtherPending('JIRA-123')

      expect(result).toHaveLength(2)
      expect(result.map(p => p.jiraKey)).toContain('JIRA-456')
      expect(result.map(p => p.jiraKey)).toContain('JIRA-789')
      expect(result.map(p => p.jiraKey)).not.toContain('JIRA-123')
    })

    it('should return empty array if no other pending', async () => {
      const existingPending: Record<string, PendingSubmission> = {
        'JIRA-123': {
          jiraKey: 'JIRA-123',
          totalActiveMs: 60000,
          segments: [],
          lastUpdated: Date.now()
        }
      }
      vi.mocked(chrome.storage.local.get).mockResolvedValue({ pendingSubmissions: existingPending })

      const { getOtherPending, load } = usePendingSubmissions()
      await load()

      const result = getOtherPending('JIRA-123')

      expect(result).toHaveLength(0)
    })
  })

  describe('hasOtherPending', () => {
    it('should return true if there are other pending submissions', async () => {
      const existingPending: Record<string, PendingSubmission> = {
        'JIRA-123': {
          jiraKey: 'JIRA-123',
          totalActiveMs: 60000,
          segments: [],
          lastUpdated: Date.now()
        },
        'JIRA-456': {
          jiraKey: 'JIRA-456',
          totalActiveMs: 120000,
          segments: [],
          lastUpdated: Date.now()
        }
      }
      vi.mocked(chrome.storage.local.get).mockResolvedValue({ pendingSubmissions: existingPending })

      const { hasOtherPending, load } = usePendingSubmissions()
      await load()

      expect(hasOtherPending('JIRA-123')).toBe(true)
    })

    it('should return false if no other pending submissions', async () => {
      const existingPending: Record<string, PendingSubmission> = {
        'JIRA-123': {
          jiraKey: 'JIRA-123',
          totalActiveMs: 60000,
          segments: [],
          lastUpdated: Date.now()
        }
      }
      vi.mocked(chrome.storage.local.get).mockResolvedValue({ pendingSubmissions: existingPending })

      const { hasOtherPending, load } = usePendingSubmissions()
      await load()

      expect(hasOtherPending('JIRA-123')).toBe(false)
    })
  })

  describe('formatTime', () => {
    it('should format minutes only', () => {
      const { formatTime } = usePendingSubmissions()

      expect(formatTime(300000)).toBe('5m') // 5 minutes
      expect(formatTime(60000)).toBe('1m')  // 1 minute
      expect(formatTime(2700000)).toBe('45m') // 45 minutes
    })

    it('should format hours only', () => {
      const { formatTime } = usePendingSubmissions()

      expect(formatTime(3600000)).toBe('1h') // 1 hour
      expect(formatTime(7200000)).toBe('2h') // 2 hours
    })

    it('should format hours and minutes', () => {
      const { formatTime } = usePendingSubmissions()

      expect(formatTime(5400000)).toBe('1h 30m') // 1.5 hours
      expect(formatTime(8100000)).toBe('2h 15m') // 2h 15m
    })

    it('should return 0m for zero milliseconds', () => {
      const { formatTime } = usePendingSubmissions()

      expect(formatTime(0)).toBe('0m')
    })
  })

  describe('clearAll', () => {
    it('should clear all pending submissions', async () => {
      const existingPending: Record<string, PendingSubmission> = {
        'JIRA-123': {
          jiraKey: 'JIRA-123',
          totalActiveMs: 60000,
          segments: [],
          lastUpdated: Date.now()
        },
        'JIRA-456': {
          jiraKey: 'JIRA-456',
          totalActiveMs: 120000,
          segments: [],
          lastUpdated: Date.now()
        }
      }
      vi.mocked(chrome.storage.local.get).mockResolvedValue({ pendingSubmissions: existingPending })
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined)

      const { clearAll, pending, load } = usePendingSubmissions()
      await load()

      expect(Object.keys(pending.value)).toHaveLength(2)

      await clearAll()

      expect(pending.value).toEqual({})
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ pendingSubmissions: {} })
    })
  })

  describe('pendingCount', () => {
    it('should return the count of pending submissions', async () => {
      const existingPending: Record<string, PendingSubmission> = {
        'JIRA-123': {
          jiraKey: 'JIRA-123',
          totalActiveMs: 60000,
          segments: [],
          lastUpdated: Date.now()
        },
        'JIRA-456': {
          jiraKey: 'JIRA-456',
          totalActiveMs: 120000,
          segments: [],
          lastUpdated: Date.now()
        }
      }
      vi.mocked(chrome.storage.local.get).mockResolvedValue({ pendingSubmissions: existingPending })

      const { pendingCount, load } = usePendingSubmissions()
      await load()

      expect(pendingCount.value).toBe(2)
    })
  })
})
