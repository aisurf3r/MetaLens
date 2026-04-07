import { motion } from "framer-motion";
import { Download, Trash2 } from "lucide-react";

interface Props {
  imageCount: number;
  onExport: () => void;
  onClear: () => void;
}

export default function AppHeader({ imageCount, onExport, onClear }: Props) {
  return (
    <header className="flex items-center justify-end py-4">
      {imageCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </motion.div>
      )}
    </header>
  );
}
