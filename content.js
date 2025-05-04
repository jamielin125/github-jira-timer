/**
 * Jira 時間記錄擴展的內容腳本
 * 負責在頁面上插入 UI 並處理用戶交互
 */

/**
 * 從文本中提取 Jira Key
 * @param {string} text - 要搜索的文本
 * @returns {string|null} - 找到的 Jira Key 或 null
 */
function extractJiraKey(text) {
  const match = text.match(/\[?([A-Z0-9]+-\d+)\]?/);
  return match ? match[1] : null;
}

/**
 * 在頁面上查找 Jira Key
 * @returns {string|null} - 找到的 Jira Key 或 null
 */
function findJiraKey() {
  const title = document.querySelector('.js-issue-title')?.textContent || '';
  const branch = document.querySelector('[data-testid="head-ref"]')?.textContent || '';
  return extractJiraKey(title) || extractJiraKey(branch);
}

/**
 * 在頁面上插入時間記錄 UI
 * @param {string} jiraKey - 要記錄時間的 Jira Key
 */
function insertUI(jiraKey) {
  if (!jiraKey) return;

  const container = document.createElement('div');
  container.id = 'jira-time-tracker';
  container.style = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: white;
    border: 1px solid #ccc;
    padding: 8px;
    z-index: 10000;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  `;

  container.innerHTML = `
    <div>Jira Key: <strong>${jiraKey}</strong></div>
    <input id="time-input" placeholder="e.g. 2h 30m" />
    <button id="log-time">Log Time</button>
  `;

  document.body.appendChild(container);

  document.getElementById('log-time').addEventListener('click', () => {
    const time = document.getElementById('time-input').value;
    if (!time) {
      alert('請輸入時間');
      return;
    }

    chrome.runtime.sendMessage(
      { action: 'logTime', jiraKey, time },
      (response) => {
        if (response?.success) {
          alert('時間記錄成功！');
          document.getElementById('time-input').value = '';
        } else {
          alert(`記錄失敗: ${response?.error || '未知錯誤'}`);
        }
      }
    );
  });
}

// 初始化
const jiraKey = findJiraKey();
if (jiraKey) {
  insertUI(jiraKey);
}

console.log('[Jira Logger] Content script loaded!');