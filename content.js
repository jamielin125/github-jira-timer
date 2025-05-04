/**
 * 從文字中提取 Jira 問題編號
 * @param {string} text - 要搜尋的文字
 * @returns {string|null} - 找到的 Jira 問題編號，如果沒有找到則返回 null
 */
function extractJiraKey(text) {
  const match = text.match(/\[?([A-Z0-9]+-\d+)\]?/);
  return match ? match[1] : null;
}

/**
 * 在頁面中尋找 Jira 問題編號
 * 優先從標題中尋找，如果沒有則從分支名稱中尋找
 * @returns {string|null} - 找到的 Jira 問題編號，如果沒有找到則返回 null
 */
function findJiraKey() {
  const title = document.querySelector('.js-issue-title')?.textContent || '';
  const branch = document.querySelector('[data-testid="head-ref"]')?.textContent || '';
  return extractJiraKey(title) || extractJiraKey(branch);
}

/**
 * 創建 Jira 設定表單
 * 包含 domain、email 和 API token 的輸入欄位
 */
function createSettingForm() {
  if (document.getElementById('jira-config-form')) return;

  const container = document.createElement('div');
  container.id = 'jira-config-form';
  container.style = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: white;
    border: 1px solid #ccc;
    padding: 10px;
    z-index: 10000;
    width: 280px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  `;

  container.innerHTML = `
    <h4 style="margin: 0 0 8px;">設定 Jira 資訊</h4>
    <input id="jiraDomain" placeholder="Jira Domain" style="width: 100%; margin-bottom: 5px;" value="https://kkday.atlassian.net/" />
    <input id="email" placeholder="Email" style="width: 100%; margin-bottom: 5px;" />
    <input id="apiToken" placeholder="API Token" type="password" style="width: 100%; margin-bottom: 10px;" />
    <button id="saveJiraConfig" style="width: 100%;">儲存設定</button>
  `;

  document.body.appendChild(container);

  document.getElementById('saveJiraConfig').addEventListener('click', () => {
    const jiraDomain = document.getElementById('jiraDomain').value.trim();
    const email = document.getElementById('email').value.trim();
    const apiToken = document.getElementById('apiToken').value.trim();

    if (!jiraDomain || !email || !apiToken) {
      alert('請填寫完整資訊');
      return;
    }

    chrome.storage.sync.set({ jiraDomain, email, apiToken }, () => {
      alert('設定已儲存，請重新整理頁面');
      container.remove();
    });
  });
}

/**
 * 插入時間記錄介面
 * @param {string} jiraKey - Jira 問題編號
 */
function insertLogTimeUI(jiraKey) {
  if (!jiraKey || document.getElementById('jira-time-tracker')) return;

  const container = document.createElement('div');
  container.id = 'jira-time-tracker';
  container.style = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: white;
    border: 1px solid #ccc;
    padding: 8px;
    z-index: 9999;
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

    chrome.runtime.sendMessage({ action: 'logTime', jiraKey, time }, (response) => {
      if (response?.success) {
        alert('時間記錄成功！');
        document.getElementById('time-input').value = '';
      } else {
        alert(`記錄失敗: ${response?.error || '未知錯誤'}`);
      }
    });
  });
}

/**
 * 移除所有 UI 元素
 */
function removeUI() {
  document.getElementById('jira-time-tracker')?.remove();
  document.getElementById('jira-config-form')?.remove();
}

/**
 * 檢查當前頁面是否為 Pull Request 頁面
 * @returns {boolean} - 如果是 Pull Request 頁面則返回 true
 */
function isPullRequestPage() {
  return location.pathname.match(/^\/[^/]+\/[^/]+\/pull\/\d+/);
}

/**
 * 更新頁面 UI
 * 根據當前頁面狀態和設定顯示相應的介面
 */
function updateUI() {
  removeUI();

  if (isPullRequestPage()) {
    chrome.storage.sync.get(['jiraDomain', 'email', 'apiToken'], (config) => {
      const isConfigComplete = config.jiraDomain && config.email && config.apiToken;
      if (!isConfigComplete) {
        createSettingForm();
      } else {
        const jiraKey = findJiraKey();
        if (jiraKey) insertLogTimeUI(jiraKey);
      }
    });
  }
}

// 初始化
let lastUrl = location.href;
updateUI();

// 監聽 URL 變化，當 URL 改變時更新 UI
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    updateUI();
  }
}, 1500);

console.log('[Jira Logger] Content script loaded!');