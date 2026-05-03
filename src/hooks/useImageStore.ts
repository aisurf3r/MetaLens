import { useState, useCallback } from "react";
import exifr from "exifr";
import { ImageFile } from "@/types/image";
import { toast } from "@/hooks/use-toast";

const isAndroid = () =>
  typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

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

// Convert a DMS array [deg, min, sec] (or single decimal) to a decimal degree.
const dmsToDecimal = (dms: any, ref?: any): number | null => {
  let value: number | null = null;
  if (typeof dms === "number" && Number.isFinite(dms)) {
    value = dms;
  } else if (Array.isArray(dms) && dms.length >= 1) {
    const d = Number(dms[0]) || 0;
    const m = Number(dms[1] ?? 0) || 0;
    const s = Number(dms[2] ?? 0) || 0;
    value = d + m / 60 + s / 3600;
  }
  if (value == null || !Number.isFinite(value)) return null;
  if (typeof ref === "string") {
    const r = ref.trim().toUpperCase();
    if (r === "S" || r === "W") value = -Math.abs(value);
    else value = Math.abs(value);
  }
  return value;
};

const isValidLatLon = (la: number, lo: number) =>
  Number.isFinite(la) && Number.isFinite(lo) &&
  la >= -90 && la <= 90 && lo >= -180 && lo <= 180 &&
  !(la === 0 && lo === 0);

export function useImageStore() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newImages: ImageFile[] = [];
    let anyGpsFound = false;
    let anyMetadataFound = false;
    const android = isAndroid();

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) continue;

      const id = crypto.randomUUID();
      const url = URL.createObjectURL(file);

      let metadata: Record<string, any> | null = null;
      let gps: { latitude: number; longitude: number } | null = null;
      let strategy = "none";

      const buffer = await readArrayBuffer(file);
      const source: ArrayBuffer | File = buffer ?? file;

      if (android) {
        // eslint-disable-next-line no-console
        console.log("[MetaLens][android] file", {
          name: file.name,
          size: file.size,
          type: file.type,
          buffer: buffer ? buffer.byteLength : null,
        });
      }

      // Strategy 1: full parse forcing whole-file read (no chunk window).
      try {
        const allMeta = await exifr.parse(source, {
          tiff: true, ifd0: true, exif: true, gps: true,
          iptc: true, xmp: true, icc: true, jfif: true, ihdr: true,
          translateKeys: true, translateValues: true, reviveValues: true,
          mergeOutput: true,
          chunked: false,
          firstChunkSize: file.size || undefined,
          chunkSize: file.size || undefined,
        });
        if (allMeta) metadata = allMeta;
      } catch {
        metadata = null;
      }

      const tryAssignGps = (lat: any, lon: any) => {
        const la = Number(lat);
        const lo = Number(lon);
        if (isValidLatLon(la, lo)) {
          gps = { latitude: la, longitude: lo };
          return true;
        }
        return false;
      };

      // Strategy 2: decimal lat/lon already merged by exifr.
      if (metadata) {
        if (tryAssignGps(metadata.latitude, metadata.longitude)) strategy = "exifr-decimal";
      }

      // Strategy 3: raw GPSLatitude/GPSLongitude with refs (DMS arrays or numbers).
      if (!gps && metadata) {
        const latRaw = metadata.GPSLatitude ?? metadata.gps?.GPSLatitude;
        const lonRaw = metadata.GPSLongitude ?? metadata.gps?.GPSLongitude;
        const latRef = metadata.GPSLatitudeRef ?? metadata.gps?.GPSLatitudeRef;
        const lonRef = metadata.GPSLongitudeRef ?? metadata.gps?.GPSLongitudeRef;
        const la = dmsToDecimal(latRaw, latRef);
        const lo = dmsToDecimal(lonRaw, lonRef);
        if (la != null && lo != null && tryAssignGps(la, lo)) strategy = "raw-dms";
      }

      // Strategy 4: dedicated exifr.gps() as a last resort.
      if (!gps) {
        try {
          const gpsOnly = await exifr.gps(source);
          if (gpsOnly && tryAssignGps(gpsOnly.latitude, gpsOnly.longitude)) {
            strategy = "exifr-gps";
          }
        } catch {}
      }

      if (gps) {
        anyGpsFound = true;
        if (strategy === "none") strategy = "exifr-decimal";
      }
      if (metadata && Object.keys(metadata).length > 0) anyMetadataFound = true;

      if (android) {
        // eslint-disable-next-line no-console
        console.log("[MetaLens][android] parsed", {
          name: file.name,
          metadataKeys: metadata ? Object.keys(metadata).length : 0,
          gps,
          strategy,
        });
      }

      newImages.push({ id, file, url, name: file.name, size: file.size, metadata, gps });
    }

    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0 && !selectedId) {
      setSelectedId(newImages[0].id);
    }

    if (newImages.length > 0 && !anyGpsFound && android) {
      toast({
        title: anyMetadataFound ? "No GPS data could be read" : "No metadata could be read",
        description:
          "On Android, please pick the image from 'Files' or 'Documents' (not 'Gallery'). If it still fails, this browser may not expose GPS bytes for that file.",
        duration: 8000,
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
