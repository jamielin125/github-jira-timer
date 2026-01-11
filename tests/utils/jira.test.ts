import { describe, it, expect } from 'vitest'
import { buildWorklogPayload } from '@/utils/jira'

describe('buildWorklogPayload', () => {
  it('should build correct payload structure', () => {
    const payload = buildWorklogPayload('2h 30m')

    expect(payload.timeSpent).toBe('2h 30m')
    expect(payload.comment.type).toBe('doc')
    expect(payload.comment.version).toBe(1)
    expect(payload.comment.content).toHaveLength(1)
    expect(payload.comment.content[0].type).toBe('paragraph')
    expect(payload.comment.content[0].content[0].text).toBe('Logged from Chrome Extension')
  })

  it('should handle various time formats', () => {
    expect(buildWorklogPayload('1h').timeSpent).toBe('1h')
    expect(buildWorklogPayload('30m').timeSpent).toBe('30m')
    expect(buildWorklogPayload('1d 2h 30m').timeSpent).toBe('1d 2h 30m')
  })
})
