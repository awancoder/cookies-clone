/**
 * Shape cookie yang diekspor/diimpor
 */
export interface ExportedCookie {
  name: string
  value: string
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  sameSite: chrome.cookies.SameSiteStatus
  expirationDate?: number
  storeId?: string
}

/**
 * Data export lengkap (metadata + cookies)
 */
export interface CookieExportData {
  version: 1
  exportedAt: string
  domain: string
  url: string
  cookieCount: number
  cookies: ExportedCookie[]
}

/**
 * Hasil import per cookie
 */
export interface ImportResult {
  name: string
  domain: string
  success: boolean
  error?: string
}

/**
 * Tipe action untuk message passing popup ↔ background
 */
export type MessageAction =
  | { type: "EXPORT_COOKIES"; payload: { url: string; domain: string } }
  | { type: "IMPORT_COOKIES"; payload: { cookies: ExportedCookie[]; url: string } }

/**
 * Response dari background ke popup
 */
export type MessageResponse =
  | { success: true; data: ExportedCookie[] }
  | { success: true; results: ImportResult[] }
  | { success: false; error: string }
