import type { CookieExportData, ExportedCookie } from "./types"

/**
 * Convert chrome.cookies.Cookie ke ExportedCookie format
 */
export function formatCookieForExport(
  cookie: chrome.cookies.Cookie
): ExportedCookie {
  return {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    ...(cookie.expirationDate && { expirationDate: cookie.expirationDate }),
    ...(cookie.storeId && { storeId: cookie.storeId })
  }
}

/**
 * Build URL yang sesuai dari cookie domain, path, dan secure flag
 * Diperlukan oleh chrome.cookies.set() sebagai parameter wajib
 */
export function buildCookieUrl(cookie: ExportedCookie): string {
  const protocol = cookie.secure ? "https" : "http"
  // Hapus leading dot dari domain (e.g. .google.com → google.com)
  const domain = cookie.domain.startsWith(".")
    ? cookie.domain.substring(1)
    : cookie.domain
  return `${protocol}://${domain}${cookie.path}`
}

/**
 * Buat objek CookieExportData lengkap dari array cookies
 */
export function createExportData(
  cookies: ExportedCookie[],
  domain: string,
  url: string
): CookieExportData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    domain,
    url,
    cookieCount: cookies.length,
    cookies
  }
}

/**
 * Parse dan validasi JSON string menjadi array ExportedCookie
 * Support format lengkap (CookieExportData) maupun array langsung
 */
export function parseCookiesFromJSON(jsonString: string): ExportedCookie[] {
  try {
    const parsed = JSON.parse(jsonString)

    // Jika format CookieExportData (ada field "cookies")
    if (parsed && Array.isArray(parsed.cookies)) {
      return validateCookies(parsed.cookies)
    }

    // Jika langsung array of cookies
    if (Array.isArray(parsed)) {
      return validateCookies(parsed)
    }

    throw new Error("Format JSON tidak valid. Harus berupa array cookies atau objek dengan field 'cookies'.")
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("JSON tidak valid. Pastikan format JSON benar.")
    }
    throw e
  }
}

/**
 * Validasi bahwa setiap cookie punya field minimal yang diperlukan
 */
function validateCookies(cookies: unknown[]): ExportedCookie[] {
  return cookies.map((cookie: any, index: number) => {
    if (!cookie.name && cookie.name !== "") {
      throw new Error(`Cookie #${index + 1}: field 'name' tidak ditemukan`)
    }
    if (!cookie.domain) {
      throw new Error(`Cookie #${index + 1} (${cookie.name}): field 'domain' tidak ditemukan`)
    }
    return {
      name: cookie.name,
      value: cookie.value ?? "",
      domain: cookie.domain,
      path: cookie.path ?? "/",
      secure: cookie.secure ?? false,
      httpOnly: cookie.httpOnly ?? false,
      sameSite: cookie.sameSite ?? "unspecified",
      ...(cookie.expirationDate && { expirationDate: cookie.expirationDate }),
      ...(cookie.storeId && { storeId: cookie.storeId })
    } as ExportedCookie
  })
}

/**
 * Trigger download file JSON
 */
export function downloadJSON(data: CookieExportData, filename?: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download =
    filename ?? `cookies_${data.domain}_${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Copy text ke clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

/**
 * Baca text dari clipboard
 * navigator.clipboard.readText() sering diblokir di extension popup,
 * jadi gunakan fallback execCommand('paste')
 */
export async function readFromClipboard(): Promise<string> {
  // Method 1: Coba navigator.clipboard API
  try {
    const text = await navigator.clipboard.readText()
    if (text) return text
  } catch {
    // Fallback ke method 2
  }

  // Method 2: execCommand('paste') via hidden textarea
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea")
    textarea.style.position = "fixed"
    textarea.style.left = "-9999px"
    textarea.style.top = "-9999px"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.focus()

    const success = document.execCommand("paste")
    const text = textarea.value
    document.body.removeChild(textarea)

    if (success && text) {
      resolve(text)
    } else {
      reject(new Error("Clipboard tidak bisa dibaca. Silakan paste manual (Ctrl+V) ke textarea."))
    }
  })
}

/**
 * Extract root domain dari URL
 * e.g. "https://accounts.google.com/signin" → "google.com"
 */
export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname
  } catch {
    return ""
  }
}
