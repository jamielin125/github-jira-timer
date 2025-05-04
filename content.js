function extractJiraKey(text) {
  const match = text.match(/\[?([A-Z0-9]+-\d+)\]?/);
  return match ? match[1] : null;
}

function findJiraKey() {
  const title = document.querySelector('.js-issue-title')?.textContent || '';
  const branch = document.querySelector('[data-testid="head-ref"]')?.textContent || '';
  return extractJiraKey(title) || extractJiraKey(branch);
}

function insertUI(jiraKey) {
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

function removeUI() {
  const existing = document.getElementById('jira-time-tracker');
  if (existing) existing.remove();
}

function isPullRequestPage() {
  return location.pathname.match(/^\/[^/]+\/[^/]+\/pull\/\d+/);
}

function updateUI() {
  if (isPullRequestPage()) {
    const jiraKey = findJiraKey();
    if (jiraKey) insertUI(jiraKey);
  } else {
    removeUI();
  }
}

// 初始化
let lastUrl = location.href;
updateUI(); // 初次執行

// 監聽 URL 變化（GitHub 是 SPA）
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    updateUI();
  }
}, 1500);

console.log('[Jira Logger] Content script loaded!');