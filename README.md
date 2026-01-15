![Cover](https://files.catbox.moe/kxkzv3.png)

<div align="center">
    
# Regulus 

</div>


<div align="center">

An Astro portfolio template for designer, filmmaker, or any type of creator. 

[![License]](LICENSE)

[![Star on GitHub](https://img.shields.io/github/stars/Batkixni/astro-regulus.svg?style=social)](https://github.com/Batkixni/astro-regulus/stargazers)
![Astro](https://img.shields.io/badge/Astro-FF5D01?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/Bun-CA9360?logo=bun&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-232323?logo=tailwind-css&logoColor=white)
![shadcnui](https://img.shields.io/badge/shadcnui-232323?logo=shadcnui&logoColor=white)  


|**Layout 1**|
| ------------------------------------------ |
| ![Preview 1](https://files.catbox.moe/vf51c0.png) |

| Layout 2 | Layout 3 |
| ------------------------------------------ | ------------------------------------------ |
| ![Preview 2](https://files.catbox.moe/sfwbxz.png) | ![Preview 3](https://files.catbox.moe/rm090h.png) |

## Tech Stack

| [Astro v5](https://astro.build/) | [React 19](https://react.dev/) | [Tailwind CSS](https://tailwindcss.com/) | [shadcn/ui](https://ui.shadcn.com/) | [MDX](https://mdxjs.com/) | [Vidstack](https://vidstack.io/) | [TypeScript](https://www.typescriptlang.org/) | [Bun](https://bun.com/) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |


[English](#english) | [正體中文](#正體中文)

</div>

# English

---

## ✨ Features

- Tailored for Creatives – Specifically designed for designers and creative professionals to showcase their work.
- Seamless Experience & Peak Performance – Effortless to use and lightning-fast to deploy, powered by the cutting-edge performance of Astro and Bun.
- Fully Customizable Themes – Built with shadcn/ui and Tailwind CSS, offering deep customization and a variety of beautiful built-in themes.
- Versatile Layout Options – Switch between three distinct layouts anytime to find the perfect fit for your style.
- SEO Optimized – High visibility guaranteed with automated Open Graph tags generated for every project page.
- MDX-Powered Content – Build your portfolio as easily as writing a blog post using the flexibility of MDX.

---

---

## 📹 Example Instances

| [Bax Portfolio](https://bax.sorai.tw) |
| :--- |

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

## ⚙️ Configuration

### Switching Layouts

Edit `src/pages/index.astro` and change the `CURRENT_LAYOUT` constant:

```typescript
// Line 12 in index.astro
const CURRENT_LAYOUT: number = 1; // Change to 1-3
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
date: 2026-01-15
genre: "Motion"
thumbnail: "/path/to/thumbnail.jpg"
videoUrl: "https://example.com/video.mpd" # Optional: .mpd/.m3u8, YouTube URL, or omit
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

<Grid variant="bento">
  <img src="/picture1.jpg" alt="Vertical" />
  <img src="/picture2.jpg" alt="Horizontal 1" />
  <img src="/picture3.jpg" alt="Horizontal 2" />
</Grid>
```

### Video Utils

To embed Youtube video, you can use the following syntax in your .mdx file.

```mdx
<YouTube url="https://youtube.com/watch?v=..." />
```

Else, if you want to embed other videos outside from Youtube, use:

```mdx
<Video src="/video-example.mp4" />
```

### Grid Utils

To create grid in pages, you can use the following syntax in your .mdx file.

#### Auto grid

```mdx
<Grid cols={2}>
  <Video src="/video1.mp4" />
  <Video src="/video2.mp4" />
</Grid>
```
In this case, means you will have a 2 collum data in 1 row.
Following this logic, for more examples:

```mdx
<Grid cols={3}>
  <Video src="/video1.mp4" />
  <Video src="/video2.mp4" />
  <Video src="/video3.mp4" />
  <Video src="/video4.mp4" />
  <Video src="/video5.mp4" />
  <Video src="/video6.mp4" />
</Grid>
```
This means you will generate a 2 row data with 3 collum inside.

#### Bento grid

```mdx
<Grid variant="bento">
  <img src="/picture1.jpg"/>
  <img src="/picture2.jpg"/>
  <img src="/picture3.jpg">
</Grid>
```

This will create a responsive bento grid for these 3 pictures, the picture will automaticlly fit into the grid.
![Bento Grid](https://files.catbox.moe/wu48cw.png)

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
bun run build
# Upload dist/ folder
```

---

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

> [!WARNING]
> The license dose not include example or placeholder pictures contain in this template, all rights to these photos are reserved by Bax.

---

# 正體中文

## ✨ 功能特色

- **為創作者量身打造** – 專為設計師與創意工作者設計，用於展示個人作品。
- **順暢體驗與極致效能** – 使用上毫不費力、部署速度飛快，由 Astro 與 Bun 提供前沿效能。
- **完整主題客製化** – 基於 shadcn/ui 與 Tailwind CSS 打造，提供深度客製能力與多款精美內建主題。
- **多樣化版面配置** – 可隨時在三種不同版型之間切換，找到最符合你風格的呈現方式。
- **SEO 最佳化** – 每個專案頁面都會自動產生 Open Graph 標籤，確保高度曝光。
- **MDX 驅動內容** – 像寫部落格一樣輕鬆建立作品集，享受 MDX 帶來的高度彈性。

---

---

## 📹 範例網站

| [Bax Portfolio](https://bax.sorai.tw) |
| :--- |

---

## 🚀 快速開始

### 需求環境
- [Bun](https://bun.sh/)（推薦）或 Node.js 18+

### 安裝

```bash
# 複製專案
git clone <your-repo-url>
cd astro-bxwork

# 安裝相依套件
bun install

# 啟動開發伺服器
bun run dev
````

網站將會在 `http://localhost:4321` 提供服務

### 建置正式版本

```bash
# 建立最佳化的正式環境版本
bun run build

# 預覽正式版本
bun run preview
```

---

## ⚙️ 設定

### 切換版型配置

編輯 `src/pages/index.astro`，修改 `CURRENT_LAYOUT` 常數：

```ts
// index.astro 第 12 行
const CURRENT_LAYOUT: number = 1; // 可設為 1-3
```

### 個人資料設定

在 `src/pages/index.astro` 更新你的個人資訊：

```ts
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

### 新增專案

在 `src/content/work/` 建立新的 `.mdx` 檔案：

```mdx
---
title: "Project Title"
client: "Client Name"
role: ["Motion Designer", "Editor"]
date: 2026-01-15
genre: "Motion"
thumbnail: "/path/to/thumbnail.jpg"
videoUrl: "https://example.com/video.mpd" # 選填：.mpd/.m3u8、YouTube 連結，或省略
description: "Project description"
credits: # 選填
  - name: "John Doe"
    role: "Director"
---

## 專案說明

你的專案內容寫在這裡，你可以使用自訂元件：

<YouTube url="https://youtube.com/watch?v=..." />

<Grid cols={2}>
  <Video src="/video1.mp4" />
  <Video src="/video2.mp4" />
</Grid>

<Grid variant="bento">
  <img src="/picture1.jpg" alt="Vertical" />
  <img src="/picture2.jpg" alt="Horizontal 1" />
  <img src="/picture3.jpg" alt="Horizontal 2" />
</Grid>
```

### 影片工具

若要嵌入 YouTube 影片，可在 `.mdx` 檔案中使用以下語法：

```mdx
<YouTube url="https://youtube.com/watch?v=..." />
```

若要嵌入非 YouTube 的影片，請使用：

```mdx
<Video src="/video-example.mp4" />
```

### Grid 工具

你可以在頁面中建立 Grid 排版，使用以下語法。

#### 自動 Grid

```mdx
<Grid cols={2}>
  <Video src="/video1.mp4" />
  <Video src="/video2.mp4" />
</Grid>
```

上述範例代表一列中有 2 個欄位。依此類推，例如：

```mdx
<Grid cols={3}>
  <Video src="/video1.mp4" />
  <Video src="/video2.mp4" />
  <Video src="/video3.mp4" />
  <Video src="/video4.mp4" />
  <Video src="/video5.mp4" />
  <Video src="/video6.mp4" />
</Grid>
```

這代表會產生 2 列，每列 3 個欄位的版面。

#### Bento Grid

```mdx
<Grid variant="bento">
  <img src="/picture1.jpg"/>
  <img src="/picture2.jpg"/>
  <img src="/picture3.jpg">
</Grid>
```

這會建立一個響應式的 Bento Grid，圖片會自動適配版面配置。
![Bento Grid](https://files.catbox.moe/wu48cw.png)

---

## 🎨 客製化

### 主題顏色

編輯 `tailwind.config.mjs` 來自訂配色：

```js
theme: {
  extend: {
    colors: {
      primary: "hsl(var(--primary))",
      // ... 其他顏色設定
    }
  }
}
```

---

## 🎯 內容結構 Schema

專案內容會依照以下 Zod Schema 驗證：

```ts
{
  title: string,
  client: string,
  role: string[],
  date: Date,
  genre: string (預設值: "Motion"),
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

此專案可部署至任何靜態網站平台：

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
bun run build
# 上傳 dist/ 資料夾
```

---

## 📄 授權條款

本專案採用 GPL-3.0 授權，詳情請參閱 [LICENSE](LICENSE) 檔案。

> [!WARNING]
> 此專案版權許可並不包含此模板含有的占位符或範例圖片，那些圖片的版權唯一持有者為Bax。

---

<div align="center">

**Built with ❤️ by [Bax](https://kita.sorai.tw/bax)**

</div>



[License]: https://img.shields.io/github/license/Batkixni/astro-regulus?color=0a0a0a&logo=github&logoColor=fff&style=for-the-badge
