import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  fromEvent,
  merge,
  timer,
  Subject,
  Subscription
} from 'rxjs'
import {
  throttleTime,
  switchMap,
  takeUntil,
  tap,
  map
} from 'rxjs/operators'
import type { AutoTrackingState, TimeSegment } from '@/types'
import {
  IDLE_TIMEOUT_MS,
  THROTTLE_MS,
  STORAGE_KEY_TRACKING,
  STORAGE_KEY_PREFERENCE
} from '@/config'

export function useAutoTracking() {
  const state = ref<AutoTrackingState>({
    enabled: false,
    segments: [],
    totalActiveMs: 0,
    isTracking: false
  })

  // Current active segment (for real-time display)
  const currentSegment = ref<TimeSegment | null>(null)

  // The jiraKey associated with current tracking
  const storedJiraKey = ref<string | null>(null)

  // Whether the state has been loaded from storage
  const loaded = ref(false)

  let subscription: Subscription | null = null
  let activeSegmentStart: number | null = null
  let updateInterval: number | null = null
  const stop$ = new Subject<void>()

  // Save state to storage
  async function saveState() {
    try {
      // Ensure segments is a plain array (Chrome storage can serialize arrays as objects)
      const segmentsArray = Array.isArray(state.value.segments)
        ? [...state.value.segments]
        : []

      const data = {
        enabled: state.value.enabled,
        segments: segmentsArray,
        totalActiveMs: state.value.totalActiveMs,
        activeSegmentStart: activeSegmentStart,
        jiraKey: storedJiraKey.value
      }
      await chrome.storage.local.set({ [STORAGE_KEY_TRACKING]: data })
    } catch (error) {
      // Extension context invalidated - ignore
    }
  }

  // Save toggle preference separately (persists across PRs)
  async function savePreference() {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY_PREFERENCE]: { enabled: state.value.enabled } })
    } catch (error) {
      // Extension context invalidated - ignore
    }
  }

  // Load toggle preference
  async function loadPreference(): Promise<boolean> {
    try {
      const saved = await chrome.storage.local.get(STORAGE_KEY_PREFERENCE)
      return saved[STORAGE_KEY_PREFERENCE]?.enabled ?? false
    } catch (error) {
      return false
    }
  }

  // Load state from storage (returns stored jiraKey for comparison)
  async function loadState(): Promise<string | null> {
    try {
      const saved = await chrome.storage.local.get(STORAGE_KEY_TRACKING)

      if (saved[STORAGE_KEY_TRACKING]) {
        const data = saved[STORAGE_KEY_TRACKING]

        // Convert segments from object to array if needed (Chrome storage issue)
        let segments: TimeSegment[] = []
        if (Array.isArray(data.segments)) {
          segments = data.segments
        } else if (data.segments && typeof data.segments === 'object') {
          // Convert object like {"0": {...}, "1": {...}} to array
          segments = Object.values(data.segments) as TimeSegment[]
        }

        state.value.segments = segments

        // Recalculate totalActiveMs from segments to avoid jump on reload
        state.value.totalActiveMs = segments
          .filter(s => s.type === 'active')
          .reduce((sum, s) => sum + (s.end - s.start), 0)

        storedJiraKey.value = data.jiraKey || null

        // Resume tracking if it was enabled
        if (data.enabled) {
          // Restore active segment start time
          if (data.activeSegmentStart) {
            activeSegmentStart = data.activeSegmentStart
          }
          enable(true) // true = resuming from storage
        }
      } else {
        // No existing state - check if user had auto mode enabled before (preference)
        const preferenceEnabled = await loadPreference()
        if (preferenceEnabled) {
          enable(false) // Start fresh tracking
        }
      }
    } catch (error) {
      // Extension context invalidated - ignore
    }
    loaded.value = true
    return storedJiraKey.value
  }

  // Set the current jiraKey for this tracking session
  function setJiraKey(key: string) {
    storedJiraKey.value = key
    saveState()
  }

  // Activity events stream
  const createActivityStream = () => merge(
    fromEvent(document, 'mousemove'),
    fromEvent(document, 'scroll'),
    fromEvent(document, 'keydown'),
    fromEvent(document, 'click'),
    fromEvent(window, 'wheel')
  ).pipe(throttleTime(THROTTLE_MS))

  // Visibility stream
  const createVisibilityStream = () => fromEvent(document, 'visibilitychange').pipe(
    map(() => !document.hidden)
  )

  function startActiveSegment() {
    if (activeSegmentStart === null) {
      activeSegmentStart = Date.now()
      state.value.isTracking = true
      updateCurrentSegment()
      saveState()
    }
  }

  function updateCurrentSegment() {
    if (activeSegmentStart !== null) {
      currentSegment.value = {
        start: activeSegmentStart,
        end: Date.now(),
        type: 'active'
      }
    } else {
      currentSegment.value = null
    }
  }

  function endActiveSegment() {
    if (activeSegmentStart !== null) {
      const now = Date.now()
      const duration = now - activeSegmentStart

      // Ensure segments is an array before pushing
      if (!Array.isArray(state.value.segments)) {
        state.value.segments = []
      }
      state.value.segments.push({
        start: activeSegmentStart,
        end: now,
        type: 'active'
      })

      state.value.totalActiveMs += duration
      activeSegmentStart = null
      state.value.isTracking = false
      currentSegment.value = null
      saveState()
    }
  }

  function startIdleSegment() {
    const now = Date.now()
    const segments = Array.isArray(state.value.segments) ? state.value.segments : []
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      if (lastSegment.type === 'active') {
        if (!Array.isArray(state.value.segments)) {
          state.value.segments = []
        }
        state.value.segments.push({
          start: lastSegment.end,
          end: now,
          type: 'idle'
        })
        saveState()
      }
    }
  }

  function enable(resuming = false) {
    if (state.value.enabled && !resuming) return

    state.value.enabled = true

    if (!resuming) {
      startActiveSegment()
    } else if (activeSegmentStart) {
      // Resuming - update tracking state
      state.value.isTracking = true
      updateCurrentSegment()
    } else {
      startActiveSegment()
    }

    const activity$ = createActivityStream()
    const visibility$ = createVisibilityStream()

    // Main tracking logic
    subscription = activity$.pipe(
      takeUntil(stop$),
      tap(() => {
        if (!state.value.isTracking && state.value.enabled && !document.hidden) {
          startActiveSegment()
        }
      }),
      switchMap(() =>
        timer(IDLE_TIMEOUT_MS).pipe(
          takeUntil(stop$),
          tap(() => {
            endActiveSegment()
            startIdleSegment()
          })
        )
      )
    ).subscribe()

    // Handle visibility changes
    const visibilitySub = visibility$.pipe(
      takeUntil(stop$)
    ).subscribe(isVisible => {
      if (!state.value.enabled) return

      if (isVisible) {
        // Add idle segment for the time spent away
        const segments = Array.isArray(state.value.segments) ? state.value.segments : []
        if (segments.length > 0) {
          const lastSegment = segments[segments.length - 1]
          if (lastSegment.type === 'active') {
            const now = Date.now()
            // Only add idle segment if there's a meaningful gap (> 1 second)
            if (now - lastSegment.end > 1000) {
              if (!Array.isArray(state.value.segments)) {
                state.value.segments = []
              }
              state.value.segments.push({
                start: lastSegment.end,
                end: now,
                type: 'idle'
              })
            }
          }
        }
        startActiveSegment()
      } else {
        endActiveSegment()
      }
    })

    subscription.add(visibilitySub)

    // Update time and current segment every second
    updateInterval = window.setInterval(() => {
      if (activeSegmentStart !== null) {
        const currentDuration = Date.now() - activeSegmentStart
        const segments = Array.isArray(state.value.segments) ? state.value.segments : []
        const pastDuration = segments
          .filter(s => s.type === 'active')
          .reduce((sum, s) => sum + (s.end - s.start), 0)
        state.value.totalActiveMs = pastDuration + currentDuration
        updateCurrentSegment()
      }
    }, 1000)

    saveState()
    savePreference() // Save toggle preference separately
  }

  function disable() {
    state.value.enabled = false
    endActiveSegment()

    stop$.next()

    if (subscription) {
      subscription.unsubscribe()
      subscription = null
    }

    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }

    saveState()
    savePreference() // Save toggle preference separately
  }

  function reset() {
    disable()
    state.value.segments = []
    state.value.totalActiveMs = 0
    currentSegment.value = null
    saveState()
  }

  function toggle() {
    if (state.value.enabled) {
      disable()
    } else {
      enable()
    }
  }

  // All segments including current active one (for timeline display)
  const displaySegments = computed(() => {
    const segments = Array.isArray(state.value.segments) ? state.value.segments : []
    if (currentSegment.value) {
      return [...segments, currentSegment.value]
    }
    return segments
  })

  // Format time for display
  const formattedTime = computed(() => {
    const ms = state.value.totalActiveMs
    const seconds = Math.floor(ms / 1000) % 60
    const minutes = Math.floor(ms / 60000) % 60
    const hours = Math.floor(ms / 3600000)

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  })

  // Convert to Jira time format (e.g., "1h 30m") - seconds are rounded up to minutes
  const jiraTimeFormat = computed(() => {
    const ms = state.value.totalActiveMs
    const minutes = Math.ceil(ms / 60000) // 無條件進位
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else if (remainingMinutes > 0) {
      return `${remainingMinutes}m`
    } else {
      return '1m'
    }
  })

  // Load state on mount
  onMounted(() => {
    loadState()
  })

  onUnmounted(() => {
    // Save but don't disable (so it can resume)
    if (state.value.enabled) {
      saveState()
    }

    if (subscription) {
      subscription.unsubscribe()
    }
    if (updateInterval) {
      clearInterval(updateInterval)
    }
  })

  return {
    state,
    loaded,
    currentSegment,
    displaySegments,
    storedJiraKey,
    enable,
    disable,
    toggle,
    reset,
    loadState,
    setJiraKey,
    formattedTime,
    jiraTimeFormat
  }
}
