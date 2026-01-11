import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineView from '@/content/components/TimelineView.vue'
import type { TimeSegment } from '@/types'

describe('TimelineView', () => {
  const createSegment = (
    start: number,
    end: number,
    type: 'active' | 'idle' = 'active'
  ): TimeSegment => ({ start, end, type })

  describe('時間總長計算', () => {
    it('空區段應回傳 0', () => {
      const wrapper = mount(TimelineView, {
        props: {
          segments: [],
          totalTime: '0s',
          isTracking: false
        }
      })

      expect(wrapper.find('.summary').exists()).toBe(true)
    })

    it('應加總所有區段時長，而非首尾跨距', async () => {
      // 兩個區段中間有間隔：
      // 區段 1: 0-1000ms (1s)
      // 間隔: 1000-2000ms (1s)
      // 區段 2: 2000-3000ms (1s)
      // 總時長應為 2000ms (1s + 1s)，而非 3000ms (跨距)
      const segments: TimeSegment[] = [
        createSegment(0, 1000, 'active'),      // 1s
        createSegment(2000, 3000, 'active')    // 1s
      ]

      const wrapper = mount(TimelineView, {
        props: {
          segments,
          totalTime: '2s',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')

      const segmentElements = wrapper.findAll('.segment')
      expect(segmentElements.length).toBe(2)

      // 每個區段應為 50% (1000ms / 2000ms)
      segmentElements.forEach(el => {
        expect(el.attributes('style')).toContain('width: 50%')
      })
    })

    it('單一區段應顯示 100%', async () => {
      const segments: TimeSegment[] = [
        createSegment(1000, 6000, 'active') // 5s
      ]

      const wrapper = mount(TimelineView, {
        props: {
          segments,
          totalTime: '5s',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')

      const segmentElements = wrapper.findAll('.segment')
      expect(segmentElements.length).toBe(1)
      expect(segmentElements[0].attributes('style')).toContain('width: 100%')
    })

    it('混合 active/idle 區段應正確計算百分比', async () => {
      // Active: 0-2000ms (2s)
      // Idle: 2000-3000ms (1s)
      // Active: 3000-5000ms (2s)
      // 總計: 5s
      const segments: TimeSegment[] = [
        createSegment(0, 2000, 'active'),    // 2s = 40%
        createSegment(2000, 3000, 'idle'),   // 1s = 20%
        createSegment(3000, 5000, 'active')  // 2s = 40%
      ]

      const wrapper = mount(TimelineView, {
        props: {
          segments,
          totalTime: '4s',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')

      const segmentElements = wrapper.findAll('.segment')
      expect(segmentElements.length).toBe(3)

      // 百分比: 40%, 20%, 40%
      expect(segmentElements[0].attributes('style')).toContain('width: 40%')
      expect(segmentElements[1].attributes('style')).toContain('width: 20%')
      expect(segmentElements[2].attributes('style')).toContain('width: 40%')
    })

    it('有間隔的區段百分比總和仍應為 100%', async () => {
      // 這是修復 bug 的主要測試：
      // 若使用跨距計算 (last.end - first.start) 會得到錯誤百分比
      // 有間隔時，區段百分比總和仍應為 100%

      // 區段 1: 0-1000ms (1s)
      // 間隔: 1000-5000ms (4s - 不計入)
      // 區段 2: 5000-6000ms (1s)
      // 區段總時長: 2s (非 6s 跨距)
      const segments: TimeSegment[] = [
        createSegment(0, 1000, 'active'),
        createSegment(5000, 6000, 'active')
      ]

      const wrapper = mount(TimelineView, {
        props: {
          segments,
          totalTime: '2s',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')

      const segmentElements = wrapper.findAll('.segment')

      // 兩者皆為 50% (1s / 2s)，總和 100%
      // 舊版 bug (跨距計算) 會各顯示約 16.67%
      expect(segmentElements[0].attributes('style')).toContain('width: 50%')
      expect(segmentElements[1].attributes('style')).toContain('width: 50%')
    })

    it('應正確處理極小區段', async () => {
      const segments: TimeSegment[] = [
        createSegment(0, 100, 'active'),   // 100ms = 10%
        createSegment(100, 200, 'idle'),   // 100ms = 10%
        createSegment(200, 1000, 'active') // 800ms = 80%
      ]

      const wrapper = mount(TimelineView, {
        props: {
          segments,
          totalTime: '1s',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')

      const segmentElements = wrapper.findAll('.segment')
      expect(segmentElements.length).toBe(3)

      expect(segmentElements[0].attributes('style')).toContain('width: 10%')
      expect(segmentElements[1].attributes('style')).toContain('width: 10%')
      expect(segmentElements[2].attributes('style')).toContain('width: 80%')
    })
  })

  describe('區段顯示', () => {
    it('active 區段應套用正確 CSS class', async () => {
      const segments: TimeSegment[] = [
        createSegment(0, 1000, 'active')
      ]

      const wrapper = mount(TimelineView, {
        props: {
          segments,
          totalTime: '1s',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')

      const segment = wrapper.find('.segment')
      expect(segment.classes()).toContain('active')
    })

    it('idle 區段應套用正確 CSS class', async () => {
      const segments: TimeSegment[] = [
        createSegment(0, 1000, 'idle')
      ]

      const wrapper = mount(TimelineView, {
        props: {
          segments,
          totalTime: '1s',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')

      const segment = wrapper.find('.segment')
      expect(segment.classes()).toContain('idle')
    })
  })

  describe('展開/收合', () => {
    it('預設應為收合狀態', () => {
      const wrapper = mount(TimelineView, {
        props: {
          segments: [createSegment(0, 1000, 'active')],
          totalTime: '1s',
          isTracking: false
        }
      })

      expect(wrapper.find('.timeline-detail').exists()).toBe(false)
      expect(wrapper.find('.expand-btn').text()).toBe('▼')
    })

    it('點擊後應展開', async () => {
      const wrapper = mount(TimelineView, {
        props: {
          segments: [createSegment(0, 1000, 'active')],
          totalTime: '1s',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')

      expect(wrapper.find('.timeline-detail').exists()).toBe(true)
      expect(wrapper.find('.expand-btn').text()).toBe('▲')
    })

    it('再次點擊應收合', async () => {
      const wrapper = mount(TimelineView, {
        props: {
          segments: [createSegment(0, 1000, 'active')],
          totalTime: '1s',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')
      await wrapper.find('.summary').trigger('click')

      expect(wrapper.find('.timeline-detail').exists()).toBe(false)
    })
  })

  describe('空狀態', () => {
    it('展開無區段時應顯示空狀態訊息', async () => {
      const wrapper = mount(TimelineView, {
        props: {
          segments: [],
          totalTime: '0s',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')

      expect(wrapper.find('.empty').exists()).toBe(true)
      expect(wrapper.find('.empty').text()).toBe('尚無記錄')
    })
  })

  describe('追蹤指示器', () => {
    it('追蹤中應顯示計時圖示', () => {
      const wrapper = mount(TimelineView, {
        props: {
          segments: [],
          totalTime: '0s',
          isTracking: true
        }
      })

      // SVG icon 應存在且包含 circle 元素（計時器圖示）
      const icon = wrapper.find('.time-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.find('circle').exists()).toBe(true)
    })

    it('暫停時應顯示暫停圖示', () => {
      const wrapper = mount(TimelineView, {
        props: {
          segments: [],
          totalTime: '0s',
          isTracking: false
        }
      })

      // SVG icon 應存在且包含 rect 元素（暫停圖示）
      const icon = wrapper.find('.time-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.find('rect').exists()).toBe(true)
    })
  })

  describe('Hover tooltip', () => {
    it('hover 區段時應顯示 tooltip', async () => {
      const segments: TimeSegment[] = [
        createSegment(1704067200000, 1704067260000, 'active') // 1 分鐘
      ]

      const wrapper = mount(TimelineView, {
        props: {
          segments,
          totalTime: '1m',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')
      await wrapper.find('.segment').trigger('mouseenter')

      expect(wrapper.find('.tooltip').exists()).toBe(true)
      expect(wrapper.find('.tooltip-type').text()).toBe('活躍')
    })

    it('滑鼠離開區段時應隱藏 tooltip', async () => {
      const segments: TimeSegment[] = [
        createSegment(1704067200000, 1704067260000, 'active')
      ]

      const wrapper = mount(TimelineView, {
        props: {
          segments,
          totalTime: '1m',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')
      await wrapper.find('.segment').trigger('mouseenter')
      await wrapper.find('.segment').trigger('mouseleave')

      expect(wrapper.find('.tooltip').exists()).toBe(false)
    })

    it('idle 區段應顯示閒置標籤', async () => {
      const segments: TimeSegment[] = [
        createSegment(1704067200000, 1704067260000, 'idle')
      ]

      const wrapper = mount(TimelineView, {
        props: {
          segments,
          totalTime: '1m',
          isTracking: false
        }
      })

      await wrapper.find('.summary').trigger('click')
      await wrapper.find('.segment').trigger('mouseenter')

      expect(wrapper.find('.tooltip-type').text()).toBe('閒置')
    })
  })
})
