<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import TimeLoggerModal from './components/TimeLoggerModal.vue'
import PendingSubmitModal from './components/PendingSubmitModal.vue'
import { useSettings } from '@/composables/useStorage'
import { usePendingSubmissions } from '@/composables/usePendingSubmissions'
import { isPullRequestPage, extractJiraKey } from '@/utils/github'
import type { PendingSubmission, AutoTrackingState } from '@/types'
import { STORAGE_KEY_TRACKING, MIN_TIME_TO_PROMPT_MS } from '@/config'

const { settings, load } = useSettings()
const {
  load: loadPending,
  getOtherPending,
  removePending,
  setPending,
  formatTime
} = usePendingSubmissions()

// Read tracking state directly from storage (don't use useAutoTracking to avoid conflicts)
async function getTrackingState(): Promise<{ jiraKey: string | null; state: AutoTrackingState } | null> {
  const saved = await chrome.storage.local.get(STORAGE_KEY_TRACKING)
  if (saved[STORAGE_KEY_TRACKING]) {
    const data = saved[STORAGE_KEY_TRACKING]
    return {
      jiraKey: data.jiraKey || null,
      state: {
        enabled: data.enabled || false,
        segments: Array.isArray(data.segments) ? data.segments : [],
        totalActiveMs: data.totalActiveMs || 0,
        isTracking: false
      }
    }
  }
  return null
}

// Clear tracking state in storage
async function clearTrackingState() {
  await chrome.storage.local.remove(STORAGE_KEY_TRACKING)
}

const jiraKey = ref<string | null>(null)
const showModal = ref(false)
const showPendingModal = ref(false)
const pendingItems = ref<PendingSubmission[]>([])
const batchSubmitResults = ref<{ success: number; failed: number } | null>(null)

async function checkPage() {
  if (!isPullRequestPage(window.location.href)) {
    showModal.value = false
    return
  }

  await load()
  await loadPending()

  if (!settings.value.jiraKeyRegex) {
    showModal.value = false
    return
  }

  const title = document.querySelector('.js-issue-title')?.textContent || ''
  const branch = document.querySelector('.commit-ref.head-ref a')?.textContent || ''

  const key = extractJiraKey(title, settings.value.jiraKeyRegex) ||
              extractJiraKey(branch, settings.value.jiraKeyRegex)

  if (key) {
    // Only check for pending from other PRs when jiraKey changes
    if (jiraKey.value !== key) {
      // Load tracking state and check if it's for a different PR
      const trackingData = await getTrackingState()

      // If there's existing tracking for a different PR, save it as pending
      if (
        trackingData &&
        trackingData.jiraKey &&
        trackingData.jiraKey !== key &&
        trackingData.state.enabled &&
        trackingData.state.totalActiveMs > 0
      ) {
        await setPending(
          trackingData.jiraKey,
          trackingData.state.totalActiveMs,
          trackingData.state.segments
        )
        // Clear the old tracking state
        await clearTrackingState()
      }

      // Check for pending submissions from other PRs
      // Only show modal if at least one item has >= MIN_TIME_TO_PROMPT_MS (avoid prompting for quick PR checks)
      await loadPending() // Reload to get latest pending (also cleans up expired entries)
      const otherPending = getOtherPending(key)
      const significantPending = otherPending.filter(p => p.totalActiveMs >= MIN_TIME_TO_PROMPT_MS)

      if (significantPending.length > 0) {
        pendingItems.value = significantPending
        showPendingModal.value = true
      }
    }

    jiraKey.value = key
    showModal.value = true
  } else {
    showModal.value = false
  }
}

// Handle batch submit
async function handleBatchSubmit(items: PendingSubmission[]) {
  let success = 0
  let failed = 0

  for (const item of items) {
    try {
      const timeSpent = formatTime(item.totalActiveMs)
      const response = await chrome.runtime.sendMessage({
        type: 'LOG_TIME',
        payload: {
          jiraKey: item.jiraKey,
          timeSpent
        }
      })

      if (response.success) {
        await removePending(item.jiraKey)
        success++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  batchSubmitResults.value = { success, failed }
  showPendingModal.value = false

  // Show result briefly
  setTimeout(() => {
    batchSubmitResults.value = null
  }, 3000)
}

function handleDismissPending() {
  showPendingModal.value = false
}

// Handle delete pending items
async function handleDeletePending(items: PendingSubmission[]) {
  for (const item of items) {
    await removePending(item.jiraKey)
  }
  showPendingModal.value = false
}

// Handle page unload - save pending before leaving
function handleBeforeUnload() {
  // Read tracking state from storage and save as pending if needed
  chrome.storage.local.get(STORAGE_KEY_TRACKING).then(saved => {
    if (saved[STORAGE_KEY_TRACKING]) {
      const data = saved[STORAGE_KEY_TRACKING]
      const trackingJiraKey = data.jiraKey
      const totalActiveMs = data.totalActiveMs || 0
      const segments = Array.isArray(data.segments) ? data.segments : []

      if (trackingJiraKey && data.enabled && totalActiveMs > 0) {
        const pendingData = {
          [trackingJiraKey]: {
            jiraKey: trackingJiraKey,
            totalActiveMs,
            segments,
            lastUpdated: Date.now()
          }
        }

        // Merge with existing pending
        chrome.storage.local.get('pendingSubmissions').then(pendingSaved => {
          const existing = pendingSaved.pendingSubmissions || {}
          chrome.storage.local.set({
            pendingSubmissions: { ...existing, ...pendingData }
          })
        })
      }
    }
  })
}

onMounted(() => {
  checkPage()

  // Listen for page unload to save pending
  window.addEventListener('beforeunload', handleBeforeUnload)

  let debounceTimer: number | null = null
  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(checkPage, 500)
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <TimeLoggerModal
    v-if="showModal && jiraKey"
    :jira-key="jiraKey"
  />

  <PendingSubmitModal
    v-if="showPendingModal && pendingItems.length > 0"
    :pending-items="pendingItems"
    @submit="handleBatchSubmit"
    @delete="handleDeletePending"
    @dismiss="handleDismissPending"
  />

  <!-- Batch submit result toast -->
  <div v-if="batchSubmitResults" class="batch-toast">
    <span v-if="batchSubmitResults.success > 0" class="success">
      ✓ {{ batchSubmitResults.success }} 筆提交成功
    </span>
    <span v-if="batchSubmitResults.failed > 0" class="failed">
      ✗ {{ batchSubmitResults.failed }} 筆提交失敗
    </span>
  </div>
</template>

<style scoped>
.batch-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 12px;
  font-size: 14px;
  z-index: 10002;
}

.batch-toast .success {
  color: #006644;
}

.batch-toast .failed {
  color: #de350b;
}

@media (prefers-color-scheme: dark) {
  .batch-toast {
    background: #2c2c2c;
  }

  .batch-toast .success {
    color: #36b37e;
  }

  .batch-toast .failed {
    color: #ff5630;
  }
}
</style>
