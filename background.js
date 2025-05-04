/**
 * 監聽來自 content script 的訊息
 * 處理時間記錄的請求
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'logTime') {
    const { jiraKey, time } = message;

    // 從 Chrome 儲存空間獲取 Jira 設定
    chrome.storage.sync.get(['jiraDomain', 'email', 'apiToken'], (config) => {
      const { jiraDomain, email, apiToken } = {
        jiraDomain: config.jiraDomain || 'https://kkday.atlassian.net/',
        email: config.email,
        apiToken: config.apiToken
      };

      // 檢查設定是否完整
      if (!email || !apiToken) {
        sendResponse({ success: false, error: '請先在擴充功能設定頁填寫 Jira Email 與 API Token' });
        return;
      }

      // 發送 API 請求到 Jira
      fetch(`${jiraDomain}/rest/api/3/issue/${jiraKey}/worklog`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${email}:${apiToken}`)}`,
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
          sendResponse({ success: false, error: json });
        } else {
          sendResponse({ success: true, data: json });
        }
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message });
      });
    });

    return true; // 保持訊息通道開啟，等待非同步回應
  }
});