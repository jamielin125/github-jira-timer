/**
 * Check if current URL is a GitHub PR page
 */
export function isPullRequestPage(url: string): boolean {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(url)
}

/**
 * Extract Jira key from text using custom regex pattern
 */
export function extractJiraKey(text: string, regexPattern: string): string | null {
  try {
    const regex = new RegExp(regexPattern)
    const match = text.match(regex)
    return match ? match[0] : null
  } catch {
    return null
  }
}
