/**
 * Build worklog payload for Jira API
 */
export function buildWorklogPayload(timeSpent: string) {
  return {
    timeSpent,
    comment: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Logged from Chrome Extension'
            }
          ]
        }
      ]
    }
  }
}
