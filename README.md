# 🔍 MetaLens
<img width="1606" height="844" alt="{FBC9C4E5-F844-4100-B74C-0C0E1535C471}" src="https://github.com/user-attachments/assets/bb30b44e-aacd-4cf8-b6cd-d7e408571dac" />
<img width="1505" height="908" alt="{484EC475-8A7E-464A-BD7D-5D69A2EA18B8}" src="https://github.com/user-attachments/assets/58b29a23-4024-465c-865b-b801423b1331" />


**Image metadata explorer** — Upload photos, inspect EXIF/IPTC/XMP data, visualize GPS locations on a map, and export everything as JSON.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

---

## ✨ Features

- 📁 **Multi-image upload** — Drag & drop or click to upload JPG, PNG, TIFF, WebP and more
- 🔍 **Rich metadata extraction** — View EXIF, IPTC, XMP, ICC, JFIF, and IHDR data
- 🗺️ **Interactive map** — GPS coordinates on an OpenStreetMap map, shown only when the selected image has valid GPS data
- 💾 **JSON export** — Per-image or full-batch metadata export
- 🧹 **Metadata eraser** — Download a clean copy of any image with all EXIF/GPS/IPTC/XMP stripped (canvas re-encode)
- 📱 **Mobile-safe map** — Hardened against the classic Leaflet "black screen / NaN LatLng" crash via error boundary, GPS validation and `invalidateSize` on mount
- 🗑️ **Image management** — Remove individual images or clear all at once
- 🎨 **Modern UI** — Dark editorial theme, animated gradient title, marching-ants drop zone, glassmorphism cards
- 🔗 **Minimal footer bar** — Fixed `#18DCAB` strip pinned to the bottom on every device

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/)

### Installation

```bash
# Clone the repository
git clone https://github.com/aisurf3r/MetaLens.git
cd MetaLens

# Install dependencies
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript 5** | Type safety |
| **Vite 5** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **Framer Motion** | Animations |
| **Leaflet + React Leaflet** | Interactive maps |
| **exifr** | EXIF/metadata parsing |
| **shadcn/ui** | UI component library |
| **Lucide React** | Icon set |

## 📖 Usage

1. **Upload images** — Drag files onto the upload zone or click to browse
2. **Select an image** — Click a thumbnail in the gallery to view its metadata
3. **Explore metadata** — The right panel shows all extracted EXIF, IPTC, XMP, and other data
4. **View locations** — Images with GPS data appear as markers on the interactive map
5. **Export data** — Use "Export metadata" in the metadata panel to download a JSON for the selected image, or the global export action for the full batch
6. **Erase metadata** — Click "Erase metadata" to download a clean copy of the image with all EXIF/GPS/IPTC/XMP removed

## 📁 Project Structure

```
src/
├── components/       # UI components
│   ├── ui/           # shadcn/ui base components
│   ├── AppHeader.tsx  # Top navigation bar
│   ├── ImageGallery.tsx # Thumbnail grid
│   ├── MapView.tsx    # Leaflet map component
│   ├── MetadataPanel.tsx # Metadata display panel
│   └── UploadZone.tsx # Drag & drop upload area
├── hooks/
│   └── useImageStore.ts # Image state management
├── pages/
│   └── Index.tsx      # Main page
├── types/
│   └── image.ts       # TypeScript interfaces
└── index.css          # Design tokens & global styles
```
TODO: fix mobile map loading. (fucking nightmare)

## 📄 License

MIT

**aisurf3r** — [GitHub](https://github.com/aisurf3r) 
