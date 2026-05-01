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

      try {
        const allMeta = await exifr.parse(file, { 
          tiff: true, exif: true, gps: true, iptc: true, xmp: true,
          icc: true, jfif: true, ihdr: true,
          translateKeys: true, translateValues: true, reviveValues: true,
        });
        if (allMeta) {
          metadata = allMeta;
          const lat = Number(allMeta.latitude);
          const lon = Number(allMeta.longitude);
          if (
            Number.isFinite(lat) && Number.isFinite(lon) &&
            lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 &&
            !(lat === 0 && lon === 0)
          ) {
            gps = { latitude: lat, longitude: lon };
          }
        }
      } catch {
        metadata = null;
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
