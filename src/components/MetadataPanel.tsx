import { motion, AnimatePresence } from "framer-motion";
import { ImageFile } from "@/types/image";
import { Info, Camera, Aperture, Timer, Ruler, MapPin, Calendar, FileText, Tag } from "lucide-react";
import { useState } from "react";

interface Props {
  image: ImageFile | null;
}

const SECTIONS = [
  { key: "overview", label: "Overview", icon: Info },
  { key: "camera", label: "Camera", icon: Camera },
  { key: "gps", label: "Location", icon: MapPin },
  { key: "all", label: "All Data", icon: FileText },
] as const;

type Section = (typeof SECTIONS)[number]["key"];

function categorize(metadata: Record<string, any>) {
  const camera: Record<string, any> = {};
  const overview: Record<string, any> = {};

  const cameraKeys = [
    "Make", "Model", "LensModel", "LensMake", "FocalLength", "FocalLengthIn35mmFormat",
    "FNumber", "ExposureTime", "ISO", "ISOSpeedRatings", "ShutterSpeedValue",
    "ApertureValue", "ExposureBiasValue", "MeteringMode", "Flash", "WhiteBalance",
    "ExposureProgram", "ExposureMode", "DigitalZoomRatio",
  ];

  const overviewKeys = [
    "ImageWidth", "ImageHeight", "ExifImageWidth", "ExifImageHeight",
    "DateTimeOriginal", "CreateDate", "ModifyDate", "Software",
    "Orientation", "ColorSpace", "BitsPerSample", "XResolution", "YResolution",
  ];

  for (const [k, v] of Object.entries(metadata)) {
    if (k === "latitude" || k === "longitude") continue;
    if (cameraKeys.some((ck) => k.toLowerCase() === ck.toLowerCase())) camera[k] = v;
    else if (overviewKeys.some((ok) => k.toLowerCase() === ok.toLowerCase())) overview[k] = v;
  }

  return { camera, overview };
}

function formatValue(v: any): string {
  if (v instanceof Date) return v.toLocaleString();
  if (typeof v === "object" && v !== null) return JSON.stringify(v);
  return String(v);
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border/30 last:border-0">
      <span className="metadata-key shrink-0">{label}</span>
      <span className="metadata-value text-right break-all">{value}</span>
    </div>
  );
}

export default function MetadataPanel({ image }: Props) {
  const [section, setSection] = useState<Section>("overview");

  if (!image) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
        <Tag className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground text-sm">Select an image to view metadata</p>
      </div>
    );
  }

  const meta = image.metadata || {};
  const { camera, overview } = categorize(meta);

  const renderSection = () => {
    switch (section) {
      case "overview":
        return Object.keys(overview).length ? (
          Object.entries(overview).map(([k, v]) => <MetaRow key={k} label={k} value={formatValue(v)} />)
        ) : (
          <p className="text-muted-foreground text-sm py-4">No overview data found</p>
        );
      case "camera":
        return Object.keys(camera).length ? (
          Object.entries(camera).map(([k, v]) => <MetaRow key={k} label={k} value={formatValue(v)} />)
        ) : (
          <p className="text-muted-foreground text-sm py-4">No camera data found</p>
        );
      case "gps":
        return image.gps ? (
          <>
            <MetaRow label="Latitude" value={image.gps.latitude.toFixed(6)} />
            <MetaRow label="Longitude" value={image.gps.longitude.toFixed(6)} />
          </>
        ) : (
          <p className="text-muted-foreground text-sm py-4">No GPS data embedded</p>
        );
      case "all":
        return Object.keys(meta).length ? (
          Object.entries(meta)
            .filter(([k]) => k !== "thumbnail" && k !== "ThumbnailImage")
            .map(([k, v]) => <MetaRow key={k} label={k} value={formatValue(v)} />)
        ) : (
          <p className="text-muted-foreground text-sm py-4">No metadata found</p>
        );
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Image preview */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="font-mono text-sm font-medium text-foreground truncate">{image.name}</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {image.gps && <span className="tag-pill text-[10px] gap-1"><MapPin className="w-2.5 h-2.5" /> GPS</span>}
            {meta.Make && <span className="tag-pill text-[10px] gap-1"><Camera className="w-2.5 h-2.5" /> {meta.Make}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 overflow-x-auto scrollbar-thin">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
              section === s.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          <motion.div
            key={section + image.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
