# 🕒 GitHub PR to Jira 工時紀錄工具

一個輕量級的 Chrome 擴充功能，讓你可以直接在 GitHub PR 頁面記錄 Jira 工時，無需切換頁面！

👉 [點我安裝擴充功能](https://chromewebstore.google.com/detail/github-pr-to-jira-time-lo/enkchickmfbmaibpmceibampkedaghkn)

## 🔧 功能特色

- 自動偵測 Jira Key（從 PR 標題或 branch 名稱）
- 可直接輸入工時 (`2h`, `15m`) 並記錄到對應 Jira 工單
- 可自訂 Jira 網域、Email、API Token 與 Jira Key 的格式（可以自訂正則表達式）
- 支援 Dark Mode

## 🚀 使用方式
1.	開啟 GitHub 上任一個 Pull Request 頁面
1.	若 PR 標題或 branch 名稱中包含 Jira Issue Key（例如 KKDAY-123），右上角會自動出現輸入區塊
1.	輸入工時（例如 `2h`, `30m`）後點選「記錄時間」即可送出。
1.	初次使用時，會提示你填寫 Jira Domain、Email、API Token、Jira Issue Key Regex 規則（儲存後請重新整理）
1.	成功後會提示「時間記錄成功！」

##	📄 License

MIT License
