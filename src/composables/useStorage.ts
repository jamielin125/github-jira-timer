import { ref, type Ref } from 'vue'
import type { Settings, ModalPosition } from '@/types'

const DEFAULT_SETTINGS: Settings = {
  jiraDomain: 'https://kkday.atlassian.net/',
  email: '',
  apiToken: '',
  // 支援的專案前綴：KQT, KB2CW（需要新增專案時在此擴充）
  jiraKeyRegex: '(KQT|KB2CW)-\\d+'
}

export function useSettings() {
  const settings: Ref<Settings> = ref({ ...DEFAULT_SETTINGS })
  const loading = ref(true)

  async function load() {
    loading.value = true
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS)
    settings.value = result as Settings
    loading.value = false
  }

  async function save(newSettings: Settings) {
    await chrome.storage.sync.set(newSettings)
    settings.value = newSettings
  }

  return { settings, loading, load, save }
}

export function useModalPosition(storageKey = 'modalPosition') {
  const position: Ref<ModalPosition> = ref({ x: 20, y: 20 })

  async function load() {
    const result = await chrome.storage.local.get(storageKey)
    if (result[storageKey]) {
      position.value = result[storageKey]
    }
  }

  async function save(pos: ModalPosition) {
    await chrome.storage.local.set({ [storageKey]: pos })
    position.value = pos
  }

  return { position, load, save }
}
