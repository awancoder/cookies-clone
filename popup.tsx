import { useEffect, useRef, useState } from "react"

import {
  copyToClipboard,
  createExportData,
  downloadJSON,
  extractDomain,
  parseCookiesFromJSON,
  readFromClipboard
} from "~lib/cookies"
import type { ExportedCookie, ImportResult } from "~lib/types"

import "./style.css"

type Tab = "export" | "import"
type StatusType = "success" | "error" | "warning" | null

interface StatusMessage {
  type: StatusType
  text: string
}

function IndexPopup() {
  const [activeTab, setActiveTab] = useState<Tab>("export")
  const [currentUrl, setCurrentUrl] = useState("")
  const [currentDomain, setCurrentDomain] = useState("")
  const [cookies, setCookies] = useState<ExportedCookie[]>([])
  const [cookieCount, setCookieCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessage>({ type: null, text: "" })

  // Import state
  const [importText, setImportText] = useState("")
  const [previewCookies, setPreviewCookies] = useState<ExportedCookie[]>([])
  const [importResults, setImportResults] = useState<ImportResult[] | null>(
    null
  )

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Ambil info tab aktif saat popup dibuka
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = tabs[0].url
        const domain = extractDomain(url)
        setCurrentUrl(url)
        setCurrentDomain(domain)

        // Auto-export cookies dari domain aktif
        fetchCookies(url, domain)
      }
    })
  }, [])

  // Parse preview saat import text berubah
  useEffect(() => {
    if (!importText.trim()) {
      setPreviewCookies([])
      return
    }
    try {
      const parsed = parseCookiesFromJSON(importText)
      setPreviewCookies(parsed)
      setStatus({ type: null, text: "" })
    } catch (e) {
      setPreviewCookies([])
      setStatus({
        type: "error",
        text: e instanceof Error ? e.message : "Format tidak valid"
      })
    }
  }, [importText])

  /**
   * Ambil cookies dari background service worker
   */
  async function fetchCookies(url: string, domain: string) {
    setLoading(true)
    try {
      const response = await chrome.runtime.sendMessage({
        type: "EXPORT_COOKIES",
        payload: { url, domain }
      })
      if (response.success && response.data) {
        setCookies(response.data)
        setCookieCount(response.data.length)
      } else {
        setStatus({
          type: "error",
          text: response.error || "Gagal mengambil cookies"
        })
      }
    } catch (error) {
      setStatus({
        type: "error",
        text: "Gagal terhubung ke background service"
      })
    }
    setLoading(false)
  }

  /**
   * Copy cookies ke clipboard sebagai JSON
   */
  async function handleCopyToClipboard() {
    try {
      const exportData = createExportData(cookies, currentDomain, currentUrl)
      await copyToClipboard(JSON.stringify(exportData, null, 2))
      setStatus({ type: "success", text: "✅ Cookies berhasil disalin ke clipboard!" })
      setTimeout(() => setStatus({ type: null, text: "" }), 3000)
    } catch {
      setStatus({ type: "error", text: "Gagal menyalin ke clipboard" })
    }
  }

  /**
   * Download cookies sebagai file JSON
   */
  function handleDownloadJSON() {
    try {
      const exportData = createExportData(cookies, currentDomain, currentUrl)
      downloadJSON(exportData)
      setStatus({ type: "success", text: "✅ File JSON berhasil didownload!" })
      setTimeout(() => setStatus({ type: null, text: "" }), 3000)
    } catch {
      setStatus({ type: "error", text: "Gagal mendownload file" })
    }
  }

  /**
   * Paste dari clipboard ke textarea
   */
  async function handlePasteFromClipboard() {
    try {
      const text = await readFromClipboard()
      setImportText(text)
      setStatus({ type: "success", text: "📋 Data berhasil ditempel dari clipboard!" })
      setTimeout(() => setStatus({ type: null, text: "" }), 3000)
    } catch {
      setStatus({
        type: "warning",
        text: "Clipboard tidak bisa dibaca otomatis. Klik textarea di bawah lalu tekan Ctrl+V untuk paste manual."
      })
    }
  }

  /**
   * Handle upload file JSON
   */
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setImportText(text)
      setStatus({ type: "success", text: `📁 File "${file.name}" berhasil dimuat!` })
      setTimeout(() => setStatus({ type: null, text: "" }), 3000)
    }
    reader.onerror = () => {
      setStatus({ type: "error", text: "Gagal membaca file" })
    }
    reader.readAsText(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  /**
   * Import cookies ke browser via background
   */
  async function handleImportCookies() {
    if (previewCookies.length === 0) return

    setLoading(true)
    setImportResults(null)
    try {
      const response = await chrome.runtime.sendMessage({
        type: "IMPORT_COOKIES",
        payload: { cookies: previewCookies, url: currentUrl }
      })

      if (response.success && response.results) {
        setImportResults(response.results)
        const successCount = response.results.filter(
          (r: ImportResult) => r.success
        ).length
        const failedCount = response.results.length - successCount

        if (failedCount === 0) {
          setStatus({
            type: "success",
            text: `🎉 Semua ${successCount} cookies berhasil diimport! Refresh halaman untuk login.`
          })
        } else {
          setStatus({
            type: "warning",
            text: `⚠️ ${successCount} berhasil, ${failedCount} gagal`
          })
        }
      } else {
        setStatus({
          type: "error",
          text: response.error || "Gagal import cookies"
        })
      }
    } catch (error) {
      setStatus({
        type: "error",
        text: "Gagal terhubung ke background service"
      })
    }
    setLoading(false)
  }

  // Hitung results
  const successResults =
    importResults?.filter((r) => r.success).length ?? 0
  const failedResults =
    importResults ? importResults.length - successResults : 0

  return (
    <div className="popup">
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <div className="header-icon">🍪</div>
          <div>
            <div className="header-title">Cookies Clone</div>
            <div className="header-subtitle">Export & Import Browser Cookies</div>
          </div>
        </div>
        {currentDomain && (
          <div className="domain-badge">
            <span className="dot"></span>
            {currentDomain}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          id="tab-export"
          className={`tab-btn ${activeTab === "export" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("export")
            setStatus({ type: null, text: "" })
          }}>
          <span className="tab-icon">📤</span>
          Export
        </button>
        <button
          id="tab-import"
          className={`tab-btn ${activeTab === "import" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("import")
            setStatus({ type: null, text: "" })
          }}>
          <span className="tab-icon">📥</span>
          Import
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content" key={activeTab}>
        {activeTab === "export" ? (
          /* ===== EXPORT TAB ===== */
          <>
            <div className="info-card">
              <div className="info-card-header">
                <span className="info-card-label">Domain Aktif</span>
                <span className="cookie-count">
                  🍪 {cookieCount}
                </span>
              </div>
              <div className="info-card-domain">
                {currentDomain || "Tidak terdeteksi"}
              </div>
            </div>

            {cookieCount > 0 ? (
              <div className="btn-group">
                <button
                  id="btn-copy-clipboard"
                  className="btn btn-primary"
                  onClick={handleCopyToClipboard}
                  disabled={loading}>
                  <span className="btn-icon">📋</span>
                  Copy to Clipboard
                </button>
                <button
                  id="btn-download-json"
                  className="btn btn-secondary"
                  onClick={handleDownloadJSON}
                  disabled={loading}>
                  <span className="btn-icon">💾</span>
                  Download JSON
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-text">
                  {loading
                    ? "Mengambil cookies..."
                    : "Tidak ada cookies ditemukan untuk domain ini"}
                </div>
              </div>
            )}

            {/* Preview exported cookies */}
            {cookies.length > 0 && (
              <div className="preview-section">
                <div className="preview-header">
                  <span className="preview-title">Cookies yang ditemukan</span>
                  <span className="preview-count">{cookies.length} item</span>
                </div>
                <div className="preview-list">
                  {cookies.map((cookie, i) => (
                    <div key={`${cookie.name}-${cookie.domain}-${i}`} className="preview-item">
                      <span className="preview-name" title={cookie.name}>
                        {cookie.name}
                      </span>
                      <span className="preview-domain" title={cookie.domain}>
                        {cookie.domain}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ===== IMPORT TAB ===== */
          <>
            {/* Paste actions */}
            <div className="btn-group" style={{ marginBottom: 16 }}>
              <button
                id="btn-paste-clipboard"
                className="btn btn-secondary"
                onClick={handlePasteFromClipboard}>
                <span className="btn-icon">📋</span>
                Paste from Clipboard
              </button>

              <div className="file-input-wrapper">
                <button
                  id="btn-upload-file"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: "100%" }}>
                  <span className="btn-icon">📁</span>
                  Upload File JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="file-input"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            <div className="divider">atau paste manual</div>

            {/* Textarea */}
            <div className="textarea-wrapper">
              <div className="textarea-label">
                <span>JSON Cookies</span>
                {importText && (
                  <span
                    style={{ color: "var(--text-muted)", cursor: "pointer" }}
                    onClick={() => {
                      setImportText("")
                      setPreviewCookies([])
                      setImportResults(null)
                      setStatus({ type: null, text: "" })
                    }}>
                    ✕ Clear
                  </span>
                )}
              </div>
              <textarea
                id="textarea-import"
                className="textarea"
                placeholder='Paste JSON cookies di sini...'
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
            </div>

            {/* Preview */}
            {previewCookies.length > 0 && !importResults && (
              <div className="preview-section">
                <div className="preview-header">
                  <span className="preview-title">Preview cookies</span>
                  <span className="preview-count">
                    {previewCookies.length} item
                  </span>
                </div>
                <div className="preview-list">
                  {previewCookies.slice(0, 50).map((cookie, i) => (
                    <div key={`${cookie.name}-${i}`} className="preview-item">
                      <span className="preview-name" title={cookie.name}>
                        {cookie.name}
                      </span>
                      <span className="preview-domain" title={cookie.domain}>
                        {cookie.domain}
                      </span>
                    </div>
                  ))}
                  {previewCookies.length > 50 && (
                    <div
                      className="preview-item"
                      style={{ justifyContent: "center", color: "var(--text-muted)" }}>
                      ...dan {previewCookies.length - 50} cookies lainnya
                    </div>
                  )}
                </div>

                <button
                  id="btn-import-cookies"
                  className="btn btn-success"
                  onClick={handleImportCookies}
                  disabled={loading}
                  style={{ marginTop: 12, width: "100%" }}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Mengimport...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🚀</span>
                      Import {previewCookies.length} Cookies
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Import Results */}
            {importResults && (
              <div className="results-section">
                <div className="results-summary">
                  <div className="result-stat result-success">
                    <div className="result-stat-number">{successResults}</div>
                    <div className="result-stat-label">Berhasil</div>
                  </div>
                  <div className="result-stat result-failed">
                    <div className="result-stat-number">{failedResults}</div>
                    <div className="result-stat-label">Gagal</div>
                  </div>
                </div>

                {successResults > 0 && (
                  <div className="status status-success">
                    <span className="status-icon">🎉</span>
                    Refresh halaman target untuk login otomatis!
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Status message */}
        {status.type && (
          <div className={`status status-${status.type}`}>
            <span className="status-icon">
              {status.type === "success"
                ? "✅"
                : status.type === "error"
                  ? "❌"
                  : "⚠️"}
            </span>
            {status.text}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <span className="footer-brand">Awan Digitals</span>
        <span className="footer-version">v0.0.1</span>
      </div>
    </div>
  )
}

export default IndexPopup
