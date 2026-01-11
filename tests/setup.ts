import { vi } from 'vitest'

// Mock Chrome API for tests
const mockStorageLocal = {
  get: vi.fn<[string | string[] | object | null | undefined], Promise<Record<string, unknown>>>()
    .mockResolvedValue({}),
  set: vi.fn<[Record<string, unknown>], Promise<void>>()
    .mockResolvedValue(undefined)
}

const mockStorageSync = {
  get: vi.fn<[string | string[] | object | null | undefined], Promise<Record<string, unknown>>>()
    .mockResolvedValue({}),
  set: vi.fn<[Record<string, unknown>], Promise<void>>()
    .mockResolvedValue(undefined)
}

const mockRuntime = {
  sendMessage: vi.fn(),
  onMessage: {
    addListener: vi.fn()
  }
}

globalThis.chrome = {
  storage: {
    local: mockStorageLocal,
    sync: mockStorageSync
  },
  runtime: mockRuntime
} as unknown as typeof chrome
