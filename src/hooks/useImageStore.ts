import { useState, useCallback } from "react";
import exifr from "exifr";
import { ImageFile } from "@/types/image";
import { toast } from "@/hooks/use-toast";

const isAndroid = () =>
  typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

// Read the raw File into an ArrayBuffer. Tries the modern API first and
// falls back to FileReader, which is more reliable inside Android WebViews
// and some older mobile browsers.
const readArrayBuffer = (file: File): Promise<ArrayBuffer | null> =>
  new Promise((resolve) => {
    if (typeof file.arrayBuffer === "function") {
      file.arrayBuffer().then(
        (buf) => resolve(buf),
        () => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as ArrayBuffer) ?? null);
          reader.onerror = () => resolve(null);
          reader.readAsArrayBuffer(file);
        }
      );
    } else {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as ArrayBuffer) ?? null);
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(file);
    }
  });

export function useImageStore() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newImages: ImageFile[] = [];
    let anyGpsFound = false;
    let anyMetadataFound = false;

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) continue;

      const id = crypto.randomUUID();
      const url = URL.createObjectURL(file);

      let metadata: Record<string, any> | null = null;
      let gps: { latitude: number; longitude: number } | null = null;

      // ALWAYS read the raw File bytes first — before any canvas/base64 work —
      // so EXIF segments survive on mobile browsers (especially Android WebView).
      const buffer = await readArrayBuffer(file);
      const source: ArrayBuffer | File = buffer ?? file;

      try {
        const allMeta = await exifr.parse(source, {
          tiff: true, exif: true, gps: true, iptc: true, xmp: true,
          icc: true, jfif: true, ihdr: true,
          translateKeys: true, translateValues: true, reviveValues: true,
          mergeOutput: true,
        });
        if (allMeta) metadata = allMeta;
      } catch {
        metadata = null;
      }

      const tryAssignGps = (lat: any, lon: any) => {
        const la = Number(lat);
        const lo = Number(lon);
        if (
          Number.isFinite(la) && Number.isFinite(lo) &&
          la >= -90 && la <= 90 && lo >= -180 && lo <= 180 &&
          !(la === 0 && lo === 0)
        ) {
          gps = { latitude: la, longitude: lo };
          return true;
        }
        return false;
      };

      try {
        const gpsOnly = await exifr.gps(source);
        if (gpsOnly) tryAssignGps(gpsOnly.latitude, gpsOnly.longitude);
      } catch {}

      if (!gps && metadata) {
        tryAssignGps(metadata.latitude, metadata.longitude);
        if (!gps && metadata.GPSLatitude != null && metadata.GPSLongitude != null) {
          tryAssignGps(metadata.GPSLatitude, metadata.GPSLongitude);
        }
      }

      if (gps) anyGpsFound = true;
      if (metadata && Object.keys(metadata).length > 0) anyMetadataFound = true;

      newImages.push({ id, file, url, name: file.name, size: file.size, metadata, gps });
    }

    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0 && !selectedId) {
      setSelectedId(newImages[0].id);
    }

    // Android UX hint: gallery pickers (Samsung/Xiaomi/MIUI) often strip EXIF.
    if (newImages.length > 0 && !anyGpsFound && isAndroid()) {
      toast({
        title: anyMetadataFound ? "No GPS data found" : "No metadata found",
        description:
          "Tip: On Android, pick your images using 'Files' or 'Documents' instead of 'Gallery' to preserve location data.",
        duration: 7000,
      });
    }
  }, [selectedId]);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter((i) => i.id !== id);
    });
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setSelectedId(null);
  }, [images]);

  const selected = images.find((i) => i.id === selectedId) || null;

  const exportJSON = useCallback(() => {
    const data = images.map((img) => ({
      name: img.name,
      size: img.size,
      metadata: img.metadata,
      gps: img.gps,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "metadata-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [images]);

  return { images, selected, selectedId, setSelectedId, addFiles, removeImage, clearAll, exportJSON };
}
