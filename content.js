/**
 * 偵測並設定 dark mode class
 */
function applyDarkModeClass() {
  const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
}

/**
 * 注入基本樣式（light + dark）
 */
function injectStyles() {
  if (document.getElementById('jira-style-block')) return;

  const style = document.createElement('style');
  style.id = 'jira-style-block';
  style.textContent = `
    #jira-config-form,
    #jira-time-tracker,
    .jira-toast {
      font-family: sans-serif;
      background: white;
      color: black;
      border: 1px solid #ccc;
    }

    .dark #jira-config-form,
    .dark #jira-time-tracker,
    .dark .jira-toast {
      background: #2c2c2c;
      color: #f0f0f0;
      border-color: #444;
    }

    #jira-config-form input,
    #jira-config-form input::placeholder,
    #jira-time-tracker input {
      background: white;
      color: black;
      border: 1px solid #ccc;
    }

    .dark #jira-config-form input,
    .dark #jira-config-form input::placeholder,
    .dark #jira-time-tracker input {
      background: #444;
      color: #fff;
      border: 1px solid #666;
    }

    .jira-toast {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10001;
      font-size: 14px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .jira-toast.info {
      background-color: #4caf50;
    }

    .jira-toast.error {
      background-color: #f44336;
    }

    .dark .jira-toast.info {
      background-color: #357a38;
    }

    .dark .jira-toast.error {
      background-color: #c62828;
    }
  `;
  document.head.appendChild(style);
}

/**
 * 從文字中提取 Jira 問題編號
 */
function extractJiraKey(text, regexPattern) {
  try {
    const regex = new RegExp(regexPattern);
    const match = text.match(regex);
    return match ? match[0] : null;
  } catch (error) {
    showToast('無效的正則表達式', 'error');
    return null;
  }
}

/**
 * 優先從標題，次從分支名稱中找 Jira Key
 */
function findJiraKey(regexPattern) {
  const title = document.querySelector('.js-issue-title')?.textContent || '';
  const branch = document.querySelector('[data-testid="head-ref"]')?.textContent || '';
  return extractJiraKey(title, regexPattern) || extractJiraKey(branch, regexPattern);
}

/**
 * 顯示提示訊息（toast）
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `jira-toast ${type}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/**
 * 建立 Jira 設定表單
 */
function createSettingForm() {
  if (document.getElementById('jira-config-form')) return;


  const container = document.createElement('div');
  container.id = 'jira-config-form';
  container.style = `
    position: fixed;
    top: 50px;
    right: 10px;
    z-index: 10000;
    width: 300px;
    padding: 15px;
  `;

  container.innerHTML = `
    <h4 style="margin-top: 0">設定 Jira 資訊</h4>
    <form id="jira-form">
      <label for="jiraDomain">Jira 網域</label>
      <input id="jiraDomain" placeholder="https://yourdomain.atlassian.net" style="width: 100%; margin-bottom: 10px;" />

      <label for="email">Email</label>
      <input id="email" type="email" placeholder="你的帳號 Email" style="width: 100%; margin-bottom: 10px;" />

      <label for="apiToken">API Token</label>
      <input id="apiToken" type="password" placeholder="你的 API Token" style="width: 100%; margin-bottom: 10px;" />

      <label for="jiraKeyRegex">Jira Key Regex</label>
      <input id="jiraKeyRegex" placeholder="例如 KB2CW-\\d+" style="width: 100%; margin-bottom: 5px;" value="" />
      <div style="font-size: 11px; margin-bottom: 10px; color: #666;">
        例：KB2CW-\\d+，或自訂團隊專案代號格式
      </div>

      <div style="display: flex; justify-content: space-between;">
        <button type="submit" style="width: 48%;">儲存</button>
        <button type="button" id="cancelSetting" style="width: 48%;">取消</button>
      </div>
    </form>
  `;

  document.body.appendChild(container);
  chrome.storage.sync.get(['jiraDomain', 'email', 'apiToken', 'jiraKeyRegex'], (config) => {
    if (config.jiraDomain) document.getElementById('jiraDomain').value = config.jiraDomain;
    if (config.email) document.getElementById('email').value = config.email;
    if (config.apiToken) document.getElementById('apiToken').value = config.apiToken;
    if (config.jiraKeyRegex) document.getElementById('jiraKeyRegex').value = config.jiraKeyRegex;
  });

  // 儲存按鈕處理
  document.getElementById('jira-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const jiraDomain = document.getElementById('jiraDomain').value.trim();
    const email = document.getElementById('email').value.trim();
    const apiToken = document.getElementById('apiToken').value.trim();
    const jiraKeyRegex = document.getElementById('jiraKeyRegex').value.trim();

    if (!jiraDomain || !email || !apiToken || !jiraKeyRegex) {
      showToast('請填寫完整資訊', 'error');
      return;
    }

    try {
      new RegExp(jiraKeyRegex);
    } catch (e) {
      showToast('無效的正則表達式格式', 'error');
      return;
    }

    chrome.storage.sync.set({ jiraDomain, email, apiToken, jiraKeyRegex }, () => {
      showToast('設定儲存成功！請重新整理頁面');
      container.remove();
    });
  });

  document.getElementById('cancelSetting').addEventListener('click', () => {
    container.remove();
  });
}

/**
 * 插入 Jira 時間記錄介面
 */
function insertLogTimeUI(jiraKey) {
  if (!jiraKey || document.getElementById('jira-time-tracker')) return;

  const container = document.createElement('div');
  container.id = 'jira-time-tracker';
  container.style = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    padding: 8px;
  `;

  container.innerHTML = `
    <div>Jira Key: <strong>${jiraKey}</strong></div>
    <input id="time-input" placeholder="e.g. 2h 30m" style="width: 100%; margin-top: 5px;" />
    <div style="margin-top: 5px;">
      <button id="log-time">記錄時間</button>
      <button id="open-settings" style="margin-left: 5px; font-size: 12px;">設定</button>
    </div>
  `;

  document.body.appendChild(container);

  document.getElementById('log-time').addEventListener('click', () => {
    const time = document.getElementById('time-input').value;
    if (!time) {
      showToast('請輸入時間', 'error');
      return;
    }

    chrome.runtime.sendMessage({ action: 'logTime', jiraKey, time }, (response) => {
      if (response?.success) {
        showToast('時間記錄成功！');
        document.getElementById('time-input').value = '';
      } else {
        const errorMsg = response?.error?.errorMessages?.join('\n') || JSON.stringify(response?.error) || '未知錯誤';
        showToast(`記錄失敗: ${errorMsg}`, 'error');
      }
    });
  });

  document.getElementById('open-settings').addEventListener('click', () => {
    removeUI();
    createSettingForm();
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
 */
function isPullRequestPage() {
  return location.pathname.match(/^\/[^/]+\/[^/]+\/pull\/\d+/);
}

function updateUI() {
  removeUI();

  if (isPullRequestPage()) {
    chrome.storage.sync.get(['jiraDomain', 'email', 'apiToken', 'jiraKeyRegex'], (config) => {
      const isConfigComplete = config.jiraDomain && config.email && config.apiToken;
      if (!isConfigComplete) {
        createSettingForm();
      } else {
        const jiraKey = findJiraKey(config.jiraKeyRegex);
        if (jiraKey) insertLogTimeUI(jiraKey);
        else {
          const warn = document.createElement('div');
          warn.id = 'jira-time-tracker';
          warn.style = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px;
            z-index: 9999;
          `;
          warn.innerHTML = `
            <div>找不到符合格式的 Jira Key</div>
            <button id="open-settings">修改設定</button>
          `;
          document.body.appendChild(warn);
          document.getElementById('open-settings').addEventListener('click', () => {
            removeUI();
            createSettingForm();
          });
        }
      }
    });``
  }
}

let lastUrl = location.href;
applyDarkModeClass();
injectStyles();
updateUI();

setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    updateUI();
  }
}, 1500);

console.log('[Jira Logger] Content script loaded!');