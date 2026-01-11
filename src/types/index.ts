export interface Settings {
  jiraDomain: string
  email: string
  apiToken: string
  jiraKeyRegex: string
}

export interface ModalPosition {
  x: number
  y: number
}

export interface LogTimePayload {
  jiraKey: string
  timeSpent: string
}

export interface LogTimeResponse {
  success: boolean
  error?: string
}

export interface TimeSegment {
  start: number      // timestamp (ms)
  end: number        // timestamp (ms)
  type: 'active' | 'idle'
}

export interface AutoTrackingState {
  enabled: boolean
  segments: TimeSegment[]
  totalActiveMs: number
  isTracking: boolean
}

// Pending submission for a single PR
export interface PendingSubmission {
  jiraKey: string
  totalActiveMs: number
  segments: TimeSegment[]
  lastUpdated: number  // timestamp
}

// All pending submissions stored by jiraKey
export interface PendingSubmissions {
  [jiraKey: string]: PendingSubmission
}
