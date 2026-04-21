# Admin System Documentation

## Overview

This project now includes a full admin dashboard for managing portfolio works directly from the browser.

## Features

- **Authentication**: JWT-based login with password protection
- **Notion-style Editor**: BlockNote-based block editor with drag-and-drop, slash commands, and image uploads
- **MDX Support**: Custom MDX component blocks for `<Grid>`, `<Video>`, `<YouTube>`, etc.
- **S3/R2 Image Upload**: Direct image uploads to S3-compatible storage
- **GitHub Integration**: Optional commit of MDX files to GitHub repo
- **Site Rebuild**: One-click rebuild from the admin dashboard

## URLs

| Route | Description |
|-------|-------------|
| `/admin/login` | Login page |
| `/admin` | Dashboard - list all works |
| `/admin/works/new` | Create new work |
| `/admin/works/edit/{slug}` | Edit existing work |

## Environment Variables

```env
# Admin Auth
ADMIN_PASSWORD=your-password
JWT_SECRET=your-jwt-secret

# GitHub API
GITHUB_TOKEN=ghp_xxx
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo
GITHUB_BRANCH=main

# S3 / R2 / Compatible Storage
S3_REGION=auto
S3_ENDPOINT=https://...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=your-bucket
S3_PUBLIC_URL=https://cdn.yourdomain.com
```

## VPS Deployment

### Build
```bash
bun run build
```

### Start Server
```bash
# With Node
bun run start

# With Bun
bun run start:bun
```

The server runs on port 4321 by default. Use `PORT=8080 bun run start:bun` to customize.

### Using PM2
```bash
pm2 start "bun run start:bun" --name portfolio
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Editor Usage

### Standard Blocks
Type `/` to open the slash menu. Available blocks:
- Heading 1/2/3
- Paragraph
- Bullet List
- Numbered List
- Quote
- Code Block
- Divider
- Image (drag & drop or paste)

### MDX Components
Type `/mdx` or select "MDX Component" from the slash menu to insert raw MDX. Example:
```mdx
<Grid variant="bento">
  <img src="https://cdn.example.com/image.jpg" />
  <img src="https://cdn.example.com/image2.jpg" />
</Grid>
```

### Image Upload
Images can be:
1. Dragged and dropped into the editor (uploads to S3 automatically)
2. Pasted from clipboard
3. Uploaded via the Thumbnail field in the form

## Data Flow

1. User writes content in BlockNote editor
2. Images upload to S3 via `/api/upload`
3. On save, the MDX file is written to `src/content/work/{genre}/{slug}.mdx`
4. If "Commit to GitHub" is checked, the file is also committed via GitHub API
5. User clicks "Rebuild Site" to regenerate the static site

## Architecture

- **Astro Hybrid**: Portfolio pages are static, admin pages are SSR
- **Node Adapter**: `@astrojs/node` in standalone mode for VPS deployment
- **API Routes**: All backend logic in `src/pages/api/*`
- **File System**: Works are read/written directly from `src/content/work/`
