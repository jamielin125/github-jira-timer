/**
 * 應用程式設定常數
 */

// ============================================
// 自動計時設定
// ============================================

/** Idle 判定時間（毫秒）- 超過此時間無互動視為閒置 */
export const IDLE_TIMEOUT_MS = 60000 // 60 秒

/** 活動事件節流時間（毫秒）- 避免過度頻繁觸發 */
export const THROTTLE_MS = 1000 // 1 秒

// ============================================
// 待提交工時設定
// ============================================

/** 暫存紀錄過期天數 - 超過此天數自動清除 */
export const PENDING_EXPIRY_DAYS = 3

/** 暫存紀錄過期時間（毫秒） */
export const PENDING_EXPIRY_MS = PENDING_EXPIRY_DAYS * 24 * 60 * 60 * 1000

/** 顯示批次提交提醒的最低門檻（毫秒）- 低於此值不打擾使用者 */
export const MIN_TIME_TO_PROMPT_MS = 30000 // 30 秒

// ============================================
// Storage Keys
// ============================================

/** 自動計時狀態的 Storage Key */
export const STORAGE_KEY_TRACKING = 'autoTrackingState'

/** 自動計時偏好設定的 Storage Key（Toggle 開關狀態） */
export const STORAGE_KEY_PREFERENCE = 'autoTrackingPreference'

/** 待提交工時的 Storage Key */
export const STORAGE_KEY_PENDING = 'pendingSubmissions'
