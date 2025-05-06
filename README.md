# Jira Time Logger Chrome Extension

這是一個簡單的 Chrome 擴充功能，可在 GitHub Pull Request 頁面自動偵測 Jira issue key，並提供介面讓你直接將工作時間記錄到 Jira Time Log。

## 🔧 功能特色

- 自動從 PR 標題或分支名稱中擷取 Jira Issue Key（如 `KKDAY-1234`）
- 可設定 Jira Domain、Email、API Token
- 顯示簡單 UI，輸入時間（如 `2h`, `30m`）後即可記錄

## 📦 安裝方式（開發者模式）

1. Clone 此 repo 到本地端：
   ```
   git clone https://github.com/jamielin125/github-jira-timer.git
   ````
2.	打開 Chrome，進入 chrome://extensions/
3.	開啟右上角「開發人員模式」
4.	點選「載入未封裝項目」，選擇本 repo 資料夾

## 🚀 使用方式
1.	開啟 GitHub 上任一個 Pull Request 頁面
2.	若 PR 標題或分支名稱中包含 Jira Issue Key（例如 KKDAY-123），右上角會自動出現輸入區塊
3.	第一次使用時請先輸入 Jira Domain、Email 和 API Token（儲存後請重新整理）
4.	輸入工作時間（例如 1h, 45m, ...），點擊 Log Time
5.	成功後會提示「時間記錄成功！」

##	📄 License

MIT License
