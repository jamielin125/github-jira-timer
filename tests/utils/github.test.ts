import { describe, it, expect } from 'vitest'
import { isPullRequestPage, extractJiraKey } from '@/utils/github'

describe('isPullRequestPage', () => {
  it('should return true for valid PR URLs', () => {
    expect(isPullRequestPage('https://github.com/owner/repo/pull/123')).toBe(true)
    expect(isPullRequestPage('https://github.com/my-org/my-repo/pull/1')).toBe(true)
    expect(isPullRequestPage('https://github.com/user/project/pull/999')).toBe(true)
  })

  it('should return true for PR URLs with additional path', () => {
    expect(isPullRequestPage('https://github.com/owner/repo/pull/123/files')).toBe(true)
    expect(isPullRequestPage('https://github.com/owner/repo/pull/123/commits')).toBe(true)
  })

  it('should return false for non-PR URLs', () => {
    expect(isPullRequestPage('https://github.com/owner/repo')).toBe(false)
    expect(isPullRequestPage('https://github.com/owner/repo/issues/123')).toBe(false)
    expect(isPullRequestPage('https://github.com/owner/repo/pulls')).toBe(false)
    expect(isPullRequestPage('https://google.com')).toBe(false)
  })
})

describe('extractJiraKey', () => {
  it('should extract Jira key with default pattern', () => {
    const pattern = '[A-Z]+-\\d+'
    expect(extractJiraKey('PROJ-123 Fix bug', pattern)).toBe('PROJ-123')
    expect(extractJiraKey('feature/ABC-456-add-feature', pattern)).toBe('ABC-456')
  })

  it('should extract Jira key with custom pattern', () => {
    const pattern = 'KB2CW-\\d+'
    expect(extractJiraKey('KB2CW-789 Update docs', pattern)).toBe('KB2CW-789')
    expect(extractJiraKey('feature/KB2CW-101-new-feature', pattern)).toBe('KB2CW-101')
  })

  it('should return null when no match', () => {
    const pattern = '[A-Z]+-\\d+'
    expect(extractJiraKey('No jira key here', pattern)).toBe(null)
    expect(extractJiraKey('', pattern)).toBe(null)
  })

  it('should return null for invalid regex', () => {
    expect(extractJiraKey('PROJ-123', '[')).toBe(null)
  })
})
