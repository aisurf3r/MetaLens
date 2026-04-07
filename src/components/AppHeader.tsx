import { motion } from "framer-motion";
import { ScanSearch, Download, Trash2 } from "lucide-react";

interface Props {
  imageCount: number;
  onExport: () => void;
  onClear: () => void;
}

export default function AppHeader({ imageCount, onExport, onClear }: Props) {
  return (
    <header className="flex items-center justify-between py-4">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <ScanSearch className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            <span className="gradient-text">MetaLens</span>
          </h1>
          <p className="text-xs text-muted-foreground">Image metadata explorer</p>
        </div>
      </motion.div>

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
