import { ref, computed } from 'vue'
import type { PendingSubmission, PendingSubmissions, TimeSegment } from '@/types'

const STORAGE_KEY = 'pendingSubmissions'
const EXPIRY_DAYS = 3
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000 // 3 days in ms

export function usePendingSubmissions() {
  const pending = ref<PendingSubmissions>({})
  const loaded = ref(false)

  // Load from storage and cleanup expired entries
  async function load() {
    const saved = await chrome.storage.local.get(STORAGE_KEY)
    if (saved[STORAGE_KEY]) {
      pending.value = saved[STORAGE_KEY]
      await cleanupExpired()
    }
    loaded.value = true
  }

  // Remove entries older than EXPIRY_DAYS
  async function cleanupExpired() {
    const now = Date.now()
    let hasExpired = false

    for (const key of Object.keys(pending.value)) {
      if (now - pending.value[key].lastUpdated > EXPIRY_MS) {
        delete pending.value[key]
        hasExpired = true
      }
    }

    if (hasExpired) {
      await save()
    }
  }

  // Save to storage
  async function save() {
    await chrome.storage.local.set({ [STORAGE_KEY]: pending.value })
  }

  // Add or update pending submission (accumulates time)
  async function setPending(
    jiraKey: string,
    totalActiveMs: number,
    segments: TimeSegment[]
  ) {
    // Skip if no time tracked at all
    if (totalActiveMs === 0) {
      return
    }

    const existing = pending.value[jiraKey]
    if (existing) {
      // Accumulate time and merge segments
      pending.value[jiraKey] = {
        jiraKey,
        totalActiveMs: existing.totalActiveMs + totalActiveMs,
        segments: [...existing.segments, ...segments],
        lastUpdated: Date.now()
      }
    } else {
      pending.value[jiraKey] = {
        jiraKey,
        totalActiveMs,
        segments,
        lastUpdated: Date.now()
      }
    }
    await save()
  }

  // Remove a pending submission (after successful submit)
  async function removePending(jiraKey: string) {
    delete pending.value[jiraKey]
    await save()
  }

  // Clear all pending
  async function clearAll() {
    pending.value = {}
    await save()
  }

  // Get pending for a specific key
  function getPending(jiraKey: string): PendingSubmission | null {
    return pending.value[jiraKey] || null
  }

  // Get all pending except current jiraKey
  function getOtherPending(currentJiraKey: string): PendingSubmission[] {
    return Object.values(pending.value).filter(p => p.jiraKey !== currentJiraKey)
  }

  // Check if there are any pending submissions (excluding current)
  function hasOtherPending(currentJiraKey: string): boolean {
    return getOtherPending(currentJiraKey).length > 0
  }

  // Format time for display
  function formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${remainingMinutes}m`
    }
  }

  // Total count of pending
  const pendingCount = computed(() => Object.keys(pending.value).length)

  return {
    pending,
    loaded,
    load,
    setPending,
    removePending,
    clearAll,
    getPending,
    getOtherPending,
    hasOtherPending,
    formatTime,
    pendingCount
  }
}
