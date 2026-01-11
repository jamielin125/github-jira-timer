<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PendingSubmission } from '@/types'

const props = defineProps<{
  pendingItems: PendingSubmission[]
}>()

const emit = defineEmits<{
  submit: [items: PendingSubmission[]]
  delete: [items: PendingSubmission[]]
  dismiss: []
}>()

const loading = ref(false)
const selectedKeys = ref<Set<string>>(new Set(props.pendingItems.map(p => p.jiraKey)))

// Toggle selection
function toggleSelect(jiraKey: string) {
  if (selectedKeys.value.has(jiraKey)) {
    selectedKeys.value.delete(jiraKey)
  } else {
    selectedKeys.value.add(jiraKey)
  }
  // Trigger reactivity
  selectedKeys.value = new Set(selectedKeys.value)
}

// Select/deselect all
function toggleAll() {
  if (selectedKeys.value.size === props.pendingItems.length) {
    selectedKeys.value = new Set()
  } else {
    selectedKeys.value = new Set(props.pendingItems.map(p => p.jiraKey))
  }
}

// Format time for display (minimum 1 minute)
function formatTime(ms: number): string {
  const minutes = Math.max(1, Math.floor(ms / 60000))
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

// Format date
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const selectedItems = computed(() =>
  props.pendingItems.filter(p => selectedKeys.value.has(p.jiraKey))
)

const totalTime = computed(() => {
  const ms = selectedItems.value.reduce((sum, p) => sum + p.totalActiveMs, 0)
  return formatTime(ms)
})

async function handleSubmit() {
  if (selectedItems.value.length === 0) return

  loading.value = true
  emit('submit', selectedItems.value)
}

function handleDelete() {
  if (selectedItems.value.length === 0) return
  emit('delete', selectedItems.value)
}
</script>

<template>
  <div class="overlay" @click.self="emit('dismiss')">
    <div class="modal">
      <div class="header">
        <h3>尚未提交的工時紀錄</h3>
        <button class="close-btn" @click="emit('dismiss')">✕</button>
      </div>

      <div class="content">
        <div class="select-all" @click="toggleAll">
          <input
            type="checkbox"
            :checked="selectedKeys.size === pendingItems.length"
            :indeterminate="selectedKeys.size > 0 && selectedKeys.size < pendingItems.length"
          />
          <span>全選 ({{ selectedKeys.size }}/{{ pendingItems.length }})</span>
        </div>

        <div class="items">
          <div
            v-for="item in pendingItems"
            :key="item.jiraKey"
            class="item"
            :class="{ selected: selectedKeys.has(item.jiraKey) }"
            @click="toggleSelect(item.jiraKey)"
          >
            <input
              type="checkbox"
              :checked="selectedKeys.has(item.jiraKey)"
            />
            <div class="item-info">
              <span class="jira-key">{{ item.jiraKey }}</span>
              <span class="time">{{ formatTime(item.totalActiveMs) }}</span>
            </div>
            <span class="date">{{ formatDate(item.lastUpdated) }}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-left">
          <button
            class="delete-btn"
            :disabled="selectedItems.length === 0"
            @click="handleDelete"
          >
            刪除
          </button>
          <span class="total">總計: {{ totalTime }}</span>
        </div>
        <div class="actions">
          <button class="cancel-btn" @click="emit('dismiss')">稍後</button>
          <button
            class="submit-btn"
            :disabled="loading || selectedItems.length === 0"
            @click="handleSubmit"
          >
            <span v-if="loading" class="spinner"></span>
            <span v-else>提交 ({{ selectedItems.length }})</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 360px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.item:hover {
  background: #f5f5f5;
}

.item.selected {
  background: #e8f4fd;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.jira-key {
  font-weight: 600;
  color: #0052cc;
  font-size: 13px;
}

.time {
  font-size: 14px;
  font-weight: 500;
}

.date {
  font-size: 11px;
  color: #999;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #eee;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.total {
  font-size: 13px;
  color: #666;
}

.actions {
  display: flex;
  gap: 8px;
}

.delete-btn {
  padding: 8px 16px;
  background: transparent;
  color: #de350b;
  border: 1px solid #de350b;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.delete-btn:hover:not(:disabled) {
  background: #ffebe6;
}

.delete-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #e5e5e5;
}

.submit-btn {
  padding: 8px 16px;
  background: #0052cc;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.submit-btn:hover:not(:disabled) {
  background: #0047b3;
}

.submit-btn:disabled {
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
  to { transform: rotate(360deg); }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .overlay {
    background: rgba(0, 0, 0, 0.7);
  }

  .modal {
    background: #2c2c2c;
  }

  .header {
    border-color: #444;
  }

  .header h3 {
    color: #e0e0e0;
  }

  .close-btn {
    color: #888;
  }

  .close-btn:hover {
    color: #ccc;
  }

  .select-all {
    color: #999;
    border-color: #444;
  }

  .item:hover {
    background: #3a3a3a;
  }

  .item.selected {
    background: #1a3a5c;
  }

  .jira-key {
    color: #4c9aff;
  }

  .time {
    color: #e0e0e0;
  }

  .date {
    color: #888;
  }

  .footer {
    border-color: #444;
  }

  .total {
    color: #999;
  }

  .delete-btn {
    color: #ff5630;
    border-color: #ff5630;
  }

  .delete-btn:hover:not(:disabled) {
    background: #3a1a1a;
  }

  .cancel-btn {
    background: #444;
    color: #e0e0e0;
  }

  .cancel-btn:hover {
    background: #555;
  }

  .submit-btn {
    background: #0066ff;
  }

  .submit-btn:hover:not(:disabled) {
    background: #0055dd;
  }
}
</style>
