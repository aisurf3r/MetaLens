export interface ImageFile {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  metadata: Record<string, any> | null;
  gps: { latitude: number; longitude: number } | null;
  thumbnail?: string;
}
