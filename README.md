# 🎬 Bax's Video Portfolio

A stunning, modern video portfolio website built with Astro v5, featuring multiple customizable layouts, DASH streaming support, and seamless MDX integration.

![Astro](https://img.shields.io/badge/Astro-5.16-FF5D01?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)

---

## ✨ Features

### 🎨 **5 Unique Portfolio Layouts**
Switch between different visual styles by changing a single configuration variable:

1. **Centered Layout** - Classic, clean centered design with grouped projects
2. **Left Aligned (Bax Style)** - Bold, editorial-style layout with large typography
3. **Split View** - Modern sidebar navigation with scrollable content area
4. **Bento/Mosaic** - Dynamic grid with varying card sizes for visual interest
5. **Cinematic Scroll** - Full-screen snap sections with immersive transitions

### 🎥 **Advanced Video Support**
- **DASH Streaming** - `.mpd` file support with adaptive bitrate streaming via Vidstack
- **YouTube Embeds** - Automatic URL conversion for YouTube videos
- **Thumbnail Fallback** - Displays project thumbnails when video URLs aren't provided
- **Custom Video Player** - React-based Vidstack player with modern controls

### 📝 **MDX Content System**
- **Type-Safe Content Collections** - Zod schema validation for project metadata
- **Custom Components** - `<Grid>`, `<YouTube>`, and `<Video>` components for rich content
- **Frontmatter Support** - Structured project data (title, client, roles, date, genre, credits)

### � **Modern UX**
- **View Transitions** - Smooth page navigation animations
- **Theme Toggle** - Light/dark mode support
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Blur-in Animations** - Elegant entrance effects for content
- **Genre Grouping** - Automatic categorization of projects by genre

---

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or Node.js 18+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd astro-bxwork

# Install dependencies
bun install

# Start development server
bun run dev
```

The site will be available at `http://localhost:4321`

### Build for Production

```bash
# Create optimized production build
bun run build

# Preview production build
bun run preview
```

---

## 📁 Project Structure

```
astro-bxwork/
├── src/
│   ├── components/
│   │   ├── mdx/              # Custom MDX components
│   │   │   ├── Grid.astro
│   │   │   ├── YouTube.astro
│   │   │   └── Video.astro
│   │   ├── ThemeToggle.tsx   # Dark/light mode toggle
│   │   └── VideoPlayer.tsx   # Vidstack player wrapper
│   ├── content/
│   │   ├── config.ts         # Content collection schema
│   │   └── work/             # Project MDX files
│   │       └── cinematic/    # Genre-based subdirectories
│   ├── layouts/
│   │   └── Layout.astro      # Base layout with SEO
│   ├── pages/
│   │   ├── index.astro       # Homepage with 5 layout options
│   │   ├── 404.astro         # Custom 404 page
│   │   └── work/
│   │       └── [...slug].astro  # Dynamic project pages
│   ├── styles/               # Global styles and animations
│   └── lib/
│       └── utils.ts          # Utility functions (cn, etc.)
├── public/
│   ├── header.jpg            # Profile avatar
│   ├── og-image.png          # Social media preview
│   └── favico.jpg            # Favicon
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

---

## ⚙️ Configuration

### Switching Layouts

Edit `src/pages/index.astro` and change the `CURRENT_LAYOUT` constant:

```typescript
// Line 12 in index.astro
const CURRENT_LAYOUT: number = 1; // Change to 1-5
```

### Profile Information

Update your profile details in `src/pages/index.astro`:

```typescript
const PROFILE = {
    name: "Your Name",
    role: "Your Role / Company",
    email: "your@email.com",
    bio: "Your bio description",
    avatar: "/header.jpg",
    links: {
        twitter: "x.com/yourhandle",
        email: "mailto:your@email.com",
    },
};
```

### Adding Projects

Create a new `.mdx` file in `src/content/work/`:

```mdx
---
title: "Project Title"
client: "Client Name"
role: ["Motion Designer", "Editor"]
date: 2024-01-15
genre: "Motion"
thumbnail: "/path/to/thumbnail.jpg"
videoUrl: "https://example.com/video.mpd" # Optional: .mpd, YouTube URL, or omit
description: "Project description"
credits: # Optional
  - name: "John Doe"
    role: "Director"
---

## Project Details

Your project content here. You can use custom components:

<YouTube url="https://youtube.com/watch?v=..." />

<Grid cols={2}>
  <Video src="/video1.mp4" />
  <Video src="/video2.mp4" />
</Grid>
```

---

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.mjs` to customize the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: "hsl(var(--primary))",
      // ... customize other colors
    }
  }
}
```

### Animations

Custom animations are defined in `src/styles/`. The project includes:
- `animate-blur-in` - Fade and blur entrance effect
- Staggered delays for sequential animations
- Smooth transitions for hover states

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Astro v5** | Static site generator with islands architecture |
| **React 19** | Interactive components (theme toggle, video player) |
| **Tailwind CSS** | Utility-first styling framework |
| **MDX** | Markdown with JSX for rich content |
| **Vidstack** | Modern video player with DASH support |
| **TypeScript** | Type-safe development |
| **Bun** | Fast JavaScript runtime and package manager |

---

## 📦 Key Dependencies

```json
{
  "@astrojs/mdx": "^4.3.13",
  "@astrojs/react": "^4.4.2",
  "@astrojs/tailwind": "^6.0.2",
  "@vidstack/react": "^1.12.13",
  "astro": "^5.16.9",
  "react": "^19.2.3",
  "tailwindcss": "^3.4.17"
}
```

---

## 🎯 Content Schema

Projects are validated with the following Zod schema:

```typescript
{
  title: string,
  client: string,
  role: string[],
  date: Date,
  genre: string (default: "Motion"),
  thumbnail: string,
  videoUrl?: string, // Optional
  description: string,
  credits?: Array<{
    name: string,
    role: string
  }>
}
```

---

## 🌐 Deployment

This project can be deployed to any static hosting platform:

### Vercel
```bash
vercel deploy
```

### Netlify
```bash
netlify deploy --prod
```

### Cloudflare Pages
```bash
npm run build
# Upload dist/ folder
```

---

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Astro Team** - For the amazing framework
- **Vidstack** - For the powerful video player
- **Tailwind CSS** - For the utility-first styling system

---

## 📞 Contact

**Bax**  
Email: bax@sorai.tw  
Twitter: [@baxartworkz](https://x.com/baxartworkz)

---

<div align="center">

**Built with ❤️ and way too much caffeine**

</div>

---

# 🎬 Bax 的影片作品集

一個令人驚艷的現代化影片作品集網站，使用 Astro v5 建構，具備多種可自訂的版面配置、DASH 串流支援，以及無縫的 MDX 整合。

![Astro](https://img.shields.io/badge/Astro-5.16-FF5D01?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)

---

## ✨ 功能特色

### 🎨 **5 種獨特的作品集版面**
只需更改一個設定變數即可切換不同的視覺風格：

1. **置中版面** - 經典、簡潔的置中設計，專案分組顯示
2. **靠左對齊（Bax 風格）** - 大膽的編輯風格版面，搭配大型排版
3. **分割視圖** - 現代化側邊欄導航，搭配可捲動的內容區域
4. **Bento/馬賽克** - 動態網格，卡片大小多變，視覺效果豐富
5. **電影式捲動** - 全螢幕吸附區塊，沉浸式轉場效果

### � **進階影片支援**
- **DASH 串流** - 透過 Vidstack 支援 `.mpd` 檔案與自適應位元率串流
- **YouTube 嵌入** - 自動轉換 YouTube 影片網址
- **縮圖備援** - 當沒有提供影片網址時顯示專案縮圖
- **自訂影片播放器** - 基於 React 的 Vidstack 播放器，具備現代化控制介面

### 📝 **MDX 內容系統**
- **型別安全的內容集合** - 使用 Zod schema 驗證專案中繼資料
- **自訂元件** - `<Grid>`、`<YouTube>` 和 `<Video>` 元件，打造豐富內容
- **Frontmatter 支援** - 結構化專案資料（標題、客戶、角色、日期、類型、製作人員）

### 🎯 **現代化使用者體驗**
- **View Transitions** - 流暢的頁面導航動畫
- **主題切換** - 支援淺色/深色模式
- **響應式設計** - 採用 Tailwind CSS 的行動優先設計
- **模糊淡入動畫** - 優雅的內容進場效果
- **類型分組** - 依類型自動分類專案

---

## � 快速開始

### 前置需求
- [Bun](https://bun.sh/)（推薦）或 Node.js 18+

### 安裝步驟

```bash
# 複製專案
git clone <your-repo-url>
cd astro-bxwork

# 安裝相依套件
bun install

# 啟動開發伺服器
bun run dev
```

網站將在 `http://localhost:4321` 上運行

### 建構正式版本

```bash
# 建立最佳化的正式版本
bun run build

# 預覽正式版本
bun run preview
```

---

## 📁 專案結構

```
astro-bxwork/
├── src/
│   ├── components/
│   │   ├── mdx/              # 自訂 MDX 元件
│   │   │   ├── Grid.astro
│   │   │   ├── YouTube.astro
│   │   │   └── Video.astro
│   │   ├── ThemeToggle.tsx   # 深色/淺色模式切換
│   │   └── VideoPlayer.tsx   # Vidstack 播放器包裝器
│   ├── content/
│   │   ├── config.ts         # 內容集合 schema
│   │   └── work/             # 專案 MDX 檔案
│   │       └── cinematic/    # 依類型分類的子目錄
│   ├── layouts/
│   │   └── Layout.astro      # 基礎版面配置（含 SEO）
│   ├── pages/
│   │   ├── index.astro       # 首頁（5 種版面選項）
│   │   ├── 404.astro         # 自訂 404 頁面
│   │   └── work/
│   │       └── [...slug].astro  # 動態專案頁面
│   ├── styles/               # 全域樣式與動畫
│   └── lib/
│       └── utils.ts          # 工具函式（cn 等）
├── public/
│   ├── header.jpg            # 個人頭像
│   ├── og-image.png          # 社群媒體預覽圖
│   └── favico.jpg            # 網站圖示
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

---

## ⚙️ 設定

### 切換版面配置

編輯 `src/pages/index.astro` 並更改 `CURRENT_LAYOUT` 常數：

```typescript
// index.astro 第 12 行
const CURRENT_LAYOUT: number = 1; // 改為 1-5
```

### 個人資訊

在 `src/pages/index.astro` 中更新您的個人資訊：

```typescript
const PROFILE = {
    name: "您的名字",
    role: "您的職位 / 公司",
    email: "your@email.com",
    bio: "您的個人簡介",
    avatar: "/header.jpg",
    links: {
        twitter: "x.com/yourhandle",
        email: "mailto:your@email.com",
    },
};
```

### 新增專案

在 `src/content/work/` 中建立新的 `.mdx` 檔案：

```mdx
---
title: "專案標題"
client: "客戶名稱"
role: ["動態設計師", "剪輯師"]
date: 2024-01-15
genre: "Motion"
thumbnail: "/path/to/thumbnail.jpg"
videoUrl: "https://example.com/video.mpd" # 選填：.mpd、YouTube 網址，或省略
description: "專案描述"
credits: # 選填
  - name: "張三"
    role: "導演"
---

## 專案詳情

您的專案內容。可以使用自訂元件：

<YouTube url="https://youtube.com/watch?v=..." />

<Grid cols={2}>
  <Video src="/video1.mp4" />
  <Video src="/video2.mp4" />
</Grid>
```

---

## 🎨 自訂設定

### 主題顏色

編輯 `tailwind.config.mjs` 來自訂配色方案：

```javascript
theme: {
  extend: {
    colors: {
      primary: "hsl(var(--primary))",
      // ... 自訂其他顏色
    }
  }
}
```

### 動畫效果

自訂動畫定義在 `src/styles/` 中。專案包含：
- `animate-blur-in` - 淡入與模糊進場效果
- 階段式延遲，實現連續動畫
- 滑鼠懸停狀態的流暢轉場

---

## �️ 技術堆疊

| 技術 | 用途 |
|------|------|
| **Astro v5** | 採用 islands 架構的靜態網站生成器 |
| **React 19** | 互動式元件（主題切換、影片播放器） |
| **Tailwind CSS** | Utility-first 樣式框架 |
| **MDX** | 支援 JSX 的 Markdown，打造豐富內容 |
| **Vidstack** | 現代化影片播放器，支援 DASH |
| **TypeScript** | 型別安全的開發環境 |
| **Bun** | 快速的 JavaScript 執行環境與套件管理器 |

---

## 📦 主要相依套件

```json
{
  "@astrojs/mdx": "^4.3.13",
  "@astrojs/react": "^4.4.2",
  "@astrojs/tailwind": "^6.0.2",
  "@vidstack/react": "^1.12.13",
  "astro": "^5.16.9",
  "react": "^19.2.3",
  "tailwindcss": "^3.4.17"
}
```

---

## 🎯 內容 Schema

專案使用以下 Zod schema 進行驗證：

```typescript
{
  title: string,
  client: string,
  role: string[],
  date: Date,
  genre: string (預設: "Motion"),
  thumbnail: string,
  videoUrl?: string, // 選填
  description: string,
  credits?: Array<{
    name: string,
    role: string
  }>
}
```

---

## 🌐 部署

本專案可部署至任何靜態網站託管平台：

### Vercel
```bash
vercel deploy
```

### Netlify
```bash
netlify deploy --prod
```

### Cloudflare Pages
```bash
npm run build
# 上傳 dist/ 資料夾
```

---

## 📄 授權條款

本專案採用 GPL-3.0 授權條款 - 詳見 [LICENSE](LICENSE) 檔案。

---

## 🙏 致謝

- **Astro 團隊** - 提供絕佳的框架
- **Vidstack** - 提供強大的影片播放器
- **Tailwind CSS** - 提供 utility-first 樣式系統

---

## 📞 聯絡方式

**Bax**  
Email: bax@sorai.tw  
Twitter: [@baxartworkz](https://x.com/baxartworkz)

---

<div align="center">

**用 ❤️ 和過量的咖啡因打造**

</div>
