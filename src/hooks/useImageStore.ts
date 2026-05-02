import { useState, useCallback } from "react";
import exifr from "exifr";
import { ImageFile } from "@/types/image";

export function useImageStore() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newImages: ImageFile[] = [];

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) continue;

      const id = crypto.randomUUID();
      const url = URL.createObjectURL(file);

      let metadata: Record<string, any> | null = null;
      let gps: { latitude: number; longitude: number } | null = null;

      // Read into ArrayBuffer first — far more reliable on mobile (iOS Safari/Chrome)
      // where passing the File object directly to exifr can fail silently for GPS.
      let buffer: ArrayBuffer | null = null;
      try {
        buffer = await file.arrayBuffer();
      } catch {
        buffer = null;
      }

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

      // Dedicated GPS parser — most reliable path on mobile browsers.
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

      // Fallback to merged metadata if dedicated parser missed it.
      if (!gps && metadata) {
        tryAssignGps(metadata.latitude, metadata.longitude);
        if (!gps && metadata.GPSLatitude != null && metadata.GPSLongitude != null) {
          tryAssignGps(metadata.GPSLatitude, metadata.GPSLongitude);
        }
      }

      newImages.push({ id, file, url, name: file.name, size: file.size, metadata, gps });
    }

    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0 && !selectedId) {
      setSelectedId(newImages[0].id);
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
