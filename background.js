/**
 * Jira 時間記錄擴展的背景腳本
 * 處理與 Jira API 的通信
 */

// Jira API 配置
const defaultConfig = {
  jiraDomain: 'https://kkday.atlassian.net/',
  email: 'jamie.lin@kkday.com',
  apiToken: 'ATATT3xFfGF0GsqYIJE3TfZWkKzOdbtgUv-oFwc1qM9NUD8vZZa798VJKeomZs52Vt8iV8huI3x1J-XmmvdSWbBPtlZAoizhnT3Bo33sIU3upQOw7_4sehCUS_rr8BX9W79lnsr_LXb3_eE7gZhzg-9I7iKqHU_rbf2TTys5JrBrCYVE-70Czrg=9983FDAF'
};

/**
 * 處理來自 content script 的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'logTime') {
    const { jiraKey, time } = message;

    fetch(`${defaultConfig.jiraDomain}/rest/api/3/issue/${jiraKey}/worklog`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${defaultConfig.email}:${defaultConfig.apiToken}`)}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeSpent: time,
        comment: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Logged from Chrome Extension"
                }
              ]
            }
          ]
        }
      })
    })
    .then(async res => {
      const json = await res.json();
      if (!res.ok) {
        console.error('Jira API Error:', res.status, json);
        sendResponse({ success: false, error: json });
      } else {
        console.log('Time logged successfully:', json);
        sendResponse({ success: true, data: json });
      }
    })
    .catch(err => {
      console.error('Error logging time:', err);
      sendResponse({ success: false, error: err.message });
    });

    // 返回 true 表示我們將異步發送響應
    return true;
  }
});