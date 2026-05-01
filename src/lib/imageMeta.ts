import { ImageFile } from "@/types/image";

export function exportImageMetadata(img: ImageFile) {
  const data = {
    name: img.name,
    size: img.size,
    metadata: img.metadata,
    gps: img.gps,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${img.name.replace(/\.[^.]+$/, "")}-metadata.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Strip metadata by re-encoding the image through a canvas.
 * The resulting file has no EXIF/GPS/IPTC/XMP data.
 */
export async function downloadCleanCopy(img: ImageFile): Promise<void> {
  const bitmap = await createImageBitmap(img.file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const isPng = /\.png$/i.test(img.name) || img.file.type === "image/png";
  const mime = isPng ? "image/png" : "image/jpeg";
  const ext = isPng ? "png" : "jpg";
  const quality = isPng ? undefined : 0.95;

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), mime, quality)
  );

  const baseName = img.name.replace(/\.[^.]+$/, "");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}-clean.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
