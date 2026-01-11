import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useDraggable } from '@/composables/useDraggable'

describe('useDraggable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(chrome.storage.local.get).mockResolvedValue({})
  })

  it('should return initial position', () => {
    const elementRef = ref<HTMLElement | null>(null)
    const { position } = useDraggable(elementRef)

    expect(position.value).toEqual({ x: 20, y: 20 })
  })

  it('should load saved position from storage', async () => {
    const savedPosition = { x: 100, y: 150 }
    vi.mocked(chrome.storage.local.get).mockResolvedValue({ modalPosition: savedPosition })

    const result = await chrome.storage.local.get('modalPosition')

    expect(result).toEqual({ modalPosition: savedPosition })
  })

  it('should handle drag events and update position', () => {
    const el = document.createElement('div')
    const elementRef = ref<HTMLElement | null>(el)
    const { position } = useDraggable(elementRef)

    expect(position.value).toEqual({ x: 20, y: 20 })
  })

  it('should save position on mouseup', async () => {
    vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined)

    await chrome.storage.local.set({ modalPosition: { x: 50, y: 50 } })

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ modalPosition: { x: 50, y: 50 } })
  })
})
