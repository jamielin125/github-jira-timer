import type { Settings, LogTimePayload, LogTimeResponse } from '@/types'
import { buildWorklogPayload } from '@/utils/jira'

async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get({
    jiraDomain: '',
    email: '',
    apiToken: '',
    jiraKeyRegex: '[A-Z]+-\\d+'
  })
  return result as Settings
}

async function logTimeToJira(payload: LogTimePayload): Promise<LogTimeResponse> {
  const settings = await getSettings()

  if (!settings.jiraDomain || !settings.email || !settings.apiToken) {
    return { success: false, error: '請先設定 Jira 認證資訊' }
  }

  const url = `${settings.jiraDomain}/rest/api/3/issue/${payload.jiraKey}/worklog`
  const auth = btoa(`${settings.email}:${settings.apiToken}`)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(buildWorklogPayload(payload.timeSpent))
    })

    if (response.ok) {
      return { success: true }
    }

    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.errorMessages?.join(', ') ||
                        errorData.message ||
                        `HTTP ${response.status}`

    return { success: false, error: errorMessage }
  } catch (err) {
    return { success: false, error: '網路錯誤，請檢查連線' }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'LOG_TIME') {
    logTimeToJira(message.payload).then(sendResponse)
    return true // Keep message channel open for async response
  }
})
