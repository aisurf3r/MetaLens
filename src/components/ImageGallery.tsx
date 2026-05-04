import { motion, AnimatePresence } from "framer-motion";
import { Trash2, MapPin } from "lucide-react";
import { ImageFile } from "@/types/image";

interface Props {
  images: ImageFile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDeselect?: () => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function ImageGallery({ images, selectedId, onSelect, onRemove, onDeselect }: Props) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3"
      onClick={(e) => {
        // Deselect when clicking the grid background (not a card)
        if (e.target === e.currentTarget) onDeselect?.();
      }}>
      <AnimatePresence mode="popLayout">
        {images.map((img) => (
          <motion.div
            key={img.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25 }}
            onClick={() => onSelect(img.id)}
            className={`group relative rounded-xl overflow-hidden cursor-pointer aspect-square border-2 transition-colors duration-200 ${
              selectedId === img.id
                ? "border-primary glow-border"
                : "border-transparent hover:border-border"
            }`}
          >
            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
              <p className="text-xs font-mono text-foreground truncate">{img.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(img.size)}</p>
            </div>

            {/* GPS indicator */}
            {img.gps && (
              <div className="absolute top-1.5 left-1.5">
                <div className="tag-pill gap-1 text-[10px]">
                  <MapPin className="w-2.5 h-2.5" /> GPS
                </div>
              </div>
            )}

            {/* Delete button */}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-destructive/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-destructive-foreground hover:bg-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
