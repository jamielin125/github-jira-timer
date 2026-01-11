import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSettings, useModalPosition } from '@/composables/useStorage'

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load settings from chrome.storage.sync', async () => {
    const mockSettings = {
      jiraDomain: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'token123',
      jiraKeyRegex: 'TEST-\\d+'
    }
    vi.mocked(chrome.storage.sync.get).mockResolvedValue(mockSettings)

    const { settings, load } = useSettings()
    await load()

    expect(chrome.storage.sync.get).toHaveBeenCalled()
    expect(settings.value).toEqual(mockSettings)
  })

  it('should save settings to chrome.storage.sync', async () => {
    const { save, settings } = useSettings()
    const newSettings = {
      jiraDomain: 'https://new.atlassian.net',
      email: 'new@example.com',
      apiToken: 'newtoken',
      jiraKeyRegex: 'NEW-\\d+'
    }

    await save(newSettings)

    expect(chrome.storage.sync.set).toHaveBeenCalledWith(newSettings)
    expect(settings.value).toEqual(newSettings)
  })
})

describe('useModalPosition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load position from chrome.storage.local', async () => {
    const mockPosition = { x: 100, y: 200 }
    vi.mocked(chrome.storage.local.get).mockResolvedValue({ modalPosition: mockPosition })

    const { position, load } = useModalPosition()
    await load()

    expect(chrome.storage.local.get).toHaveBeenCalledWith('modalPosition')
    expect(position.value).toEqual(mockPosition)
  })

  it('should use default position if not saved', async () => {
    vi.mocked(chrome.storage.local.get).mockResolvedValue({})

    const { position, load } = useModalPosition()
    await load()

    expect(position.value).toEqual({ x: 20, y: 20 })
  })

  it('should save position to chrome.storage.local', async () => {
    const { save, position } = useModalPosition()
    const newPosition = { x: 150, y: 250 }

    await save(newPosition)

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ modalPosition: newPosition })
    expect(position.value).toEqual(newPosition)
  })
})
