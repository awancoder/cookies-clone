import { buildCookieUrl, formatCookieForExport } from "~lib/cookies"

import type { ExportedCookie, ImportResult, MessageAction, MessageResponse } from "~lib/types"

/**
 * Background service worker untuk Cookies Clone
 * Handle operasi chrome.cookies API via message passing
 */
chrome.runtime.onMessage.addListener(
  (
    message: MessageAction,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    // Handle async operations
    handleMessage(message).then(sendResponse)
    // Return true untuk menandakan response akan dikirim secara async
    return true
  }
)

async function handleMessage(message: MessageAction): Promise<MessageResponse> {
  switch (message.type) {
    case "EXPORT_COOKIES":
      return handleExport(message.payload.url, message.payload.domain)
    case "IMPORT_COOKIES":
      return handleImport(message.payload.cookies, message.payload.url)
    default:
      return { success: false, error: "Unknown action type" }
  }
}

/**
 * Export semua cookies untuk domain tertentu
 */
async function handleExport(
  url: string,
  domain: string
): Promise<MessageResponse> {
  try {
    // Ambil semua cookies dari domain (termasuk subdomain)
    const cookies = await chrome.cookies.getAll({ url })

    // Juga ambil cookies dari dot-prefix domain (e.g. .google.com)
    const domainCookies = await chrome.cookies.getAll({ domain })

    // Merge & deduplicate berdasarkan name+domain+path
    const mergedMap = new Map<string, chrome.cookies.Cookie>()
    ;[...cookies, ...domainCookies].forEach((cookie) => {
      const key = `${cookie.name}|${cookie.domain}|${cookie.path}`
      mergedMap.set(key, cookie)
    })

    const exportedCookies = Array.from(mergedMap.values()).map(
      formatCookieForExport
    )

    return { success: true, data: exportedCookies }
  } catch (error) {
    return {
      success: false,
      error: `Gagal export cookies: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Import array cookies via chrome.cookies.set()
 */
async function handleImport(
  cookies: ExportedCookie[],
  _url: string
): Promise<MessageResponse> {
  try {
    const results: ImportResult[] = []

    for (const cookie of cookies) {
      try {
        const cookieUrl = buildCookieUrl(cookie)

        await chrome.cookies.set({
          url: cookieUrl,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite,
          ...(cookie.expirationDate && {
            expirationDate: cookie.expirationDate
          })
        })

        results.push({
          name: cookie.name,
          domain: cookie.domain,
          success: true
        })
      } catch (error) {
        results.push({
          name: cookie.name,
          domain: cookie.domain,
          success: false,
          error:
            error instanceof Error ? error.message : String(error)
        })
      }
    }

    return { success: true, results }
  } catch (error) {
    return {
      success: false,
      error: `Gagal import cookies: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}
