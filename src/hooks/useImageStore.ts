import { useState, useCallback } from "react";
import exifr from "exifr";
import { ImageFile } from "@/types/image";

type GpsPoint = { latitude: number; longitude: number };

const isValidGpsPoint = (lat: number, lon: number): boolean =>
  Number.isFinite(lat) && Number.isFinite(lon) &&
  lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 &&
  !(lat === 0 && lon === 0);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const rationalToNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const fraction = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (fraction) {
      const numerator = Number(fraction[1]);
      const denominator = Number(fraction[2]);
      return denominator ? numerator / denominator : null;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (Array.isArray(value) && value.length === 2) {
    const numerator = rationalToNumber(value[0]);
    const denominator = rationalToNumber(value[1]);
    return numerator !== null && denominator ? numerator / denominator : null;
  }
  if (isRecord(value)) {
    const numerator = value.numerator ?? value.num ?? value.n;
    const denominator = value.denominator ?? value.den ?? value.d;
    if (numerator != null && denominator != null) {
      const n = Number(numerator);
      const d = Number(denominator);
      return Number.isFinite(n) && Number.isFinite(d) && d ? n / d : null;
    }
  }
  return null;
};

const dmsToDecimal = (value: unknown, ref?: unknown): number | null => {
  const direction = String(ref ?? "").trim().toUpperCase();
  let sign = direction === "S" || direction === "W" ? -1 : 1;

  if (typeof value === "number") return Number.isFinite(value) ? value * sign : null;

  if (Array.isArray(value)) {
    const parts = value.map(rationalToNumber).filter((part): part is number => part !== null);
    if (!parts.length) return null;
    const decimal = Math.abs(parts[0]) + (parts[1] ?? 0) / 60 + (parts[2] ?? 0) / 3600;
    if (parts[0] < 0) sign *= -1;
    return decimal * sign;
  }

  if (typeof value === "string") {
    const compactDirection = value.match(/[NSEW]/i)?.[0]?.toUpperCase();
    if (compactDirection === "S" || compactDirection === "W") sign = -1;
    const nums = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (!nums.length) return null;
    const decimal = nums.length >= 2
      ? Math.abs(nums[0]) + nums[1] / 60 + (nums[2] ?? 0) / 3600
      : Math.abs(nums[0]);
    if (nums[0] < 0) sign *= -1;
    return decimal * sign;
  }

  return rationalToNumber(value);
};

const buildGpsPoint = (latValue: unknown, lonValue: unknown, latRef?: unknown, lonRef?: unknown): GpsPoint | null => {
  const latitude = dmsToDecimal(latValue, latRef);
  const longitude = dmsToDecimal(lonValue, lonRef);
  return latitude !== null && longitude !== null && isValidGpsPoint(latitude, longitude)
    ? { latitude, longitude }
    : null;
};

const findNestedGps = (data: unknown): GpsPoint | null => {
  const seen = new WeakSet<object>();
  const visit = (node: unknown): GpsPoint | null => {
    if (!isRecord(node)) return null;
    if (seen.has(node)) return null;
    seen.add(node);

    const entries = Object.entries(node);
    const pick = (...keys: string[]) => {
      const wanted = keys.map((key) => key.toLowerCase());
      return entries.find(([key]) => wanted.includes(key.replace(/[\s_-]/g, "").toLowerCase()))?.[1];
    };
    const direct = buildGpsPoint(
      pick("latitude", "gpslatitude"),
      pick("longitude", "gpslongitude"),
      pick("gpslatituderef", "latituderef"),
      pick("gpslongituderef", "longituderef")
    );
    if (direct) return direct;

    for (const value of entries.map(([, v]) => v)) {
      const nested = visit(value);
      if (nested) return nested;
    }
    return null;
  };
  return visit(data);
};

const parseJpegExifGps = (buffer: ArrayBuffer): GpsPoint | null => {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = view.getUint8(offset + 1);
    if (marker === 0xda || marker === 0xd9) break;
    const length = view.getUint16(offset + 2, false);
    const payload = offset + 4;
    if (marker === 0xe1 && length >= 8) {
      const header = String.fromCharCode(...new Uint8Array(buffer, payload, 6));
      if (header === "Exif\0\0") {
        const tiff = payload + 6;
        const little = view.getUint16(tiff, false) === 0x4949;
        const readU16 = (pos: number) => view.getUint16(pos, little);
        const readU32 = (pos: number) => view.getUint32(pos, little);
        if (readU16(tiff + 2) !== 42) return null;

        const readAscii = (pos: number, count: number) =>
          String.fromCharCode(...new Uint8Array(buffer, pos, Math.max(0, count - 1))).replace(/\0/g, "");
        const readRational = (pos: number) => {
          const numerator = readU32(pos);
          const denominator = readU32(pos + 4);
          return denominator ? numerator / denominator : 0;
        };
        const readValue = (entry: number) => {
          const type = readU16(entry + 2);
          const count = readU32(entry + 4);
          const bytes = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8][type] * count;
          const valuePos = bytes <= 4 ? entry + 8 : tiff + readU32(entry + 8);
          if (valuePos < 0 || valuePos >= view.byteLength) return null;
          if (type === 2) return readAscii(valuePos, count);
          if (type === 5) return Array.from({ length: count }, (_, i) => readRational(valuePos + i * 8));
          if (type === 3) return count === 1 ? readU16(valuePos) : Array.from({ length: count }, (_, i) => readU16(valuePos + i * 2));
          if (type === 4) return count === 1 ? readU32(valuePos) : Array.from({ length: count }, (_, i) => readU32(valuePos + i * 4));
          return null;
        };
        const readIfd = (ifdOffset: number) => {
          const start = tiff + ifdOffset;
          const count = readU16(start);
          const tags: Record<number, unknown> = {};
          for (let i = 0; i < count; i += 1) {
            const entry = start + 2 + i * 12;
            tags[readU16(entry)] = readValue(entry);
          }
          return tags;
        };

        const ifd0 = readIfd(readU32(tiff + 4));
        if (!ifd0[0x8825]) return null;
        const gps = readIfd(Number(ifd0[0x8825]));
        return buildGpsPoint(gps[0x0002], gps[0x0004], gps[0x0001], gps[0x0003]);
      }
    }
    offset += 2 + length;
  }
  return null;
};

const parseXmpGps = (buffer: ArrayBuffer): GpsPoint | null => {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer.slice(0, Math.min(buffer.byteLength, 1024 * 1024)));
  const read = (name: string) =>
    text.match(new RegExp(`${name}=["']([^"']+)["']`, "i"))?.[1] ??
    text.match(new RegExp(`<[^>]*${name}[^>]*>([^<]+)<`, "i"))?.[1];
  return buildGpsPoint(read("GPSLatitude"), read("GPSLongitude"));
};

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

      let metadata: Record<string, unknown> | null = null;
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

      try {
        const gpsOnly = await exifr.gps(source);
        if (gpsOnly) gps = buildGpsPoint(gpsOnly.latitude, gpsOnly.longitude);
      } catch {
        // Continue with metadata/manual fallbacks below.
      }

      // Fallback to merged metadata if dedicated parser missed it.
      if (!gps && metadata) {
        gps = findNestedGps(metadata);
      }

      // Last-resort browser-independent parsers for mobile uploads where exifr misses GPS.
      if (!gps && buffer) {
        try {
          gps = parseJpegExifGps(buffer) ?? parseXmpGps(buffer);
        } catch {
          // Keep the image loaded even if GPS parsing fails.
        }
      }

      if (!gps && import.meta.env.DEV) {
        console.info("MetaLens: GPS not found", {
          name: file.name,
          type: file.type,
          size: file.size,
          metadataKeys: metadata ? Object.keys(metadata).slice(0, 80) : [],
        });
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
