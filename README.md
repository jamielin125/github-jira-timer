# 🕒 GitHub PR to Jira 工時紀錄工具

一個輕量級的 Chrome 擴充功能，讓你可以直接在 GitHub PR 頁面記錄 Jira 工時，無需切換頁面！

👉 [點我安裝擴充功能](https://chromewebstore.google.com/detail/github-pr-to-jira-time-lo/enkchickmfbmaibpmceibampkedaghkn)

## ✨ 功能特色

### 基本功能
- 自動偵測 Jira Key（從 PR 標題或 branch 名稱）
- 可直接輸入工時 (`2h`, `15m`) 並記錄到對應 Jira 工單
- 可自訂 Jira 網域、Email、API Token 與 Jira Key 的格式（支援自訂正則表達式）
- 支援深色模式
- Modal 可拖曳至任意位置

### 🕒 自動計時 (v2.0 新功能)
- **iOS 風格 Toggle** - 一鍵切換手動/自動模式
- **智慧 Idle 偵測** - 60 秒無互動自動暫停計時
- **跨 Tab 追蹤** - 切換分頁時暫停，回來後繼續
- **時間軸視覺化** - 展開查看 active/idle 區段分布
- **偏好記憶** - Toggle 設定跨 PR 保留
- **斷點續傳** - 頁面重整後時間接續計算

### 📋 待提交工時提醒 (v2.0 新功能)
- 離開 PR 頁面時自動儲存未提交的工時
- 進入新 PR 頁面時彈出提醒視窗
- 支援勾選批次提交或刪除

## 🚀 使用方式

1. 開啟 GitHub 上任一個 Pull Request 頁面
2. 若 PR 標題或 branch 名稱中包含 Jira Issue Key（例如 `PROJ-123`），右上角會自動出現輸入區塊
3. **手動模式**：輸入工時（例如 `2h`, `30m`）後點選「記錄時間」
4. **自動模式**：開啟 Toggle，系統會自動追蹤你的閱讀時間
5. 初次使用時，會提示你填寫 Jira Domain、Email、API Token、Jira Issue Key Regex（儲存後請重新整理）
6. 成功後會提示「時間記錄成功！」

## ⚙️ 設定說明

| 欄位 | 說明 | 範例 |
|------|------|------|
| Jira Domain | 你的 Jira 網域 | `yourcompany.atlassian.net` |
| Email | Jira 帳號 Email | `you@company.com` |
| API Token | [Jira API Token](https://id.atlassian.com/manage-profile/security/api-tokens) | `xxxxxxxx` |
| Jira Key Regex | Issue Key 的正則表達式 | `[A-Z]+-\\d+` |

## 🛠️ 技術棧

- Vue 3 + TypeScript
- Vite + CRXJS (Chrome Extension)
- RxJS (拖曳、自動計時、idle 偵測)
- Vitest (測試)

## 📄 License

MIT License
