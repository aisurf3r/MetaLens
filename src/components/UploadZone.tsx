import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, ImagePlus } from "lucide-react";

interface UploadZoneProps {
  onFiles: (files: FileList | File[]) => void;
}

const isAndroid = () =>
  typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

type FilePickerWindow = Window & {
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
    excludeAcceptAllOption?: boolean;
  }) => Promise<Array<{ getFile: () => Promise<File> }>>;
};

export default function UploadZone({ onFiles }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBrowse = useCallback(async () => {
    const picker = (window as FilePickerWindow).showOpenFilePicker;

    if (isAndroid() && picker) {
      try {
        const handles = await picker({
          multiple: true,
          types: [
            {
              description: "Original image files",
              accept: {
                "image/jpeg": [".jpg", ".jpeg"],
                "image/png": [".png"],
                "image/tiff": [".tif", ".tiff"],
                "image/webp": [".webp"],
                "image/heic": [".heic", ".heif"],
              },
            },
          ],
          excludeAcceptAllOption: false,
        });
        const files = await Promise.all(handles.map((handle) => handle.getFile()));
        if (files.length) onFiles(files);
        return;
      } catch {
        return;
      }
    }

    inputRef.current?.click();
  }, [onFiles]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    },
    [onFiles]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`upload-zone flex flex-col items-center justify-center gap-4 p-8 md:p-12 cursor-pointer select-none ${
        dragOver ? "drag-over" : ""
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={handleBrowse}
    >
      <motion.div
        animate={dragOver ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
        className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"
      >
        {dragOver ? (
          <ImagePlus className="w-7 h-7 text-primary" />
        ) : (
          <Upload className="w-7 h-7 text-primary" />
        )}
      </motion.div>
      <div className="text-center">
        <p className="text-foreground font-medium">Drop images here or tap to browse</p>
        <p className="text-muted-foreground text-sm mt-1">JPG, PNG, TIFF, WebP — multiple files supported</p>
      </div>
      {/*
        Important for Android: do NOT set the `capture` attribute and do NOT use
        `image/*` here. Some Android gallery/photo pickers strip EXIF/GPS during
        handoff. Specific extensions bias Chrome toward the document/file picker,
        and handleBrowse uses showOpenFilePicker on Android when available.
      */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.tiff,.tif,.webp,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />
    </motion.div>
  );
}
