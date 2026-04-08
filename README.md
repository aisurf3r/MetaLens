# 🔍 MetaLens

**Image metadata explorer** — Upload photos, inspect their hidden data, visualize GPS locations on a map, and export everything as JSON.

![MetaLens](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- 📁 **Multi-image upload** — Drag & drop or click to upload JPG, PNG, TIFF, WebP, and more
- 🔍 **Deep metadata extraction** — View EXIF, IPTC, XMP, GPS, ICC profiles, and all embedded data
- 🗺️ **Interactive map** — Visualize photo GPS coordinates on an OpenStreetMap-powered map
- 💾 **JSON export** — Export all extracted metadata as a structured JSON file
- 🗑️ **Image management** — Remove individual images or clear all at once
- 📱 **Responsive design** — Optimized for desktop, tablet, and mobile devices
- ✨ **Modern UI** — Glass-card effects, animated gradients, marching-ants upload zone, and smooth transitions

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation

```bash
git clone https://github.com/aisurf3r/MetaLens.git
cd MetaLens
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| UI Components | shadcn/ui + Radix UI |
| Animations | Framer Motion |
| Maps | Leaflet + React Leaflet |
| Metadata parsing | exifr |
| Icons | Lucide React |

## 📖 How It Works

1. **Upload** images via drag & drop or file picker
2. **Browse** thumbnails in the gallery — click to select
3. **Inspect** full metadata in the side panel (EXIF, GPS, camera info, timestamps, etc.)
4. **Locate** photos on the interactive map using embedded GPS data
5. **Export** all metadata as a downloadable JSON file

## 📂 Project Structure

```
src/
├── components/
│   ├── AppHeader.tsx        # Top bar with export/clear actions
│   ├── ImageGallery.tsx     # Thumbnail grid with selection
│   ├── MapView.tsx          # Leaflet map with GPS markers
│   ├── MetadataPanel.tsx    # Detailed metadata display
│   ├── UploadZone.tsx       # Drag & drop upload area
│   └── ui/                  # shadcn/ui primitives
├── hooks/
│   └── useImageStore.ts     # Central state management
├── types/
│   └── image.ts             # TypeScript interfaces
├── pages/
│   └── Index.tsx            # Main page layout
└── index.css                # Design tokens & custom styles
```

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📬 Contact

- GitHub: [@aisurf3r](https://github.com/aisurf3r)
- Email: [aisurf3r@gmail.com](mailto:aisurf3r@gmail.com)

## 📄 License

This project is open source under the [MIT License](LICENSE).
