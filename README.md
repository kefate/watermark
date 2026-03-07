# 图片批量水印工具 / Batch Image Watermark Tool

> 🛡️ 100% 浏览器端处理，零网络请求，零服务器依赖。您甚至可以断网使用。
>
> 🛡️ 100% browser-side processing. Zero network requests, zero server dependency. You can even use it offline.

[中文](#中文说明) | [English](#english)

---

## 中文说明

### 简介

一款专为**身份证、护照、驾照**等敏感文档设计的本地批量水印工具。所有图片处理均在浏览器内通过 HTML5 Canvas API 完成——**图片永不离开您的设备**。

- ✅ **完全本地化** — 无任何外部 JS/CSS 依赖，无网络请求，可离线使用
- ✅ **批量处理** — 一次上传多张图片，统一添加水印并批量下载
- ✅ **双语界面** — 中文 / English 一键切换，水印默认文字随语言自动适配
- ✅ **设置缓存** — 水印参数通过 `localStorage` 持久化，下次打开自动恢复
- ✅ **双格式导出** — 无损 PNG 或压缩 JPG，下载时实时按所选格式编码
- ✅ **响应式设计** — 桌面端与移动端均有良好体验

### 功能特性

| 功能 | 说明 |
|------|------|
| 水印文字 | 自定义文字内容，切换语言时自动提供对应默认文案 |
| 水印颜色 | RGB 取色器 + 5 种常用快捷色（黑、白、红、蓝、灰） |
| 透明度 | 0–100% 连续可调，拖动时实时显示当前值 |
| 字号 | 10–100 px 连续可调 |
| 间隔 | 50–500 px 连续可调，控制水印平铺密度 |
| 拖拽上传 | 支持点击选择或拖拽上传，支持多文件 |
| 缩略图预览 | 预览区使用压缩缩略图加速渲染 |
| 灯箱查看 | 点击预览卡片弹出全分辨率大图 |
| 批量下载 | 逐张触发浏览器下载，自动追加 `-watermarked` 后缀 |

### 架构设计

整个项目由**单一 HTML 文件** (`watermark.html`) 构成，零外部依赖，结构清晰地分为三层：

```
watermark.html
├── <style>   — CSS 设计系统 (Design Tokens + 组件样式 + 响应式断点)
├── <body>    — 语义化 HTML 结构 (隐私横幅 / 设置面板 / 上传区 / 预览区 / 灯箱)
└── <script>  — 纯 JavaScript 逻辑
     ├── I18N          — 国际化资源对象 (zh / en)
     ├── DOM Cache     — 一次性缓存所有 DOM 引用，避免重复查询
     ├── setLang()     — 语言切换：更新所有文案节点 + 自动适配水印默认文字
     ├── saveSettings / loadSettings — localStorage 读写配置持久化
     ├── stampWatermark()  — Canvas 水印合成核心算法
     ├── makeThumbnail()   — 缩小 Canvas 生成 JPEG 缩略图
     ├── generatePreviews() — 批量生成预览卡片，存储 Canvas 对象
     ├── downloadAll()     — 下载时从 Canvas 实时编码为目标格式
     └── Event Wiring      — 滑块 / 颜色 / 拖拽 / 灯箱等事件绑定
```

### 水印算法

水印合成由 `stampWatermark()` 函数实现，基于 HTML5 Canvas 2D API：

1. **创建画布** — 以原始图片尺寸初始化 `<canvas>`，绘制原始图片作为底层。
2. **配置画笔** — 设置 `fillStyle`（颜色）、`globalAlpha`（透明度）、`font`（字号 + 系统字体栈）。
3. **计算平铺网格** — 以图片对角线长度 `√(w² + h²)` 为基准，按用户设定的间隔 (`spacing`) 计算所需的行数和列数，确保水印在旋转后仍能完全覆盖画布。
4. **旋转平铺绘制** — 以画布中心为原点，对每个网格点执行 `translate → rotate(-45°) → fillText`，实现 -45° 倾斜平铺水印效果。

```
对角线 = √(width² + height²)
列数   = ⌈对角线 / (间隔 × 1.5)⌉
行数   = ⌈对角线 / 间隔⌉

遍历 r ∈ [-行数, 行数), c ∈ [-列数, 列数):
    x = width/2  + c × 间隔 × 1.5
    y = height/2 + r × 间隔
    在 (x, y) 处旋转 -45° 绘制文字
```

### 导出编码

- **PNG** — 调用 `canvas.toDataURL('image/png')`，无损编码。
- **JPG** — 调用 `canvas.toDataURL('image/jpeg', 0.85)`，质量系数 0.85，将文件体积大幅压缩。
- 编码在**下载时实时生成**（非预览时缓存），确保始终使用用户最新选择的格式。

### 隐私保障

- **零网络请求** — 未引入任何 CDN、字体文件、分析脚本或外部资源
- **零服务器逻辑** — 纯静态 HTML，可直接通过 `file://` 协议在本地打开
- **零数据持久化** — 图片数据仅存在于浏览器内存中，关闭页面即释放；`localStorage` 仅保存 UI 设置参数

### 快速使用

1. 使用浏览器打开 `watermark.html`（可选：断开网络以验证离线可用性）
2. 设置水印文字、颜色、透明度、字号、间隔
3. 上传一张或多张图片
4. 选择导出格式（PNG / JPG）
5. 点击"预览效果"查看结果，点击预览卡片可放大查看
6. 点击"下载全部"保存加水印后的图片

---

## English

### Overview

A privacy-first batch watermark tool designed for **sensitive documents** such as ID cards, passports, and driver licenses. All image processing is performed locally in your browser via HTML5 Canvas API — **your images never leave your device**.

- ✅ **Fully local** — Zero external JS/CSS dependencies, zero network requests, works offline
- ✅ **Batch processing** — Upload multiple images at once, apply watermarks and download in batch
- ✅ **Bilingual UI** — Chinese / English toggle with auto-adapted default watermark text
- ✅ **Persistent settings** — Watermark parameters cached via `localStorage`, restored on revisit
- ✅ **Dual export formats** — Lossless PNG or compressed JPG, encoded on-the-fly at download time
- ✅ **Responsive design** — Optimised for both desktop and mobile browsers

### Features

| Feature | Description |
|---------|-------------|
| Watermark text | Custom text; default text auto-switches when language changes |
| Watermark color | Native RGB picker + 5 quick-select presets (black, white, red, blue, grey) |
| Opacity | Continuously adjustable 0–100%, current value shown in real time |
| Font size | 10–100 px range |
| Spacing | 50–500 px range, controls tiling density |
| Drag & drop upload | Click or drag to upload; multi-file supported |
| Thumbnail preview | Preview grid uses compressed thumbnails for fast rendering |
| Lightbox viewer | Click a preview card to view the full-resolution watermarked image |
| Batch download | Downloads triggered one by one with auto-appended `-watermarked` suffix |

### Architecture

The entire project consists of a **single HTML file** (`watermark.html`) with zero external dependencies, clearly separated into three layers:

```
watermark.html
├── <style>   — CSS design system (tokens + component styles + responsive breakpoints)
├── <body>    — Semantic HTML (privacy banner / settings panel / upload zone / preview grid / lightbox)
└── <script>  — Pure JavaScript logic
     ├── I18N              — Locale resource objects (zh / en)
     ├── DOM Cache         — One-time cached DOM references to avoid repeated queries
     ├── setLang()         — Language switch: updates all text nodes + adapts default watermark text
     ├── saveSettings / loadSettings — localStorage read/write for persistent configuration
     ├── stampWatermark()  — Core Canvas watermark compositing algorithm
     ├── makeThumbnail()   — Downscales Canvas to a JPEG thumbnail
     ├── generatePreviews() — Batch-generates preview cards; stores Canvas objects
     ├── downloadAll()     — Encodes from Canvas to selected format at download time
     └── Event Wiring      — Slider / colour / drag-drop / lightbox event bindings
```

### Watermark Algorithm

Watermark compositing is handled by the `stampWatermark()` function using the HTML5 Canvas 2D API:

1. **Create canvas** — Initialise a `<canvas>` matching the source image dimensions; draw the original image as the base layer.
2. **Configure brush** — Set `fillStyle` (colour), `globalAlpha` (opacity), and `font` (size + system font stack).
3. **Compute tiling grid** — Use the image diagonal `√(w² + h²)` as the reference length. Divide by user-defined `spacing` to calculate the number of rows and columns, ensuring the watermark fully covers the canvas even after rotation.
4. **Rotated tiling draw** — For each grid point, perform `translate → rotate(-45°) → fillText` centered on the canvas, producing a uniform -45° tiled watermark pattern.

```
diagonal = √(width² + height²)
cols     = ⌈diagonal / (spacing × 1.5)⌉
rows     = ⌈diagonal / spacing⌉

for r in [-rows, rows), c in [-cols, cols):
    x = width/2  + c × spacing × 1.5
    y = height/2 + r × spacing
    draw text at (x, y) rotated by -45°
```

### Export Encoding

- **PNG** — `canvas.toDataURL('image/png')`, lossless encoding.
- **JPG** — `canvas.toDataURL('image/jpeg', 0.85)`, quality factor 0.85, significantly reducing file size.
- Encoding is performed **on-the-fly at download time** (not cached at preview time), ensuring the user's latest format choice is always respected.

### Privacy Guarantee

- **Zero network requests** — No CDNs, font files, analytics scripts, or external resources of any kind
- **Zero server logic** — Pure static HTML; can be opened directly via the `file://` protocol
- **Zero data persistence** — Image data lives only in browser memory and is released when the tab closes; `localStorage` stores only UI setting parameters

### Quick Start

1. Open `watermark.html` in any modern browser (optionally disconnect from the network to verify offline capability)
2. Configure watermark text, colour, opacity, font size, and spacing
3. Upload one or more images
4. Select export format (PNG / JPG)
5. Click "Preview" to review results; click any preview card to view full-size
6. Click "Download All" to save the watermarked images

---

## License

[GPL-3.0](LICENSE)
