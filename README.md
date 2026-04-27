# 🍪 Cookies Clone

> Duplikasi cookies dari satu browser ke browser lainnya — login otomatis tanpa perlu memasukkan username & password!

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Chrome](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-yellow)

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| 📤 **Export Cookies** | Ambil semua cookies dari domain/tab yang sedang aktif |
| 📥 **Import Cookies** | Import cookies dari clipboard atau file JSON |
| 📋 **Copy to Clipboard** | Salin cookies sebagai JSON ke clipboard — satu klik |
| 📁 **Download / Upload JSON** | Export ke file `.json` atau import dari file |
| 👁️ **Preview Cookies** | Lihat daftar cookies sebelum import |
| 📊 **Import Results** | Statistik berhasil/gagal setelah import |
| 🌐 **Auto-detect Domain** | Otomatis mendeteksi domain dari tab aktif |

## 🚀 Cara Pakai

### Export (Browser A — yang sudah login)

1. Buka website target (misal: `facebook.com`) yang **sudah login**
2. Klik icon extension **Cookies Clone**
3. Klik **📋 Copy to Clipboard** atau **💾 Download JSON**

### Import (Browser B — yang belum login)

1. Buka website target di browser/profil lain
2. Klik icon extension → Tab **Import**
3. Klik **📋 Paste from Clipboard** atau **📁 Upload File JSON**
4. Preview cookies → Klik **🚀 Import Cookies**
5. **Refresh halaman** → Login otomatis! 🎉

## 📦 Instalasi

### Dari GitHub Release

1. Download file `.zip` dari [Releases](https://github.com/awancoder/cookies-clone/releases)
2. Buka `chrome://extensions` di Chrome
3. Aktifkan **Developer mode** (toggle kanan atas)
4. Klik **Load unpacked**
5. Extract file zip, lalu pilih foldernya
6. Extension siap digunakan! ✅

### Build Manual

```bash
# Install dependencies
yarn install

# Build production
yarn build
```

Hasil build ada di folder `build/chrome-mv3-prod/`. Load folder ini sebagai unpacked extension.

## 🛠️ Development

```bash
# Jalankan dev server (hot reload)
yarn dev
```

Buka `chrome://extensions` → Load unpacked → Pilih folder `build/chrome-mv3-dev`

## 🏗️ Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| **Framework** | [Plasmo](https://docs.plasmo.com/) |
| **UI** | React 18 |
| **Bahasa** | TypeScript |
| **Manifest** | Chrome Extension Manifest V3 |
| **Styling** | Vanilla CSS (Dark Theme) |

## 📁 Struktur Proyek

```
cookies-clone/
├── assets/
│   └── icon.png              # Icon extension
├── lib/
│   ├── types.ts              # TypeScript types
│   └── cookies.ts            # Helper functions
├── background.ts             # Background service worker (chrome.cookies API)
├── popup.tsx                 # Popup UI (React)
├── style.css                 # Premium dark theme CSS
├── package.json              # Config + manifest permissions
└── tsconfig.json             # TypeScript config
```

## ⚠️ Disclaimer

> Extension ini dibuat untuk **keperluan pribadi dan edukasi**. Penggunaan untuk mengakses akun orang lain tanpa izin adalah **ilegal** dan melanggar hukum. Gunakan dengan bijak dan bertanggung jawab.

## 📝 License

MIT © [Awan Digitals](https://github.com/awancoder)
