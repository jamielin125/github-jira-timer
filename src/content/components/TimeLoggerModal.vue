<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDraggable } from '@/composables/useDraggable'
import { useAutoTracking } from '@/composables/useAutoTracking'
import { usePendingSubmissions } from '@/composables/usePendingSubmissions'
import ToggleSwitch from './ToggleSwitch.vue'
import TimelineView from './TimelineView.vue'

const props = defineProps<{
  jiraKey: string
}>()

const { removePending } = usePendingSubmissions()

const modalRef = ref<HTMLElement | null>(null)
const { position } = useDraggable(modalRef)
const {
  state: trackingState,
  loaded: trackingLoaded,
  displaySegments,
  enable,
  disable,
  reset: resetTracking,
  setJiraKey,
  formattedTime,
  jiraTimeFormat
} = useAutoTracking()

// autoMode is synced with trackingState.enabled (loaded from storage)
const autoMode = computed({
  get: () => trackingState.value.enabled,
  set: (val) => {
    if (val) {
      // Set jiraKey before enabling to associate tracking with this PR
      setJiraKey(props.jiraKey)
      enable()
    } else {
      disable()
    }
  }
})
const timeSpent = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const modalStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  zIndex: 10000
}))

// Set jiraKey when tracking state is loaded and enabled
watch(trackingLoaded, (isLoaded) => {
  if (isLoaded && trackingState.value.enabled) {
    setJiraKey(props.jiraKey)
  }
}, { immediate: true })

// Use auto-tracked time when in auto mode
const effectiveTimeSpent = computed(() => {
  if (autoMode.value) {
    return jiraTimeFormat.value
  }
  return timeSpent.value
})

async function handleSubmit() {
  const time = effectiveTimeSpent.value.trim()

  if (!time) {
    message.value = '請輸入時間'
    messageType.value = 'error'
    return
  }

  loading.value = true
  message.value = ''

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'LOG_TIME',
      payload: {
        jiraKey: props.jiraKey,
        timeSpent: time
      }
    })

    if (response.success) {
      message.value = '時間記錄成功！'
      messageType.value = 'success'
      timeSpent.value = ''

      // Remove any pending submission for this jiraKey
      await removePending(props.jiraKey)

      if (autoMode.value) {
        resetTracking()
        enable()
      }
    } else {
      message.value = response.error || '記錄失敗'
      messageType.value = 'error'
    }
  } catch {
    message.value = '發生錯誤'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div ref="modalRef" class="modal" :style="modalStyle">
    <!-- Header with drag handle and toggle -->
    <div class="header">
      <span class="drag-hint">⋮⋮</span>
      <span class="jira-key">{{ jiraKey }}</span>
      <div class="toggle-wrapper">
        <span class="toggle-label">自動</span>
        <ToggleSwitch v-model="autoMode" />
      </div>
    </div>

    <!-- Auto tracking timeline (when auto mode is on) -->
    <TimelineView
      v-if="autoMode"
      :segments="displaySegments"
      :total-time="formattedTime"
      :is-tracking="trackingState.isTracking"
    />

    <!-- Manual input form -->
    <form @submit.prevent="handleSubmit">
      <input
        v-if="!autoMode"
        v-model="timeSpent"
        type="text"
        placeholder="e.g. 2h 30m"
        :disabled="loading"
      />
      <input
        v-else
        :value="jiraTimeFormat"
        type="text"
        readonly
        class="auto-time"
      />
      <button type="submit" :disabled="loading">
        <span v-if="loading" class="spinner"></span>
        <span v-else>記錄時間</span>
      </button>
    </form>

    <p v-if="message" :class="['message', messageType]">
      {{ message }}
    </p>
  </div>
</template>

<style scoped>
.modal {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  min-width: 240px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  cursor: move;
  user-select: none;
}

.drag-hint {
  color: #999;
  font-size: 12px;
}

.jira-key {
  font-weight: 600;
  color: #0052cc;
  flex: 1;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-label {
  font-size: 11px;
  color: #666;
}

form {
  display: flex;
  gap: 8px;
}

input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

input:focus {
  outline: none;
  border-color: #0052cc;
}

input.auto-time {
  background: #f5f5f5;
  color: #333;
  cursor: default;
}

button {
  padding: 6px 12px;
  background: #0052cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

button:hover:not(:disabled) {
  background: #0047b3;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.message {
  margin: 8px 0 0;
  padding: 6px;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.message.success {
  background: #e3fcef;
  color: #006644;
}

.message.error {
  background: #ffebe6;
  color: #de350b;
}

@media (prefers-color-scheme: dark) {
  .modal {
    background: #2c2c2c;
    border-color: #444;
  }

  .drag-hint {
    color: #666;
  }

  .jira-key {
    color: #4c9aff;
  }

  .toggle-label {
    color: #999;
  }

  input {
    background: #1e1e1e;
    border-color: #444;
    color: #e0e0e0;
  }

  input::placeholder {
    color: #666;
  }

  input:focus {
    border-color: #4c9aff;
  }

  input.auto-time {
    background: #3a3a3c;
    color: #e0e0e0;
  }

  button {
    background: #0066ff;
  }

  button:hover:not(:disabled) {
    background: #0055dd;
  }

  .message.success {
    background: #1a3a2a;
    color: #36b37e;
  }

  .message.error {
    background: #3a1a1a;
    color: #ff5630;
  }
}
</style>
