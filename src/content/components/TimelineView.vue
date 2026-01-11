<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TimeSegment } from '@/types'
import IconTimer from './icons/IconTimer.vue'
import IconPause from './icons/IconPause.vue'

const props = defineProps<{
  segments: TimeSegment[]
  totalTime: string
  isTracking: boolean
}>()

const expanded = ref(false)
const hoveredSegment = ref<TimeSegment | null>(null)

// Calculate total duration for percentage calculation (sum of all segments)
const totalDuration = computed(() => {
  if (props.segments.length === 0) return 0
  return props.segments.reduce((sum, segment) => sum + (segment.end - segment.start), 0)
})

// Calculate segment width as percentage
function getSegmentWidth(segment: TimeSegment): string {
  if (totalDuration.value === 0) return '0%'
  const duration = segment.end - segment.start
  return `${(duration / totalDuration.value) * 100}%`
}

// Format timestamp for display
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Format duration
function formatDuration(start: number, end: number): string {
  const ms = end - start
  const seconds = Math.floor(ms / 1000) % 60
  const minutes = Math.floor(ms / 60000)
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}
</script>

<template>
  <div class="timeline-view">
    <!-- Summary row -->
    <div class="summary" @click="expanded = !expanded">
      <IconTimer v-if="isTracking" class="time-icon" />
      <IconPause v-else class="time-icon" />
      <span class="total-time">{{ totalTime }}</span>
      <button type="button" class="expand-btn">
        {{ expanded ? '▲' : '▼' }}
      </button>
    </div>

    <!-- Expanded timeline -->
    <div v-if="expanded && segments.length > 0" class="timeline-detail">
      <div class="timeline-bar">
        <div
          v-for="(segment, index) in segments"
          :key="index"
          class="segment"
          :class="segment.type"
          :style="{ width: getSegmentWidth(segment) }"
          @mouseenter="hoveredSegment = segment"
          @mouseleave="hoveredSegment = null"
        />
      </div>

      <!-- Hover tooltip -->
      <div v-if="hoveredSegment" class="tooltip">
        <span class="tooltip-type">{{ hoveredSegment.type === 'active' ? '活躍' : '閒置' }}</span>
        <span class="tooltip-time">
          {{ formatTime(hoveredSegment.start) }} - {{ formatTime(hoveredSegment.end) }}
        </span>
        <span class="tooltip-duration">
          ({{ formatDuration(hoveredSegment.start, hoveredSegment.end) }})
        </span>
      </div>

      <!-- Legend -->
      <div class="legend">
        <span class="legend-item">
          <span class="legend-color active" />
          活躍
        </span>
        <span class="legend-item">
          <span class="legend-color idle" />
          閒置
        </span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="expanded && segments.length === 0" class="empty">
      尚無記錄
    </div>
  </div>
</template>

<style scoped>
.timeline-view {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.summary {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.time-icon {
  width: 16px;
  height: 16px;
  color: #666;
}

.total-time {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.expand-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 10px;
  padding: 4px;
}

.timeline-detail {
  margin-top: 8px;
}

.timeline-bar {
  display: flex;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  background: #f0f0f0;
}

.segment {
  height: 100%;
  min-width: 2px;
  transition: opacity 0.2s;
}

.segment:hover {
  opacity: 0.8;
}

.segment.active {
  background: #34c759;
}

.segment.idle {
  background: #8e8e93;
}

.tooltip {
  margin-top: 8px;
  padding: 6px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.tooltip-type {
  font-weight: 600;
}

.tooltip-time {
  color: #666;
}

.tooltip-duration {
  color: #999;
}

.legend {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  font-size: 11px;
  color: #666;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-color.active {
  background: #34c759;
}

.legend-color.idle {
  background: #8e8e93;
}

.empty {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  text-align: center;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .timeline-view {
    border-color: #444;
  }

  .time-icon {
    color: #999;
  }

  .total-time {
    color: #e0e0e0;
  }

  .expand-btn {
    color: #999;
  }

  .timeline-bar {
    background: #3a3a3c;
  }

  .segment.active {
    background: #30d158;
  }

  .segment.idle {
    background: #636366;
  }

  .tooltip {
    background: #2c2c2e;
  }

  .tooltip-type {
    color: #e0e0e0;
  }

  .tooltip-time {
    color: #999;
  }

  .tooltip-duration {
    color: #777;
  }

  .legend {
    color: #999;
  }

  .empty {
    color: #777;
  }
}
</style>
